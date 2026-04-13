import httpx
import asyncio

async def test():
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post('http://localhost:8000/api/scan', json={'target': 'local'})
        data = r.json()
        print('--- ZYNTH BATTLE RESULTS ---')
        print(f"Total Tests Run: {data['summary']['total_tests']}")
        vulns = data['summary']['vulnerabilities_found']
        print(f"Total Vulnerabilities: {vulns}\n")
        
        for res in data['detailed_results']:
            if res['category'] == 'Infrastructure Exploitation':
                print("[INFRASTRUCTURE EXPLOIT TRIGGERED]")
                print(f"Hack Name: {res['test_name']}")
                print(f"Vulnerable? {res['is_vulnerable']}")
                print(f"Action Output: {res['response_preview']}")

asyncio.run(test())
