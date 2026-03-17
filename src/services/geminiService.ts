import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Annotation {
  type: 'text' | 'arrow' | 'circle' | 'doodle';
  x: number; // 0-100
  y: number; // 0-100
  content?: string;
  rotation?: number;
  targetX?: number; // for arrows
  targetY?: number; // for arrows
}

export async function analyzeLinkedInProfile(base64Image: string): Promise<Annotation[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are a professional LinkedIn troller. Your job is to find the most cringe, braggy, or "thought leader" parts of a LinkedIn profile and mock them with red ink annotations.
    
    Analyze the provided image and return a list of annotations. 
    Be creative, snarky, and funny. Use "red ink" style comments.
    
    Types of annotations:
    - 'text': A snarky comment.
    - 'arrow': Points from (x, y) to (targetX, targetY).
    - 'circle': Circles an area at (x, y).
    - 'doodle': A funny drawing (e.g., 'devil horns' on the profile pic, 'clown nose', 'poop emoji').
    
    Coordinates (x, y, targetX, targetY) must be normalized from 0 to 100 relative to the image size.
    
    Return ONLY a JSON array of Annotation objects.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image.split(',')[1] || base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['text', 'arrow', 'circle', 'doodle'] },
            x: { type: Type.NUMBER },
            y: { type: Type.NUMBER },
            content: { type: Type.STRING },
            rotation: { type: Type.NUMBER },
            targetX: { type: Type.NUMBER },
            targetY: { type: Type.NUMBER }
          },
          required: ['type', 'x', 'y']
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}
