import time
import mimetypes
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore, storage

# Init Firebase app (uses serviceaccount.json in project root)
SERVICE_ACCOUNT = "serviceaccount.json"
BUCKET_NAME = "learn-9fd4e.firebasestorage.app"  # change if needed
TARGETS_DIR = Path("assets/targets")

def init_firebase():
    cred = credentials.Certificate(SERVICE_ACCOUNT)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred, {"storageBucket": BUCKET_NAME})
    db = firestore.client()
    bucket = storage.bucket()
    return db, bucket

def upload_and_update_targets(dir_path: Path = TARGETS_DIR):
    db, bucket = init_firebase()
    if not dir_path.exists() or not dir_path.is_dir():
        print(f"Targets folder not found: {dir_path.resolve()}")
        return

    files = [p for p in dir_path.iterdir() if p.is_file()]
    if not files:
        print("No files in targets folder.")
        return

    total = 0
    updated = 0
    created = 0

    for f in files:
        total += 1
        orig_name = f.name  # e.g. "Cat.png"
        upload_name = f"targets/{int(time.time() * 1000)}_{orig_name}"
        mime = mimetypes.guess_type(str(f))[0] or "application/octet-stream"

        blob = bucket.blob(upload_name)
        print(f"Uploading {orig_name} -> {upload_name} ...")
        blob.upload_from_filename(str(f), content_type=mime)

        # Make public (simpler) and get URL
        try:
            blob.make_public()
            url = blob.public_url
        except Exception:
            # fallback: signed url (short-lived) if ACL not allowed; still proceed
            url = blob.generate_signed_url(expiration=3600)

        # Try to find matching Firestore docs by 'filename' or 'name'
        docs = list(db.collection("targets").where("filename", "==", orig_name).stream())
        if not docs:
            docs = list(db.collection("targets").where("name", "==", orig_name).stream())

        data = {
            "filename": orig_name,
            "path": upload_name,
            "url": url,
            "targetCard": {
                "filename": orig_name,
                "path": upload_name,
                "url": url
            },
            "updatedAt": firestore.SERVER_TIMESTAMP
        }

        if docs:
            for doc in docs:
                db.collection("targets").document(doc.id).update(data)
                print(f"Updated Firestore doc {doc.id} for '{orig_name}'")
                updated += 1
        else:
            db.collection("targets").add(data)
            print(f"Created new Firestore doc for '{orig_name}'")
            created += 1

        # small delay to ensure unique timestamps for upload_name
        time.sleep(0.05)

    print(f"Done. Processed {total} files. Updated {updated} docs. Created {created} docs.")

if __name__ == "__main__":
    upload_and_update_targets()