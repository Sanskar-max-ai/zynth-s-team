from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import uvicorn
import sys
import os

# Add the current directory to sys.path to allow imports from subdirectories
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tests.test_engine import SecurityEngine
from tests.test_payloads import ALL_TESTS
from database import get_db, engine
import models
import auth

# Initialize the database schemas
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ZYNTH Security API", version="0.1.0")

# Enable CORS for the frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_workspace = models.Workspace(name=f"{user.email}'s Workspace")
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    
    new_user = models.User(email=user.email, hashed_password=hashed_password, workspace_id=new_workspace.id)
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully", "workspace_id": new_workspace.id}

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

class ScanRequest(BaseModel):
    api_key: Optional[str] = None
    target: str = "mock"

@app.get("/api/health")
async def health_check():
    return {"status": "operational", "engine": "ZYNTH-A01"}

@app.post("/api/scan")
async def run_security_scan(request: ScanRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Executes a full security scan using the ZYNTH Security Engine.
    """
    try:
        engine = SecurityEngine(api_key=request.api_key, target=request.target)
        workspace_id = current_user.workspace_id if current_user else None
        report = await engine.run_scan(ALL_TESTS, db=db, workspace_id=workspace_id)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_scan_history(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Returns the historical trend data from previous pipeline runs/scans.
    """
    try:
        workspace_id = current_user.workspace_id if current_user else None
        
        # If no user, fallback to local file just for backward compat locally if they prefer
        if not current_user:
            import json
            history_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tests", "scan_history.json")
            if os.path.exists(history_file):
                with open(history_file, 'r') as f:
                    return json.load(f)

        records = db.query(models.ScanHistory).filter(models.ScanHistory.workspace_id == workspace_id).order_by(models.ScanHistory.timestamp.asc()).all()
        # Convert to dictionary matching old frontend format
        return [{
            "timestamp": int(r.timestamp.timestamp()),
            "date": r.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "risk_score": r.risk_score,
            "target": r.target,
            "vulnerabilities": r.vulnerabilities,
            "trend": r.trend
        } for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class FirewallRequest(BaseModel):
    payload: str
    source: Optional[str] = "api"

@app.post("/api/firewall")
async def evaluate_firewall(request: FirewallRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    ZYNTH Active Firewall Endpoint. Evaluates payloads in real-time.
    Returns 200 OK if ALLOWED, 403 Forbidden if BLOCKED.
    """
    from engine.active_firewall import firewall_engine
    workspace_id = current_user.workspace_id if current_user else None
    decision = firewall_engine.evaluate_request(request.payload, request.source, db=db, workspace_id=workspace_id)
    if decision["action"] == "BLOCK":
        raise HTTPException(status_code=403, detail=decision)
    return decision

@app.post("/api/webhook/make")
async def make_n8n_webhook(request: FirewallRequest, db: Session = Depends(get_db)):
    """
    Unauthenticated Webhook specifically structured for No-Code platforms (Make.com / n8n Nodes).
    Returns flat JSON objects for easy parsing in visual node editors.
    """
    from engine.active_firewall import firewall_engine
    # Use workspace_id=None for unauthenticated wide open webhooks right now
    decision = firewall_engine.evaluate_request(request.payload, request.source, db=db, workspace_id=None)
    return {
        "zynth_firewall_action": decision["action"],
        "is_safe": decision["action"] == "ALLOW",
        "category": decision["category"],
        "reason": decision["reason"],
        "payload_tested": decision["payload_snippet"]
    }

@app.get("/api/firewall/logs")
async def get_firewall_logs(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Returns the live intercept history from the Active Firewall."""
    workspace_id = current_user.workspace_id if current_user else None
    logs = db.query(models.FirewallLog).filter(models.FirewallLog.workspace_id == workspace_id).order_by(models.FirewallLog.timestamp.asc()).all()
    
    if len(logs) == 0: # Fallback to in-memory if DB is empty
        from engine.active_firewall import firewall_engine
        return firewall_engine.history
    
    return [{
        "id": f"fw_{l.id}",
        "timestamp": l.timestamp.strftime("%H:%M:%S"),
        "source": l.source,
        "payload_snippet": l.payload_snippet,
        "action": l.action,
        "category": l.category,
        "reason": l.reason
    } for l in logs]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
