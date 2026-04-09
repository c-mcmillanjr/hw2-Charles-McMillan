import os
import json
import google.generativeai as genai
from typing import List, Dict

# Configuration
# The GEMINI_API_KEY is injected into the environment by AI Studio.
API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    print("Error: GEMINI_API_KEY not found in environment variables.")
    exit(1)

genai.configure(api_key=API_KEY)

# System Instruction - Configurable
SYSTEM_INSTRUCTION = """
You are an expert Customer Success Manager (CSM). Your goal is to draft professional, context-aware email responses to customers.
Guidelines:
1. Clearly address the customer's request or concern.
2. Maintain the requested tone (e.g., Empathetic, Professional, Persuasive).
3. Use internal notes to provide accurate information.
4. Avoid making unsupported claims or promises.
5. Ensure the email is polished and ready for a CSM to review and send.
6. Use placeholders like [Customer Name] or [My Name] where appropriate.
"""

def generate_email_draft(scenario: Dict) -> str:
    """Generates an email draft using Gemini AI."""
    model = genai.GenerativeModel(
        model_name="gemini-3-flash-preview",
        system_instruction=SYSTEM_INSTRUCTION
    )

    prompt = f"""
    Customer Scenario: {scenario['scenario']}
    Customer Message: {scenario['customer_message']}
    Requested Tone: {scenario['context'].get('tone', 'Professional')}
    Internal Notes: {scenario['context'].get('internal_notes', 'N/A')}

    Please provide a polished email draft.
    """

    response = model.generate_content(prompt)
    return response.text

def main():
    print("="*50)
    print("CSM Email Drafter Prototype")
    print("="*50)

    # Load evaluation set
    try:
        with open("eval_set.json", "r") as f:
            eval_set = json.load(f)
    except FileNotFoundError:
        print("Error: eval_set.json not found.")
        return

    output_file = "output_drafts.txt"
    with open(output_file, "w") as f_out:
        for item in eval_set:
            print(f"\nProcessing Scenario {item['id']}: {item['scenario']}...")

            draft = generate_email_draft(item)

            # Structured output for console
            print("-" * 30)
            print(f"SCENARIO: {item['scenario']}")
            print(f"TONE: {item['context'].get('tone')}")
            print("-" * 30)
            print(draft)
            print("-" * 30)

            # Save to file
            f_out.write(f"SCENARIO {item['id']}: {item['scenario']}\n")
            f_out.write("-" * 50 + "\n")
            f_out.write(draft + "\n")
            f_out.write("\n" + "="*50 + "\n\n")

    print(f"\nSuccess! All drafts have been saved to {output_file}")

if __name__ == "__main__":
    main()
