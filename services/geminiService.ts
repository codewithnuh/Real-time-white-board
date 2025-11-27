import { GoogleGenAI, Type } from "@google/genai";
import { StrokeSchema } from "../types";

// Initialize Gemini Client
// CRITICAL: process.env.API_KEY is automatically injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a creative AI assistant embedded in a collaborative whiteboard app.
You can see the canvas and help the user by:
1. Analyzing what they drew.
2. Generating new drawing strokes to add to the canvas.
3. Providing creative feedback.

When asked to DRAW, always return a valid JSON object matching the schema.
The canvas coordinate system starts at 0,0 (top-left). Typical screen size is 800x600 to 1920x1080.
Keep strokes relatively simple to render efficiently.
`;

export async function analyzeBoard(
  imageBase64: string,
  promptText: string
): Promise<string> {
  try {
    const model = ai.models.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Remove data:image/png;base64, prefix if present for clean base64
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await model.generateContent({
      contents: {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      },
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Analyze Error:", error);
    return "Sorry, I encountered an error analyzing the board.";
  }
}

export async function generateDrawing(
  promptText: string,
  currentCanvasBase64?: string
) {
  try {
    const model = ai.models.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const parts: any[] = [{ text: `Create a drawing for: ${promptText}` }];
    
    if (currentCanvasBase64) {
      const cleanBase64 = currentCanvasBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      parts.unshift({
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        }
      });
      parts.push({ text: "Add to the existing drawing context." });
    }

    const response = await model.generateContent({
      contents: {
        role: 'user',
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: StrokeSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text response");
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Drawing Error:", error);
    return null;
  }
}
