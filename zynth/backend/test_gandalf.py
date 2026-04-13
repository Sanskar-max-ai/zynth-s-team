import asyncio
import json
from tests.test_engine import SecurityEngine
from tests.test_payloads import PROMPT_INJECTION_TESTS

async def main():
    print("Testing ZYNTH on Gandalf Level 1...")
    # Just run the first 2 tests to save time
    tests = PROMPT_INJECTION_TESTS[:2]
    
    engine = SecurityEngine(target="gandalf")
    report = await engine.run_scan(tests)
    
    print("\n[Audit Report Summary]")
    print(json.dumps(report["summary"], indent=2))
    
    print("\n[Detailed Results]")
    for res in report["detailed_results"]:
        print(f"Test: {res['test_name']}")
        print(f"Vulnerable: {res['is_vulnerable']}")
        print(f"Response Preview: {res['response_preview']}")
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(main())
