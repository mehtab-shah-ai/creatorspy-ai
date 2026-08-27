#!/usr/bin/env python3
"""
Isolated test for FIX 2 + FIX 3.
"""

import json
import sys
import time
import urllib.request

BASE = "http://localhost:3000"

def post(path, body, token=None):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())

def get(path, token=None):
    url = f"{BASE}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())

print("=" * 70)
print("REGISTERING TEST USER")
print("=" * 70)
post("/api/auth/register", {
    "email": "test4@clarify.ai",
    "password": "test1234",
    "name": "Test Four",
})

login = post("/api/auth/login", {
    "email": "test4@clarify.ai",
    "password": "test1234",
})
token = login["token"]
print(f"Logged in. Token: {token[:40]}...")

# TEST 1
print()
print("=" * 70)
print("TEST 1: earbuds + Electronics + 500-1500 INR + auto-find")
print("=" * 70)
result = post("/api/analysis/start", {
    "productName": "wireless earbuds",
    "category": "Electronics",
    "priceMin": 500,
    "priceMax": 1500,
    "platform": "both",
    "competitors": [],
    "autoFind": True,
}, token)
print(f"Start: {json.dumps(result)}")
run_id = result.get("runId")
if not run_id:
    print("FAIL: no runId returned")
    sys.exit(1)

for i in range(30):
    time.sleep(2)
    status = get(f"/api/analysis/{run_id}/status", token)
    print(f"  [{i+1}] status={status['status']} progress={status.get('progress', 0):.2f} node={status.get('currentNode')}")
    if status["status"] in ("completed", "failed"):
        break

result_data = get(f"/api/analysis/{run_id}/result", token)
print()
print("RESULT:")
if "error" in result_data:
    print(f"  error: {result_data['error']}")
    if "competitors" not in result_data:
        sys.exit(0)
yp = result_data.get("yourProduct", {})
print(f"  yourProduct: {yp.get('productName', 'MISSING')}")
comps = result_data.get("competitors", [])
print(f"  competitors ({len(comps)}):")
for c in comps:
    print(f"    - {c.get('productName')} | price={c.get('price')} {c.get('currency')} | sourceUrl={c.get('sourceUrl')}")

print()
print("VERIFICATION — TEST 1:")
all_in_band = True
for c in comps:
    price = c.get("price")
    if price is None:
        print(f"  WARN: {c.get('productName')}: no price (acceptable in demo mode)")
        continue
    if 400 <= price <= 1800:
        print(f"  PASS: {c.get('productName')}: Rs.{price} — in price band")
    else:
        print(f"  FAIL: {c.get('productName')}: Rs.{price} — OUTSIDE price band")
        all_in_band = False

if all_in_band:
    print("  OVERALL: PASS — all competitors in price band")
else:
    print("  OVERALL: FAIL — some competitors outside price band")

# TEST 2
print()
print("=" * 70)
print("TEST 2: earbuds + Electronics + 50000-100000 INR (mismatched price)")
print("=" * 70)
result2 = post("/api/analysis/start", {
    "productName": "wireless earbuds",
    "category": "Electronics",
    "priceMin": 50000,
    "priceMax": 100000,
    "platform": "both",
    "competitors": [],
    "autoFind": True,
}, token)
print(f"Start: {json.dumps(result2)}")
run_id2 = result2.get("runId")
if not run_id2:
    print("FAIL: no runId returned")
    sys.exit(1)

for i in range(30):
    time.sleep(2)
    status2 = get(f"/api/analysis/{run_id2}/status", token)
    print(f"  [{i+1}] status={status2['status']} progress={status2.get('progress', 0):.2f} node={status2.get('currentNode')}")
    if status2["status"] in ("completed", "failed"):
        break

result_data2 = get(f"/api/analysis/{run_id2}/result", token)
err_msg = result_data2.get("error") or status2.get("errorMessage")
print()
print("VERIFICATION — TEST 2:")
print(f"  status: {status2.get('status')}")
print(f"  error: {err_msg}")
print(f"  competitors: {len(result_data2.get('competitors', []))}")
if err_msg and ("couldn't confidently identify" in err_msg.lower() or "couldn't confidently" in err_msg.lower()):
    print("  PASS: got expected 'couldn't confidently identify' message")
elif status2.get('status') == 'completed' and len(result_data2.get("competitors", [])) == 0:
    print("  PASS: pipeline completed but no competitors were scraped (verification rejected all)")
else:
    print("  WARN: did not get expected message — check dev log for verifier behavior")

print()
print("=" * 70)
print("CHECK DEV LOG FOR [serper] QUERY STRINGS — VERIFY site: RESTRICTION")
print("=" * 70)
print("Look for lines like:")
print('  [serper] Queries with site: restriction: [...]')
print('  [serper] DEMO MODE - would have sent queries: [...]')
print()
print("Test complete.")
