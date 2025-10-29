import firebase_admin
from firebase_admin import credentials, firestore, storage
from pathlib import Path
from urllib.parse import quote_plus
import os

SERVICE_ACCOUNT = "serviceaccount.json"
BUCKET_NAME = "learn-9fd4e.firebasestorage.app"  # same bucket used previously
PREFIX = "targets/"

def init_firebase():
    cred = credentials.Certificate(SERVICE_ACCOUNT)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred, {"storageBucket": BUCKET_NAME})
    return firestore.client(), storage.bucket()

def make_download_url(bucket_name: str, blob):
    # prefer firebase download token if present (matches firebase console URL pattern)
    md = blob.metadata or blob._properties.get("metadata", {}) if hasattr(blob, "_properties") else blob.metadata or {}
    token = None
    if isinstance(md, dict):
        token = md.get("firebaseStorageDownloadTokens") or md.get("firebaseDownloadTokens")
    if token:
        return f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}/o/{quote_plus(blob.name)}?alt=media&token={token}"
    # fallback to public URL (if file is public) or gs:// path
    if getattr(blob, "public_url", None):
        return blob.public_url
    return f"gs://{bucket_name}/{blob.name}"

def main():
    db, bucket = init_firebase()
    print("Listing blobs under", PREFIX)
    blobs = list(bucket.list_blobs(prefix=PREFIX))
    if not blobs:
        print("No blobs found under", PREFIX)
        return

    updated_docs = 0
    skipped = 0
    for blob in blobs:
        # blob.name example: "targets/1761717104851_Cat.png"
        fname = Path(blob.name).name  # "1761717104851_Cat.png"
        # original filename after timestamp (if present)
        if "_" in fname:
            orig_fname = fname.split("_", 1)[1]
        else:
            orig_fname = fname
        model_name = Path(orig_fname).stem  # "Cat"

        url = make_download_url(bucket.name, blob)
        target_card = {
            "filename": orig_fname,
            "path": blob.name,
            "url": url
        }

        docs = list(db.collection("models").where("name", "==", model_name).stream())
        if not docs:
            print(f"No model document with name='{model_name}' -> skipping (blob {blob.name})")
            skipped += 1
            continue

        for doc in docs:
            db.collection("models").document(doc.id).update({
                "targetCard": target_card,
                "updatedAt": firestore.SERVER_TIMESTAMP
            })
            print(f"Updated model '{model_name}' (doc {doc.id}) -> targetCard {orig_fname}")
            updated_docs += 1

    print(f"Done. Updated {updated_docs} model docs. Skipped {skipped} blobs with no matching model.")

if __name__ == "__main__":
    main()