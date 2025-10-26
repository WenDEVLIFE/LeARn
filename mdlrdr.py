import os
import trimesh

# Folder containing GLB files
folder = "assets/glb"

# Dictionary to store results
model_info = {}

for filename in os.listdir(folder):
    if filename.lower().endswith(".glb"):
        path = os.path.join(folder, filename)
        try:
            mesh = trimesh.load(path)
            bounds = mesh.bounds.tolist()  # [[minX, minY, minZ], [maxX, maxY, maxZ]]
            size = mesh.extents.tolist()  # [width, height, depth]
            center = mesh.centroid.tolist()
            
            model_info[filename] = {
                "bounds": bounds,
                "size": size,
                "center": center
            }
            
            print(f"{filename}: size={size}, center={center}")
        except Exception as e:
            print(f"Error loading {filename}: {e}")

# Optional: save results to JSON for easy use in JS/AR
import json
with open("glb_model_info.json", "w") as f:
    json.dump(model_info, f, indent=2)

print("\n✅ Scanned all GLB files. JSON saved to glb_model_info.json")
