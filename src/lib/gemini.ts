import { GoogleGenerativeAI, Part } from "@google/generative-ai";

// Initialize the Gemini API with your API Key from .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Interface for the structured data we expect back from the AI
 */
export interface ExtractedReceipt {
  store: string;
  total: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

export async function extractReceiptData(
  imageBuffer: Buffer, 
  mimeType: string
): Promise<ExtractedReceipt> {
  // Use gemini-1.5-flash: It's optimized for speed and high-volume OCR tasks
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this grocery receipt image:
    1. Extract the store name.
    2. Extract all individual line items and their specific prices.
    3. Translate all item names into clear, concise English.
    4. Return ONLY a JSON object with this exact structure:
       {
         "store": "string",
         "total": number,
         "items": [
           {"name": "string", "price": number, "quantity": number}
         ]
       }
    Do not include markdown blocks, explanations, or any text other than the JSON.
  `;

  // Convert the image buffer into the format Gemini expects
  const imagePart: Part = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType,
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Clean the response: AI sometimes wraps JSON in ```json blocks
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    
    return JSON.parse(cleanedJson) as ExtractedReceipt;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("The AI could not read the receipt. Please ensure the photo is clear.");
  }
}