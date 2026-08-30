import urllib.request
import json
import time

BASE = "http://localhost:8000"

def post(path, body, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", data=json.dumps(body).encode(), headers=headers, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

def get(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", headers=headers, method="GET")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

print("="*70)
print("[TEST] 1. Testing FastAPI Health Check Endpoint (/api/health)")
print("="*70)
health = get("/api/health")
print("Health Response:", health)
assert health["status"] == "healthy"

print("\n" + "="*70)
print("[TEST] 2. Testing FastAPI Auth Registration & Login (/api/auth)")
print("="*70)
email = f"fastapi_user_{int(time.time())}@clarify.ai"
reg = post("/api/auth/register", {"email": email, "password": "password123", "name": "FastAPI Tester"})
print("Registered:", reg["user"]["email"])
token = reg["token"]

login = post("/api/auth/login", {"email": email, "password": "password123"})
print("Logged in successfully. User ID:", login["user"]["id"])

print("\n" + "="*70)
print("[TEST] 3. Testing FastAPI Analysis Run with LangGraph Pipeline")
print("="*70)
payload = {
    "productName": "OnePlus Nord Buds 2",
    "category": "Electronics",
    "priceMin": 1500,
    "priceMax": 3500,
    "platform": "both",
    "competitors": [],
    "autoFind": True,
}
start = post("/api/analysis/start", payload, token)
run_id = start["runId"]
print(f"Analysis started. Run ID: {run_id}")

for i in range(20):
    time.sleep(1.5)
    st = get(f"/api/analysis/{run_id}/status", token)
    node = st.get("currentNode")
    prog = st.get("progress", 0)
    status = st.get("status")
    print(f"  Step {i+1:02d}: Node={node:<25} Progress={prog:.0%} Status={status}")
    if status in ("completed", "failed"):
        break

print("\n" + "="*70)
print("[TEST] 4. Testing FastAPI Result Endpoint (/api/analysis/{id}/result)")
print("="*70)
result = get(f"/api/analysis/{run_id}/result", token)
print("Product:", result.get("yourProduct", {}).get("name"))
print("Competitors Found:", len(result.get("competitors", [])))
for c in result.get("competitors", []):
    print(f"  - {c.get('name')} | Price: ₹{c.get('price')} | Rating: {c.get('rating')}★")

print("\nVerdict:")
print(result.get("insight", {}).get("verdictText"))

print("\nActionable Opportunities:")
for op in result.get("insight", {}).get("opportunities", []):
    print(f"  [{op.get('impact').upper()}] {op.get('title')} — {op.get('rationale')}")

print("\nMetrics:")
m = result.get("metrics", {})
print(f"  Total Cost: ${m.get('totalCost', 0):.4f}")
print(f"  Total Latency: {m.get('totalLatencyMs', 0)} ms")
print(f"  Node Execution Logs: {len(m.get('nodeLogs', []))}")
print("="*70)
print("ALL FASTAPI + UVICORN + LANGGRAPH E2E TESTS PASSED!")
print("="*70)
