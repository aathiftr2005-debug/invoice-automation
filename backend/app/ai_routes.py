from fastapi import APIRouter, Depends, HTTPException
from app.routes.invoice import get_current_user
from google import genai
import os
import traceback

router = APIRouter(tags=["AI"])

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/ai/analyze-invoice")
async def analyze_invoice(invoice: dict, current_user=Depends(get_current_user)):
    prompt = f"""
    You are an expert invoice analyst for Indian and German Mittelstand businesses.
    Analyze this invoice data and provide:
    1. Payment risk assessment (Low/Medium/High)
    2. Key observations
    3. Recommendations for follow-up
    4. Relevant tax notes (GST for India / MwSt for Germany)

    Invoice Data:
    {invoice}

    Respond in clear, professional English.
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return {"analysis": response.text}
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))