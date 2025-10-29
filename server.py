import sys
import os
from flask import Flask, render_template, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import requests
from urllib.parse import urlparse, unquote, quote_plus

app = Flask(__name__, static_folder="static", template_folder="templates")

def init_firebase():
    cred_path = os.path.join(os.path.dirname(__file__), "serviceaccount.json")
    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)

def _safe_filename_from_url(url, fallback):
    p = urlparse(url)
    path = unquote(p.path)
    name = os.path.basename(path)
    if not name:
        name = fallback
    name = os.path.basename(name)
    return name

def _download_if_needed(url, dest_dir, filename):
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, filename)
    if os.path.exists(dest_path):
        return dest_path
    resp = requests.get(url, stream=True, timeout=30)
    resp.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    return dest_path

def fetch_all_models_grouped():
    init_firebase()
    db = firestore.client()
    try:
        docs = list(db.collection("models").stream())
    except Exception as e:
        print("Error reading models from Firestore:", e, file=sys.stderr)
        docs = []

    groups = {}
    static_root = os.path.join(app.root_path, app.static_folder)
    targets_dir = os.path.join(static_root, "targets")
    images_dir = os.path.join(static_root, "images")
    audio_dir = os.path.join(static_root, "audio")
    models_3d_dir = os.path.join(static_root, "models")  # optional for 3D downloads

    failed_download_ids = []

    for doc in docs:
        data = doc.to_dict() or {}
        doc_id = doc.id
        name = data.get("name", "unknown").strip()
        category = (data.get("category") or "uncategorized").lower()

        # --- model (3D) info ---
        model_info = data.get("model") or {}
        model_url = model_info.get("url")
        model_filename = model_info.get("filename")

        # --- targetCard (used by .mind ordering) ---
        target = data.get("targetCard") or {}
        target_filename = target.get("filename")
        target_url = target.get("url")

        # --- image (display image to user) ---
        image = data.get("image") or {}
        image_filename = image.get("filename")
        image_url = image.get("url")

        # --- audio (optional) ---
        audio = data.get("audio") or {}
        audio_filename = audio.get("filename")
        audio_url = audio.get("url")

        entry = {
            "id": doc_id,
            "name": name,
            "category": category,
            "model": model_info,
            "targetCard": dict(target),  # copy
            "image": dict(image),
            "audio": dict(audio),
        }

        # Resolve & download targetCard to static/targets (so the .mind mapping remains consistent)
        if target_url:
            if not target_filename:
                target_filename = _safe_filename_from_url(target_url, f"{name}_target.png")
            try:
                local_path = _download_if_needed(target_url, targets_dir, target_filename)
                entry["targetCard"]["local"] = "/static/targets/" + os.path.basename(local_path)
            except Exception as e:
                failed_download_ids.append(doc_id)
                print(f"Warning: failed to download target (id={doc_id}) {target_url} - {e}", file=sys.stderr)
                entry["targetCard"]["local"] = target_url
        else:
            if target_filename:
                # assume path-based: build static path
                entry["targetCard"]["local"] = "/static/targets/" + os.path.basename(target_filename)
            else:
                entry["targetCard"]["local"] = None
        entry["targetCard"]["filename"] = target_filename or entry["targetCard"].get("filename")

        # Resolve & download image (display image) to static/images
        if image_url:
            if not image_filename:
                image_filename = _safe_filename_from_url(image_url, f"{name}.jpg")
            try:
                local_img = _download_if_needed(image_url, images_dir, image_filename)
                entry["image"]["local"] = "/static/images/" + os.path.basename(local_img)
            except Exception as e:
                failed_download_ids.append(doc_id)
                print(f"Warning: failed to download image (id={doc_id}) {image_url} - {e}", file=sys.stderr)
                entry["image"]["local"] = image_url
        else:
            if image_filename:
                entry["image"]["local"] = "/static/images/" + os.path.basename(image_filename)
            else:
                entry["image"]["local"] = None
        entry["image"]["filename"] = image_filename or entry["image"].get("filename")

        # Resolve & download audio to static/audio (so client loads from static)
        if audio_url:
            if not audio_filename:
                audio_filename = _safe_filename_from_url(audio_url, f"{name}.mp3")
            try:
                local_audio = _download_if_needed(audio_url, audio_dir, audio_filename)
                entry["audio"]["local"] = "/static/audio/" + os.path.basename(local_audio)
            except Exception as e:
                # don't treat audio failure as fatal; keep original url for fallback
                print(f"Notice: failed to download audio (id={doc_id}) {audio_url} - {e}", file=sys.stderr)
                entry["audio"]["local"] = audio_url
        else:
            if audio_filename:
                entry["audio"]["local"] = "/static/audio/" + os.path.basename(audio_filename)
            else:
                entry["audio"]["local"] = None
        entry["audio"]["filename"] = audio_filename or entry["audio"].get("filename")

        # Resolve 3D model src for template asset loading (prefer model.url)
        model_src = None
        if model_url:
            model_src = model_url
        elif model_filename:
            model_src = "/static/models/" + os.path.basename(model_filename)
        entry["src"] = model_src

        groups.setdefault(category, []).append(entry)

    # Sort each category by target filename (alphabetical), fallback to name
    for k in groups:
        def sort_key(x):
            fn = (x.get("targetCard") or {}).get("filename") or ""
            fn = os.path.basename(fn).lower()
            if fn:
                return fn
            return x.get("name", "").lower()
        groups[k].sort(key=sort_key)

    if failed_download_ids:
        print("Failed to download (some) ids:", ", ".join(set(failed_download_ids)), file=sys.stderr)

    # print loaded summary
    if groups:
        for cat in sorted(groups.keys(), key=lambda x: x.lower()):
            names = [m.get("name", "") for m in groups[cat]]
            print(f"Category {cat.capitalize()} Loaded: {len(names)} model(s)", file=sys.stderr)

    return dict(sorted(groups.items(), key=lambda kv: kv[0].lower()))

