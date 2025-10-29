import firebase_admin
from firebase_admin import credentials, firestore
import json

def fetch_all_animals():
    cred = credentials.Certificate("serviceaccount.json")
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)

    db = firestore.client()

    # adjust these to match how categories are stored in your documents
    categories = ["animal", "animals", "Animal", "Animals"]

    print("Fetching documents from 'models' collection with category in", categories, "...\n")
    docs = db.collection("models").where("category", "in", categories).stream()

    found = False
    for doc in docs:
        data = doc.to_dict() or {}
        print(f"Document ID: {doc.id}")
        # pretty-print all fields of the document (timestamps, datetimes will be stringified)
        print(json.dumps(data, indent=2, default=str))
        print("-" * 60)
        found = True

    if not found:
        print("No animal documents found in 'models' collection.")

if __name__ == "__main__":
    fetch_all_animals()
