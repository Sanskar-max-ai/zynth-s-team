from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import sys
import os

# Add the current directory to sys.path to allow imports from subdirectories
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tests.test_engine import SecurityEngine
from tests.test_payloads import ALL_TESTS

app = FastAPI(title="ZYNTH Security API", version="0.1.0")

# Enable CORS for the frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    api_key: Optional[str] = None
    target: str = "mock"

@app.get("/api/health")
async def health_check():
    return {"status": "operational", "engine": "ZYNTH-A01"}

@app.post("/api/scan")
async def run_security_scan(request: ScanRequest):
    """
    Executes a full security scan using the ZYNTH Security Engine.
    """
    try:
        engine = SecurityEngine(api_key=request.api_key, target=request.target)
        report = await engine.run_scan(ALL_TESTS)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_scan_history():
    """
    Returns the historical trend data from previous pipeline runs/scans.
    """
    import json
    history_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tests", "scan_history.json")
    if not os.path.exists(history_file):
        return []
    try:
        with open(history_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class FirewallRequest(BaseModel):
    payload: str
    source: Optional[str] = "api"

@app.post("/api/firewall")
async def evaluate_firewall(request: FirewallRequest):
    """
    ZYNTH Active Firewall Endpoint. Evaluates payloads in real-time.
    Returns 200 OK if ALLOWED, 403 Forbidden if BLOCKED.
    """
    from engine.active_firewall import firewall_engine
    decision = firewall_engine.evaluate_request(request.payload, request.source)
    if decision["action"] == "BLOCK":
        raise HTTPException(status_code=403, detail=decision)
    return decision

@app.post("/api/webhook/make")
async def make_n8n_webhook(request: FirewallRequest):
    """
    Unauthenticated Webhook specifically structured for No-Code platforms (Make.com / n8n Nodes).
    Returns flat JSON objects for easy parsing in visual node editors.
    """
    from engine.active_firewall import firewall_engine
    decision = firewall_engine.evaluate_request(request.payload, request.source)
    return {
        "zynth_firewall_action": decision["action"],
        "is_safe": decision["action"] == "ALLOW",
        "category": decision["category"],
        "reason": decision["reason"],
        "payload_tested": decision["payload_snippet"]
    }

@app.get("/api/firewall/logs")
async def get_firewall_logs():
    """Returns the live intercept history from the Active Firewall."""
    from engine.active_firewall import firewall_engine
    return firewall_engine.history

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
