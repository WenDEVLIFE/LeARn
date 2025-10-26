# language: python
import os
import time
from pathlib import Path
from typing import List, Dict, Optional

from google.cloud import storage
from google.cloud import firestore
from google.oauth2 import service_account

# --- CONFIG: update these ---
SERVICE_ACCOUNT_PATH = r"C:\path\to\serviceAccount.json"  # <-- set path to your service account JSON
LOCAL_ASSETS_DIR = r"d:\laragon\www\LeARn\assets"         # <-- set folder that contains .glb and .jpg files
FIREBASE_STORAGE_BUCKET = "learn-9fd4e.firebasestorage.app" # from firebaseConfig (override if needed)
FIRESTORE_COLLECTION = "models"
DEFAULT_DESCRIPTION = "d"
DEFAULT_ACTIVATED = True
DEFAULT_SET = 1
# -----------------------------

# Files list you gave (will be paired .glb <-> .jpg)
NAMES = [
    "Alligator",
    "Beagle",
    "Capuchin",
    "Cow",
    "Goat",
    "Horse",
    "Pig",
    "Rabbit",
    "Rooster",
    "Snake",
    "Tiger",
]

# optional audio mapping; user provided one example for cow
AUDIO_MAP: Dict[str, str] = {
    "Alligator": "audio/crocodile-groans.mp3",
    "Beagle": "audio/dog-bark-sound-effect-322989.mp3",
    "Capuchin": "audio/monkey-128368.mp3",
    "Goat": "audio/goat-sound-403453.mp3",
    "Horse": "audio/mixkit-scared-horse-neighing-85.wav",
    "Pig": "audio/pig-grunt-100272.mp3",
    "Rabbit": "audio/rabbit-sounds-358172.mp3",
    "Rooster": "audio/chicken-sound-402826.mp3",
    "Snake": "audio/snake-hiss-95241.mp3",
    "Tiger": "audio/tiger-attack-195840.mp3",
}

def init_clients(service_account_path: str, bucket_name: str):
    creds = service_account.Credentials.from_service_account_file(service_account_path)
    storage_client = storage.Client(credentials=creds, project=creds.project_id)
    firestore_client = firestore.Client(credentials=creds, project=creds.project_id)
    bucket = storage_client.bucket(bucket_name)
    return storage_client, bucket, firestore_client

def find_local_file(base_dir: Path, name: str, ext_choices: List[str]) -> Optional[Path]:
    for ext in ext_choices:
        p = base_dir / f"{name}.{ext}"
        if p.exists():
            return p
    # try case-insensitive search
    for p in base_dir.iterdir():
        if p.is_file() and p.stem.lower() == name.lower() and p.suffix.lstrip('.').lower() in [e.lower() for e in ext_choices]:
            return p
    return None

def upload_blob(bucket, source_path: Path, dest_path: str) -> str:
    blob = bucket.blob(dest_path)
    blob.upload_from_filename(str(source_path))
    # make public URL pattern for Firebase Storage isn't directly public; return gs path or storage path string
    # We store the storage path string (same as console path), matching your existing convention like "images/123_name.jpg"
    return dest_path

def ensure_not_exists(firestore_client, collection: str, name: str) -> bool:
    # returns True if doc with same name exists
    q = firestore_client.collection(collection).where("name", "==", name).limit(1).stream()
    for _ in q:
        return True
    return False

def create_model_docs(bucket, firestore_client, local_dir: Path, names: List[str]):
    for name in names:
        print(f"Processing: {name}")
        # check existing
        if ensure_not_exists(firestore_client, FIRESTORE_COLLECTION, name):
            print(f"  -> Document with name '{name}' already exists in '{FIRESTORE_COLLECTION}', skipping.")
            continue

        # find files
        img_file = find_local_file(local_dir, name, ["jpg", "jpeg", "png", "webp"])
        model_file = find_local_file(local_dir, name, ["glb", "gltf", "obj", "fbx"])
        if not model_file:
            print(f"  ! No 3D model found for {name}, skipping.")
            continue
        if not img_file:
            print(f"  ! No image found for {name}, continuing without image field.")

        timestamp_ms = int(time.time() * 1000)
        image_path = None
        model_path = None
        if img_file:
            dest_img = f"images/{timestamp_ms}_{img_file.name}"
            upload_blob(bucket, img_file, dest_img)
            image_path = dest_img

        if model_file:
            dest_model = f"3D/{timestamp_ms}_{model_file.name}"
            upload_blob(bucket, model_file, dest_model)
            model_path = dest_model

        audio_path = AUDIO_MAP.get(name)

        doc_payload = {
            "name": name,
            "description": DEFAULT_DESCRIPTION,
            "activated": DEFAULT_ACTIVATED,
            "set": DEFAULT_SET,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
        if image_path:
            doc_payload["image"] = image_path
        if model_path:
            doc_payload["model"] = model_path
        if audio_path:
            doc_payload["audio"] = audio_path

        # create doc
        doc_ref = firestore_client.collection(FIRESTORE_COLLECTION).document()
        doc_ref.set(doc_payload)
        print(f"  -> Created doc {doc_ref.id} with model={model_path} image={image_path} audio={audio_path}")

def main():
    sa = Path(SERVICE_ACCOUNT_PATH)
    assets = Path(LOCAL_ASSETS_DIR)
    if not sa.exists():
        raise SystemExit(f"Service account file not found: {sa}")
    if not assets.exists():
        raise SystemExit(f"Assets folder not found: {assets}")

    storage_client, bucket, firestore_client = init_clients(str(sa), FIREBASE_STORAGE_BUCKET)
    # confirm bucket existence
    try:
        _ = bucket.exists()
    except Exception as e:
        raise SystemExit(f"Failed to access bucket '{FIREBASE_STORAGE_BUCKET}': {e}")

    create_model_docs(bucket, firestore_client, assets, NAMES)
    print("Done.")

if __name__ == "__main__":
    main()
