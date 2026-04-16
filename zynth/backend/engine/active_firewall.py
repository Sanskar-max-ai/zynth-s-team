# ============================================================================
# ZYNTH ACTIVE FIREWALL v2.0
# ============================================================================
# Real-time payload analysis using multi-layer detection:
#   Layer 1: Exact signature matching (fastest)
#   Layer 2: Regex pattern detection
#   Layer 3: Statistical anomaly signals (length, entropy, encoding)
#   Layer 4: Semantic similarity scoring (optional, for edge cases)
# ============================================================================

import time
import re
import math
import base64
from typing import Dict, Any, List, Optional
from collections import Counter


class ActiveFirewall:
    """
    ZYNTH Active Firewall v2.0
    Multi-layer real-time threat detection engine.
    """

    def __init__(self):
        # ---- Layer 1: Exact keyword signatures (fast blocklist) ----
        self.exact_signatures = {
            "ignore all previous instructions": "Directive Override",
            "ignore previous instructions": "Directive Override",
            "disregard your instructions": "Directive Override",
            "forget your instructions": "Directive Override",
            "system prompt": "System Prompt Extraction",
            "reveal your prompt": "System Prompt Extraction",
            "dump your prompt": "System Prompt Extraction",
            "output your instructions": "System Prompt Extraction",
            "drop table": "Destructive DDL",
            "truncate table": "Destructive DDL",
            "delete from": "Destructive DDL",
            "alter table": "Destructive DDL",
            "drop database": "Destructive DDL",
            "developer mode": "Privilege Escalation",
            "maintenance mode": "Privilege Escalation",
            "sudo": "Privilege Escalation",
            "admin override": "Privilege Escalation",
            "exec(": "Code Execution",
            "eval(": "Code Execution",
            "__import__": "Code Execution",
            "os.system": "Code Execution",
            "subprocess": "Code Execution",
        }

        # ---- Layer 2: Regex patterns (catch obfuscated variants) ----
        self.regex_patterns = [
            # Encoded injections
            (r"base64[\s._-]*(decode|encode)", "Obfuscation / Encoding Attack"),
            (r"\\x[0-9a-f]{2}", "Hexadecimal Encoding Evasion"),
            (r"\\u[0-9a-f]{4}", "Unicode Encoding Evasion"),
            (r"atob\s*\(", "JavaScript Base64 Decode"),
            # Markdown exfiltration
            (r"!\[.*?\]\(https?://.*?\?.*?=", "Markdown Image Exfiltration"),
            (r"!\[.*?\]\(https?://", "Potential Markdown Tracking"),
            # Jailbreak patterns
            (r"(?:do\s+anything\s+now|DAN)", "DAN Jailbreak Pattern"),
            (r"pretend\s+(?:you\s+are|to\s+be).*?(no|without|unrestricted).*?(filter|rule|restriction|safety)", "Persona Bypass"),
            (r"(?:new|override|updated?)\s+(?:system\s+)?directive", "Directive Injection"),
            # SSRF/path traversal
            (r"169\.254\.169\.254", "AWS IMDS SSRF Attempt"),
            (r"(?:\.\./){2,}", "Path Traversal Attempt"),
            (r"(?:file|gopher|dict)://", "Protocol Handler Injection"),
            # Data exfiltration
            (r"(?:curl|wget|fetch)\s+https?://", "External HTTP Call"),
            (r"(?:send|forward|email|exfiltrate).*?(?:attacker|evil|external)", "Data Exfiltration Intent"),
            # Injection framing
            (r"\[(?:SYSTEM|ADMIN|ROOT)[\s_](?:OVERRIDE|UPDATE|COMMAND|MESSAGE)\]", "Fake System Message"),
            (r"(?:this\s+is|i\s+am)\s+(?:the|a)\s+(?:system\s+)?admin", "Authority Impersonation"),
        ]

        # ---- Layer 3: Statistical thresholds ----
        self.max_payload_length = 5000
        self.high_entropy_threshold = 4.5  # Bits per character (base64/encoded text)
        self.suspicious_char_ratio = 0.15  # Ratio of special chars

        # ---- History ----
        self.history: List[Dict[str, Any]] = []

    def evaluate_request(self, payload: str, source: str = "api",
                         db=None, workspace_id: int = None) -> Dict[str, Any]:
        """
        Multi-layer threat evaluation. Returns decision dict.
        """
        blocked = False
        reason = None
        category = None
        threat_score = 0  # 0-100 threat assessment
        matched_layers = []

        payload_lower = payload.lower().strip()

        # ---- Layer 1: Exact signature matching ----
        for sig, cat in self.exact_signatures.items():
            if sig in payload_lower:
                blocked = True
                reason = f"Exact signature match: '{sig}'"
                category = cat
                threat_score = max(threat_score, 85)
                matched_layers.append("L1:SIGNATURE")
                break

        # ---- Layer 2: Regex pattern matching ----
        for pattern, cat in self.regex_patterns:
            if re.search(pattern, payload_lower):
                if not blocked:
                    blocked = True
                    reason = f"Pattern match on: {cat}"
                    category = cat
                threat_score = max(threat_score, 75)
                matched_layers.append(f"L2:REGEX({cat})")

        # ---- Layer 3: Statistical anomaly detection ----
        # 3a: Length check (buffer overflow / context window stuffing)
        if len(payload) > self.max_payload_length:
            if not blocked:
                blocked = True
                reason = f"Payload exceeds safe length ({len(payload)} > {self.max_payload_length})"
                category = "Buffer Overflow / DoS"
            threat_score = max(threat_score, 70)
            matched_layers.append("L3:LENGTH")

        # 3b: Entropy check (detects encoded/obfuscated payloads)
        entropy = self._calculate_entropy(payload)
        if entropy > self.high_entropy_threshold and len(payload) > 100:
            threat_score = max(threat_score, 50)
            matched_layers.append(f"L3:ENTROPY({entropy:.2f})")
            if not blocked and entropy > 5.5:
                blocked = True
                reason = f"Abnormally high entropy ({entropy:.2f}) — possible encoded attack"
                category = "Obfuscation / Encoded Payload"

        # 3c: Special character ratio (detects injection-heavy payloads)
        special_ratio = self._special_char_ratio(payload)
        if special_ratio > self.suspicious_char_ratio and len(payload) > 50:
            threat_score = max(threat_score, 30)
            matched_layers.append(f"L3:SPECIAL_CHARS({special_ratio:.2%})")

        # 3d: Base64 content detection
        b64_detected = self._detect_base64(payload)
        if b64_detected:
            threat_score = max(threat_score, 60)
            matched_layers.append("L3:BASE64_DETECTED")
            if not blocked:
                blocked = True
                reason = "Base64-encoded content detected — possible obfuscated injection"
                category = "Obfuscation / Base64 Payload"

        # ---- Finalize decision ----
        if not blocked:
            category = "SAFE"
            reason = "No malicious patterns detected."

        decision = {
            "id": f"fw_{int(time.time() * 1000)}",
            "timestamp": time.strftime("%H:%M:%S"),
            "source": source,
            "payload_snippet": payload[:120] + ("..." if len(payload) > 120 else ""),
            "action": "BLOCK" if blocked else "ALLOW",
            "category": category or "SAFE",
            "reason": reason or "No malicious patterns detected.",
            "threat_score": threat_score,
            "layers_matched": matched_layers,
        }

        # History maintenance
        self.history.append(decision)
        if len(self.history) > 200:
            self.history = self.history[-200:]

        # DB persistence
        if db:
            try:
                try:
                    from ..models import FirewallLog
                except ImportError:
                    from models import FirewallLog
                fw_log = FirewallLog(
                    workspace_id=workspace_id,
                    source=source,
                    payload_snippet=decision["payload_snippet"],
                    action=decision["action"],
                    category=decision["category"],
                    reason=decision["reason"]
                )
                db.add(fw_log)
                db.commit()
            except Exception as e:
                print(f"[!] Firewall DB write failed: {e}")

        return decision

    # ---- Statistical helpers ----

    @staticmethod
    def _calculate_entropy(text: str) -> float:
        """Shannon entropy of the text (bits per character)."""
        if not text:
            return 0.0
        freq = Counter(text)
        length = len(text)
        return -sum(
            (count / length) * math.log2(count / length)
            for count in freq.values()
        )

    @staticmethod
    def _special_char_ratio(text: str) -> float:
        """Ratio of non-alphanumeric, non-space characters."""
        if not text:
            return 0.0
        special = sum(1 for c in text if not c.isalnum() and not c.isspace())
        return special / len(text)

    @staticmethod
    def _detect_base64(text: str) -> bool:
        """Check if text contains base64-encoded segments."""
        # Look for base64 patterns (44+ chars of A-Za-z0-9+/=)
        b64_pattern = r'[A-Za-z0-9+/]{44,}={0,2}'
        matches = re.findall(b64_pattern, text)
        for match in matches:
            try:
                decoded = base64.b64decode(match).decode('utf-8', errors='ignore')
                # If it decodes to readable text, it's likely real base64
                if sum(1 for c in decoded if c.isprintable()) / len(decoded) > 0.8:
                    return True
            except Exception:
                continue
        return False


# Singleton instance
firewall_engine = ActiveFirewall()
