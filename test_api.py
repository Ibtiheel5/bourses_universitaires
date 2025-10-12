import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api/users"
SESSION = requests.Session()

def test_api():
    print("=== DIAGNOSTIC API CAMPUSBOURSES ===\n")
    
    # 1. Test CSRF
    print("1. 🔄 Test endpoint CSRF...")
    try:
        csrf_response = SESSION.get(f"{BASE_URL}/csrf/")
        print(f"   Status: {csrf_response.status_code}")
        print(f"   Cookies reçus: {dict(csrf_response.cookies)}")
        print(f"   Headers: {dict(csrf_response.headers)}\n")
    except Exception as e:
        print(f"   ❌ ERREUR: {e}\n")
        return

    # 2. Test status auth
    print("2. 🔐 Test endpoint status...")
    try:
        status_response = SESSION.get(f"{BASE_URL}/status/")
        print(f"   Status: {status_response.status_code}")
        if status_response.status_code == 200:
            data = status_response.json()
            print(f"   ✅ Réponse: {json.dumps(data, indent=2)}")
        else:
            print(f"   ❌ Erreur: {status_response.text}")
        print()
    except Exception as e:
        print(f"   ❌ ERREUR: {e}\n")

    # 3. Test endpoint /me/
    print("3. 👤 Test endpoint /me/...")
    try:
        me_response = SESSION.get(f"{BASE_URL}/me/")
        print(f"   Status: {me_response.status_code}")
        if me_response.status_code == 200:
            data = me_response.json()
            print(f"   ✅ Utilisateur connecté: {json.dumps(data, indent=2)}")
        else:
            print(f"   ℹ️  Aucun utilisateur connecté: {me_response.text}")
        print()
    except Exception as e:
        print(f"   ❌ ERREUR: {e}\n")

    # 4. Vérifier les cookies de session
    print("4. 🍪 Cookies de session:")
    print(f"   Cookies dans la session: {SESSION.cookies.get_dict()}")
    print()

if __name__ == "__main__":
    test_api()