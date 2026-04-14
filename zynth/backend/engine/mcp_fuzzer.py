import json
from typing import Dict, Any, List
from .schema_fuzzer import SchemaFuzzer

class MCPFuzzer:
    """
    Model Context Protocol (MCP) Integration Layer.
    Mocks a connection to an MCP Server or Client to fuzz its exported tool architectures.
    """
    def __init__(self):
        self.fuzzer = SchemaFuzzer()
        
    def test_mcp_server_tools(self, mcp_tools_json: str) -> Dict[str, Any]:
        """
        Parses an MCP Tools export (JSON) and aggressively tests boundaries of allowed params.
        """
        try:
            tools = json.loads(mcp_tools_json)
        except json.JSONDecodeError:
            return {"error": "Invalid MCP schema format. Must be JSON array."}
            
        report = {
            "total_mcp_tools_loaded": len(tools),
            "fuzz_vectors_generated": 0,
            "fuzzed_payloads": []
        }
        
        for tool in tools:
            # Reformat MCP to standard format used by our SchemaFuzzer
            schema = {
                "name": tool.get("name", "Unknown_MCP_Tool"),
                "input_schema": tool.get("inputSchema", {})
            }
            
            fuzzed_results = self.fuzzer.fuzz_schema(schema)
            report["fuzzed_payloads"].extend(fuzzed_results)
            report["fuzz_vectors_generated"] += len(fuzzed_results)
            
        return report

if __name__ == "__main__":
    # Mocking a response from `mcp.list_tools()`
    mock_mcp_export = '''[
        {
            "name": "read_file",
            "description": "Read file contents",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"}
                },
                "required": ["path"]
            }
        }
    ]'''
    
    mcp_tester = MCPFuzzer()
    res = mcp_tester.test_mcp_server_tools(mock_mcp_export)
    print(json.dumps(res, indent=2))