# new endpoint to mark a model activated
@app.route("/activate", methods=["POST"])
def activate():
    init_firebase()
    db = firestore.client()
    data = request.get_json(silent=True) or {}
    doc_id = data.get("id")
    if not doc_id:
        return jsonify({"ok": False, "error": "missing id"}), 400
    try:
        ref = db.collection("models").document(doc_id)
        ref.update({
            "activated": True,
            "updatedAt": firestore.SERVER_TIMESTAMP
        })
        return jsonify({"ok": True})
    except Exception as e:
        print("Error activating model", doc_id, e, file=sys.stderr)
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/test")
def test():
    return render_template("test.html")

@app.route("/")
def index():
    # load all models grouped by category
    models_by_category = fetch_all_models_grouped()
    categories = sorted(models_by_category.keys())

    requested = request.args.get("category")
    current_category = requested.lower() if requested and requested.lower() in models_by_category else (categories[0] if categories else "uncategorized")
    current_models = models_by_category.get(current_category, [])

    def enrich_models_for_links(models):
        out = []
        for m in models:
            model_src = m.get("src", "")
            if model_src and model_src.startswith("/"):
                abs_src = request.host_url.rstrip("/") + model_src
            else:
                abs_src = model_src
            scene_link = "https://arvr.google.com/scene-viewer/1.0?file=" + quote_plus(abs_src) + "&mode=ar_preferred"
            intent_link = ("intent://arvr.google.com/scene-viewer/1.0?file=" + quote_plus(abs_src) +
                           "&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end")
            entry = dict(m)
            entry["abs_src"] = abs_src
            entry["scene_link"] = scene_link
            entry["intent_link"] = intent_link
            out.append(entry)
        return out

    current_models_enriched = enrich_models_for_links(current_models)

    return render_template("index.html",
                           categories=categories,
                           current_category=current_category,
                           models=current_models_enriched)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)