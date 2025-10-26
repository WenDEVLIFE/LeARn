import os
import json
import time
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage

# CONFIG
SERVICE_ACCOUNT_PATH = r"D:\laragon\www\LeARn\serviceaccount.json"
DATA_JSON_PATH = r"D:\laragon\www\LeARn\data.json"
ASSETS_IMAGES_DIR = r"D:\laragon\www\LeARn\assets\thumb"
COLLECTION = "models"
BUCKET_NAME = "learn-9fd4e.firebasestorage.app"
BATCH_SIZE = 500

def init_firestore():
    try:
        firebase_admin.get_app()
    except ValueError:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
    return firestore.client()

def init_storage_client():
    return storage.Client.from_service_account_json(SERVICE_ACCOUNT_PATH)

def upload_image(storage_client: storage.Client, local_path: str, dest_folder="images") -> Optional[dict]:
    if not os.path.isfile(local_path):
        print("Missing local image:", local_path)
        return None
    bucket = storage_client.bucket(BUCKET_NAME)
    filename = os.path.basename(local_path)
    dest_name = f"{dest_folder}/{int(time.time()*1000)}_{filename}"
    blob = bucket.blob(dest_name)
    try:
        blob.upload_from_filename(local_path)
        try:
            blob.make_public()
            url = blob.public_url
        except Exception:
            url = blob.generate_signed_url(expiration=int(time.time()) + 3600 * 24 * 365)
        return {"filename": filename, "path": dest_name, "url": url}
    except Exception as e:
        print(f"Upload failed for {local_path}: {e}")
        return None

def main():
    db = init_firestore()
    storage_client = init_storage_client()

    with open(DATA_JSON_PATH, "r", encoding="utf-8") as f:
        rows = json.load(f)
    if not isinstance(rows, list):
        print("data.json must be an array")
        return

    # build mapping name -> thumb filename (if present)
    name_to_thumb = {}
    for r in rows:
        name = r.get("Class") or r.get("name")
        thumb = r.get("Thumb") or r.get("thumb")
        if name and thumb:
            name_to_thumb[name] = thumb

    if not name_to_thumb:
        print("No Thumb entries found in data.json")
        return

    # upload images and produce mapping name -> uploaded image object
    uploaded_map = {}
    for name, thumb in name_to_thumb.items():
        local_img = os.path.join(ASSETS_IMAGES_DIR, thumb)
        uploaded = upload_image(storage_client, local_img)
        if uploaded:
            uploaded_map[name] = uploaded
            print("Uploaded image for", name, "->", uploaded["path"])
        else:
            print("Skipped image for", name)

    if not uploaded_map:
        print("No images uploaded; nothing to update.")
        return

    # fetch all docs and update those matching uploaded_map
    docs = list(db.collection(COLLECTION).stream())
    to_update = []
    for d in docs:
        data = d.to_dict() or {}
        doc_name = data.get("name")
        if doc_name in uploaded_map:
            to_update.append((d.reference, uploaded_map[doc_name]))

    if not to_update:
        print("No matching documents found to update.")
        return

    print(f"Updating {len(to_update)} documents...")
    batch = db.batch()
    updated_count = 0
    batches_committed = 0
    for i, (ref, image_obj) in enumerate(to_update, start=1):
        batch.update(ref, {"image": image_obj, "updatedAt": firestore.SERVER_TIMESTAMP})
        updated_count += 1
        if i % BATCH_SIZE == 0:
            batch.commit()
            batches_committed += 1
            print(f"Committed batch {batches_committed} - updated {updated_count}")
            batch = db.batch()
    # commit remaining
    batch.commit()
    batches_committed += 1
    print(f"Committed final batch {batches_committed} - total updated {updated_count}")

if __name__ == "__main__":
    main()