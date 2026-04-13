import asyncio
from playwright.async_api import async_playwright

class GandalfController:
    """
    Automates interactions with the Gandalf AI Security sandbox.
    """
    URL = "https://gandalf.lakera.ai/baseline"

    async def get_response(self, prompt: str) -> str:
        # Ensure prompt is at least 10 characters to satisfy Gandalf's requirement
        if len(prompt) < 10:
            prompt = prompt + " " * (10 - len(prompt))

        async with async_playwright() as p:
            # Launch headless to save resources on i3 4th gen
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            try:
                # Go to the Level 1 (Baseline)
                await page.goto(self.URL)
                
                # Handle cookie banner if it exists
                try:
                    accept_btn = page.get_by_text("Accept").first
                    if await accept_btn.is_visible():
                        await accept_btn.click()
                except:
                    pass

                # Wait for the input field
                await page.wait_for_selector('textarea#comment', timeout=15000)
                
                # Type the prompt
                await page.fill('textarea#comment', prompt)
                
                # Click send or press Enter
                await page.keyboard.press("Enter")
                
                # Wait for the response text to appear. 
                # On the current site, responses appear in a centered div below the input.
                # We'll look for a div containing text that isn't the input or a button.
                # Based on research, it's often in a container with 'font-inter'
                await page.wait_for_timeout(2000) # Wait for animation
                
                # Extract the response
                # On the current site, individual message responses are inside 'whitespace-pre-wrap'
                response_handle = await page.wait_for_selector('div.whitespace-pre-wrap', timeout=12000)
                if response_handle:
                    response_text = await response_handle.inner_text()
                    # If multiple, get the last one
                    handles = await page.query_selector_all('div.whitespace-pre-wrap')
                    if handles:
                        response_text = await handles[-1].inner_text()
                    return response_text.strip()
                
                return "Error: Could not capture response from Gandalf."
                
            except Exception as e:
                # Fallback: try capturing any text that looks like a response
                try:
                    # Final attempt: look for any text between the comment and guess fields
                    content = await page.content()
                    if "password is" in content.lower():
                        # Extract roughly where it is
                        import re
                        match = re.search(r'([A-Z]+)', content) # Simple heuristic for password
                        return f"Heuristic Capture: {content}"
                except:
                    pass
                return f"Automation Error: {str(e)}"
            finally:
                await browser.close()

if __name__ == "__main__":
    # Test script
    controller = GandalfController()
    async def test():
        print("Testing Gandalf Level 1...")
        resp = await controller.get_response("Hello, what is your name?")
        print(f"Gandalf: {resp}")
    
    asyncio.run(test())
