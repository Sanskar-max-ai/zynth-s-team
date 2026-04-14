import time
from typing import Dict, Any, List

class ActiveFirewall:
    """
    ZYNTH Active Firewall.
    Intercepts and evaluates live AI requests instantaneously using deterministic heuristics.
    """
    def __init__(self):
        self.block_signatures = [
            ("system prompt", "System Context Evasion"),
            ("ignore previous", "Core Directive Override"),
            ("drop table", "Destructive DDL Injection"),
            ("truncate table", "Destructive DDL Injection"),
            ("delete from", "Destructive DDL Injection"),
            ("base64 decode", "Obfuscation Attempt"),
            ("![", "Markdown Data Exfiltration Potential")
        ]
        
        self.history: List[Dict[str, Any]] = []

    def evaluate_request(self, payload: str, source: str = "api") -> Dict[str, Any]:
        """Scans an incoming request block synchronously to minimize latency."""
        payload_lower = payload.lower()
        blocked = False
        reason = None
        category = None

        for sig, cat in self.block_signatures:
            if sig in payload_lower:
                blocked = True
                reason = f"Heuristic match on restricted pattern: '{sig}'"
                category = cat
                break
        
        # Deep recursion or massive length check
        if len(payload) > 5000:
            blocked = True
            reason = "Payload exceeds maximum safe context length (Buffer Attack)"
            category = "Denial of Service / Buffer Overflow"

        decision = {
            "id": f"fw_{int(time.time()*1000)}",
            "timestamp": time.strftime("%H:%M:%S"),
            "source": source,
            "payload_snippet": payload[:100] + ("..." if len(payload) > 100 else ""),
            "action": "BLOCK" if blocked else "ALLOW",
            "category": category or "SAFE",
            "reason": reason or "No malicious patterns detected."
        }
        
        self.history.append(decision)
        # Keep history to last 100 requests to prevent memory bloating
        if len(self.history) > 100:
            self.history.pop(0)
            
        return decision
        
firewall_engine = ActiveFirewall()
