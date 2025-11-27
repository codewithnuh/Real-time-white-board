import { Type } from "@google/genai";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
  userId: string;
}

export interface User {
  id: string;
  color: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: number;
}

// Gemini Schema for AI Drawing
export const StrokeSchema = {
  type: Type.OBJECT,
  properties: {
    strokes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          color: { type: Type.STRING, description: "Hex color code" },
          width: { type: Type.NUMBER, description: "Stroke width (2-20)" },
          points: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER }
              },
              required: ["x", "y"]
            }
          },
          isEraser: { type: Type.BOOLEAN }
        },
        required: ["color", "width", "points"]
      }
    },
    explanation: { type: Type.STRING, description: "Short description of what was drawn" }
  },
  required: ["strokes", "explanation"]
};
