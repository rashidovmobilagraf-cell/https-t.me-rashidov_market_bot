import json
import os
import urllib.request

SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co"
SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def load_json(filepath):
    if not os.path.exists(filepath):
        return {}
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def post_data(endpoint, payload):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=HEADERS, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            pass
    except Exception as e:
        print(f"Error inserting into {endpoint}: {e}")

def migrate_users():
    users = load_json("users.json")
    for tid, data in users.items():
        payload = {
            "telegram_id": int(tid),
            "lang": data.get("lang"),
            "name": data.get("name"),
            "phone": data.get("phone")
        }
        post_data("users", payload)
    print("Users migrated.")

def migrate_products():
    products = load_json("../webapp/public/products.json")
    for data in products:
        payload = {
            "id": data.get("id"),
            "name": data.get("name"),
            "price": str(data.get("price")),
            "category": data.get("category"),
            "image": data.get("image")
        }
        post_data("products", payload)
    print("Products migrated.")

def migrate_orders():
    orders = load_json("orders.json")
    for data in orders:
        payload = {
            "order_id": data.get("order_id"),
            "user_id": int(data.get("user_id")),
            "items": data.get("items", []),
            "total": data.get("total", 0),
            "delivery_type": data.get("delivery_type"),
            "payment_type": data.get("payment_type"),
            "address": data.get("address"),
            "comment": data.get("comment"),
            "status": data.get("status", "pending"),
            "date": data.get("date")
        }
        post_data("orders", payload)
    print("Orders migrated.")

if __name__ == "__main__":
    print("Starting migration...")
    migrate_users()
    migrate_products()
    migrate_orders()
    print("Migration complete!")
