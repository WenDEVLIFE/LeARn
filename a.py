import firebase_admin
from firebase_admin import credentials, firestore

def fetch_all_model_names():
    cred = credentials.Certificate("serviceaccount.json")
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)

    db = firestore.client()

    print("Fetching all documents from 'models' collection...\n")
    docs = db.collection("models").stream()

    found = False
    for doc in docs:
        data = doc.to_dict()
        name = data.get("name", "<no name>")
        category = data.get("category", "<no category>")
        print(f"{name} ({category})")
        found = True

    if not found:
        print("No documents found in 'models' collection.")

if __name__ == "__main__":
    fetch_all_model_names()
