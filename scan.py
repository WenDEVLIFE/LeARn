import os
import json
import trimesh

glb_folder = "assets/glb"
thumb_folder = "assets/thumb"
sound_folder = "assets/sounds"  # new

model_info = {}
thumb_files = []
sound_files = []  # new

# Scan GLB files and collect mesh info (print filenames only)
if os.path.isdir(glb_folder):
    for filename in sorted(os.listdir(glb_folder)):
        if filename.lower().endswith(".glb"):
            path = os.path.join(glb_folder, filename)
            try:
                mesh = trimesh.load(path, force='mesh')
                bounds = mesh.bounds.tolist() if hasattr(mesh, "bounds") else None
                size = mesh.extents.tolist() if hasattr(mesh, "extents") else None
                center = mesh.centroid.tolist() if hasattr(mesh, "centroid") else None

                model_info[filename] = {
                    "bounds": bounds,
                    "size": size,
                    "center": center
                }
                print(filename)  # only print filename
            except Exception:
                # skip printing errors to keep output filenames-only
                continue
else:
    # no prints other than filenames per request
    pass

# Scan thumbnail folder and print filenames only
if os.path.isdir(thumb_folder):
    for filename in sorted(os.listdir(thumb_folder)):
        if not filename.startswith("."):
            thumb_files.append(filename)
            print(filename)  # only print filename
else:
    pass

# Scan sound folder and print filenames only
AUDIO_EXTS = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aac"}
if os.path.isdir(sound_folder):
    for filename in sorted(os.listdir(sound_folder)):
        if filename.startswith("."):
            continue
        ext = os.path.splitext(filename)[1].lower()
        if ext in AUDIO_EXTS:
            sound_files.append(filename)
            print(filename)  # only print filename
else:
    pass

# Save combined results
out = {
    "models": model_info,
    "thumbs": thumb_files,
    "sounds": sound_files  # new
}

with open("glb_model_info.json", "w") as f:
    json.dump(out, f, indent=2)
