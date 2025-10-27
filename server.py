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

    # group by category
    groups = {}
    static_models_dir = os.path.join(app.root_path, app.static_folder, "models")

    for doc in docs:
        data = doc.to_dict() or {}
        doc_id = doc.id
        name = data.get("name", "unknown")
        category = (data.get("category") or "uncategorized").lower()
        model_info = data.get("model", {}) or {}
        src_url = model_info.get("url")
        filename = model_info.get("filename")

        if src_url:
            if not filename:
                filename = _safe_filename_from_url(src_url, f"{name}.glb")
            if not filename.lower().endswith(".glb"):
                filename = f"{filename}.glb"
            try:
                local_path = _download_if_needed(src_url, static_models_dir, filename)
                web_src = f"/static/models/{os.path.basename(local_path)}"
            except Exception as e:
                print("Warning: failed to download model", src_url, "-", e, file=sys.stderr)
                web_src = src_url
        else:
            filename = filename or f"{name}.glb"
            web_src = f"/static/models/{filename}"

        entry = {
            "id": doc_id,
            "name": name,
            "category": category,
            "src": web_src,
            # scene and intent links will be filled later (need request.host_url)
        }
        groups.setdefault(category, []).append(entry)

    # sort groups by name for consistent UI
    for k in groups:
        groups[k].sort(key=lambda x: x.get("name", "").lower())

    return groups

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

@app.route("/")
def index():
    # load all models grouped by category
    models_by_category = fetch_all_models_grouped()
    categories = sorted(models_by_category.keys())

    # choose category from query param (default to first category if present)
    requested = request.args.get("category")
    current_category = requested.lower() if requested and requested.lower() in models_by_category else (categories[0] if categories else "uncategorized")
    current_models = models_by_category.get(current_category, [])

    # compute absolute URLs and Scene Viewer links for every model (so template can use them)
    def enrich_models_for_links(models):
        out = []
        for m in models:
            src = m.get("src", "")
            if src.startswith("/"):
                abs_src = request.host_url.rstrip("/") + src
            else:
                abs_src = src
            scene_link = "https://arvr.google.com/scene-viewer/1.0?file=" + quote_plus(abs_src) + "&mode=ar_preferred"
            intent_link = ("intent://arvr.google.com/scene-viewer/1.0?file=" + quote_plus(abs_src) +
                           "&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end")
            entry = dict(m)  # copy so we don't mutate original grouping
            entry["abs_src"] = abs_src
            entry["scene_link"] = scene_link
            entry["intent_link"] = intent_link
            out.append(entry)
        return out

    # enrich only the current category models for page load
    current_models_enriched = enrich_models_for_links(current_models)

    # pass categories, current_category, and models for current category
    return render_template("index.html",
                           categories=categories,
                           current_category=current_category,
                           models=current_models_enriched)

if __name__ == "__main__":
    # pip install firebase-admin flask requests
    app.run(host="0.0.0.0", port=5000, debug=True)