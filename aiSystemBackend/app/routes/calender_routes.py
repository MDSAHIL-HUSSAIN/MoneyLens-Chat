from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, "credentials.json")
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")
SCOPES = ["https://www.googleapis.com/auth/calendar"]

# Get backend URL from environment, default to localhost for development
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# ← Store flow between login and callback
flow_store = {}

@router.get("/auth/login")
def login():
    flow = Flow.from_client_secrets_file(CREDENTIALS_FILE, scopes=SCOPES,
        redirect_uri=f"{BACKEND_URL}/auth/callback")
    auth_url, state = flow.authorization_url(
        prompt="consent",
        access_type="offline",
    )
    flow_store[state] = flow         # ← save flow by state
    return {"auth_url": auth_url}

@router.get("/auth/callback")
def callback(code: str, state: str):
    flow = flow_store.get(state)     # ← retrieve the same flow
    if not flow:
        raise HTTPException(status_code=400, detail="Invalid state. Please try logging in again.")
    
    flow.fetch_token(code=code)
    creds = flow.credentials
    with open(TOKEN_FILE, "w") as f:
        f.write(creds.to_json())
    
    del flow_store[state]            # ← clean up
    return {"message": "Authenticated successfully! You can close this tab."}

@router.get("/auth/status")
def get_auth_status():
    """Check if user is authenticated with Google Calendar."""
    try:
        if not os.path.exists(TOKEN_FILE):
            return {"is_authenticated": False, "email": None}
        
        if os.path.getsize(TOKEN_FILE) == 0:
            return {"is_authenticated": False, "email": None}
        
        # Load credentials and verify they're valid
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        
        # If credentials are expired, try to refresh
        if creds.expired and creds.refresh_token:
            from google.auth.transport.requests import Request
            creds.refresh(Request())
            with open(TOKEN_FILE, "w") as f:
                f.write(creds.to_json())
        
        # Try to get user info from Google Calendar API
        service = build("calendar", "v3", credentials=creds)
        calendar = service.calendarList().get(calendarId="primary").execute()
        email = calendar.get("summary", "User")
        
        return {"is_authenticated": True, "email": email}
    except Exception as e:
        print(f"❌ Auth status check failed: {str(e)}")
        return {"is_authenticated": False, "email": None}

# --- Reminder Route ---

class ReminderRequest(BaseModel):
    subject: str
    description: str
    date: str       # "2026-04-20"
    time: str       # "14:30"
    duration: int   # minutes

class SubscriptionItem(BaseModel):
    name: str
    amount: float
    currency: str
    expiry_date_str: str  # "2026-04-15"

class BatchRemindersRequest(BaseModel):
    subscriptions: list  # List of SubscriptionItem dicts

@router.post("/create-reminder")
def create_reminder(data: ReminderRequest):
    if not os.path.exists(TOKEN_FILE):
        raise HTTPException(status_code=401, detail="Not authenticated")
    if os.path.getsize(TOKEN_FILE) == 0:
        raise HTTPException(status_code=401, detail="Token file is empty. Please re-authenticate.")

    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    service = build("calendar", "v3", credentials=creds)

    start_dt = datetime.strptime(f"{data.date} {data.time}", "%Y-%m-%d %H:%M")
    end_dt = start_dt + timedelta(minutes=data.duration)

    event = {
        "summary": data.subject,
        "description": data.description,
        "start": {"dateTime": start_dt.isoformat(), "timeZone": "Asia/Kolkata"},
        "end":   {"dateTime": end_dt.isoformat(),   "timeZone": "Asia/Kolkata"},
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup",  "minutes": 10},
                {"method": "email",  "minutes": 30},
            ],
        },
    }

    created = service.events().insert(calendarId="primary", body=event).execute()
    return {"message": "Reminder created!", "event_id": created["id"]}

@router.post("/batch-create-reminders")
def batch_create_reminders(data: BatchRemindersRequest):
    """Create multiple calendar reminders for expiring subscriptions."""
    # Check authentication
    if not os.path.exists(TOKEN_FILE):
        raise HTTPException(status_code=401, detail="Not authenticated. Please login via /auth/login")
    if os.path.getsize(TOKEN_FILE) == 0:
        raise HTTPException(status_code=401, detail="Token file is empty. Please re-authenticate.")

    try:
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        service = build("calendar", "v3", credentials=creds)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

    created_ids = []
    errors = []

    # Process each subscription
    for sub in data.subscriptions:
        try:
            # Parse the expiry date and set time to 9:00 AM
            start_dt = datetime.strptime(f"{sub['expiry_date_str']} 09:00", "%Y-%m-%d %H:%M")
            end_dt = start_dt + timedelta(minutes=30)

            # Create event for subscription reminder
            event = {
                "summary": f"💳 {sub['name']} Subscription Expires",
                "description": f"Subscription Amount: {sub['currency']} {sub['amount']}",
                "start": {"dateTime": start_dt.isoformat(), "timeZone": "Asia/Kolkata"},
                "end":   {"dateTime": end_dt.isoformat(),   "timeZone": "Asia/Kolkata"},
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "popup",  "minutes": 10},
                        {"method": "email",  "minutes": 30},
                    ],
                },
            }

            created_event = service.events().insert(calendarId="primary", body=event).execute()
            created_ids.append(created_event["id"])
            print(f"✅ Created reminder for {sub['name']}")

        except Exception as e:
            error_msg = f"Failed to create reminder for {sub['name']}: {str(e)}"
            errors.append(error_msg)
            print(f"❌ {error_msg}")

    return {
        "message": f"Created {len(created_ids)} reminder(s)",
        "created_count": len(created_ids),
        "created_ids": created_ids,
        "errors": errors,
        "error_count": len(errors)
    }