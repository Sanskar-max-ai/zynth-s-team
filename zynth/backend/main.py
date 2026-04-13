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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
