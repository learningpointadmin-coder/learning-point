#!/usr/bin/env python3
"""
=============================================================
 Learning Point — Google Sheets Connection Verifier
=============================================================
Yeh script confirm karega ki aapka Service Account us Sheet ko
read kar sakta hai jo aapne share ki hai.

USAGE (3 simple steps):
  1. pip install -r requirements.txt
  2. Apni downloaded JSON key ko is folder me rakho
     aur naam do: service-account.json
  3. python verify-google-sheets.py

Aap Sheet ID aur key ka path environment variable se bhi de sakte ho:
  SHEET_ID=xxxx GOOGLE_APPLICATION_CREDENTIALS=key.json python verify-google-sheets.py
=============================================================
"""

import sys
import os
import json

# ---- Configuration ----
SERVICE_ACCOUNT_FILE = os.environ.get(
    "GOOGLE_APPLICATION_CREDENTIALS", "service-account.json"
)
SHEET_ID = os.environ.get(
    "SHEET_ID", "1nDciCuFdvfErv86jk5Al9UsQdrtgD01iG-gRJePJX9k"
)
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]


def main():
    print("=" * 60)
    print("  Learning Point — Google Sheets Verifier")
    print("=" * 60)

    # --- Step 1: Check dependencies ---
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        from googleapiclient.errors import HttpError
    except ImportError:
        print("\n❌ Required Python packages missing!")
        print("   Run:  pip install -r requirements.txt")
        sys.exit(1)

    # --- Step 2: Check key file ---
    print(f"\n🔑 Looking for service account key: {SERVICE_ACCOUNT_FILE}")
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"❌ File not found!")
        print(f"   Solution: apni JSON key ko '{SERVICE_ACCOUNT_FILE}' naam se")
        print(f"   is folder me rakho, ya GOOGLE_APPLICATION_CREDENTIALS set karo.")
        sys.exit(1)

    with open(SERVICE_ACCOUNT_FILE) as f:
        key_data = json.load(f)
    sa_email = key_data.get("client_email", "???")
    print(f"   ✓ Found key. Service account: {sa_email}")

    # --- Step 3: Authenticate ---
    print("\n🔐 Authenticating...")
    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        service = build("sheets", "v4", credentials=creds)
        print("   ✓ Authentication successful!")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        sys.exit(1)

    # --- Step 4: Read sheet metadata ---
    print(f"\n📋 Fetching sheet: {SHEET_ID}")
    try:
        metadata = service.spreadsheets().get(spreadsheetId=SHEET_ID).execute()
    except HttpError as e:
        print(f"❌ Cannot access this sheet!")
        print(f"   Error: {e}")
        print(f"\n   🔧 FIX: Sheet ko service account email ke saath share karo:")
        print(f"      {sa_email}")
        print(f"      Permission: Viewer")
        print(f"      (Google Sheet > Share > paste email > Viewer > Send)")
        sys.exit(1)

    sheet_title = metadata.get("properties", {}).get("title", "Unknown")
    sheets = metadata.get("sheets", [])
    print(f"   ✓ Sheet title: {sheet_title}")
    print(f"   ✓ Tabs found: {len(sheets)}")
    for i, s in enumerate(sheets):
        props = s["properties"]
        grid = props.get("gridProperties", {})
        rows = grid.get("rowCount", "?")
        cols = grid.get("columnCount", "?")
        print(f"      [{i}] '{props['title']}'  ({rows} rows × {cols} cols)")

    # --- Step 5: Show column structure of first tab ---
    first_tab = sheets[0]["properties"]["title"] if sheets else "Sheet1"
    print(f"\n📄 Reading headers + sample data from: '{first_tab}'")
    range_name = f"'{first_tab}'!A1:Z6"
    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=SHEET_ID, range=range_name)
        .execute()
    )
    values = result.get("values", [])

    if not values:
        print("   ⚠️ No data found. Sheet khaali hai?")
    else:
        headers = values[0] if values else []
        print(f"\n   📊 Detected {len(headers)} columns:")
        for i, h in enumerate(headers):
            col_letter = chr(65 + i) if i < 26 else f"A{chr(65 + i - 26)}"
            print(f"      {col_letter}: {h}")

        print(f"\n   📝 Sample rows:")
        for row_num, row in enumerate(values[1:6], start=2):
            preview = " | ".join(str(c)[:40] for c in row[:6])
            print(f"      Row {row_num}: {preview}")

    # --- Done ---
    print("\n" + "=" * 60)
    print("  ✅✅✅ SUCCESS! Google Sheets connection verified!")
    print("  Service account is correctly set up and can read the sheet.")
    print("=" * 60)
    print("\nNext: Note down the column structure above — this will help")
    print("design the universal column mapper for the import pipeline.")


if __name__ == "__main__":
    main()
