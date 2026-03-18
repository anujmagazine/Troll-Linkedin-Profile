import { GoogleGenAI, Type } from "@google/genai";

export interface Annotation {
  type: 'text' | 'arrow' | 'circle' | 'doodle';
  x: number; // 0-100
  y: number; // 0-100
  content?: string;
  rotation?: number;
  targetX?: number; // for arrows
  targetY?: number; // for arrows
}

/**
 * Resizes a base64 image to a maximum dimension to ensure it fits within API limits
 */
async function resizeImage(base64Str: string, maxDim: number = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Image resize timed out")), 10000);
    const img = new Image();
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = (e) => {
      clearTimeout(timeout);
      console.error("Image load error:", e);
      reject(new Error("Failed to load image for resizing. The image might be corrupted or too large."));
    };
    
    img.src = base64Str;
  });
}

export async function analyzeLinkedInProfile(base64Image: string): Promise<Annotation[]> {
  // Use the API key automatically provided by the AI Studio environment
  const apiKey = process.env.GEMINI_API_KEY || "";
  
  const ai = new GoogleGenAI({ apiKey });
  // Using gemini-2.5-flash for speed and reliability in vision tasks
  const model = "gemini-2.5-flash";
  
  console.log("Resizing image...");
  let resizedImage;
  try {
    resizedImage = await resizeImage(base64Image);
  } catch (e: any) {
    console.error("Resize failed:", e);
    throw new Error(`Failed to process image: ${e.message}`);
  }
  
  const base64Data = resizedImage.split(',')[1];
  console.log("Image resized, calling Gemini with model:", model);

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

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
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

    if (!response.text) {
      console.warn("Gemini returned an empty response text.");
      return [];
    }

    console.log("Gemini raw response:", response.text);
    const parsed = JSON.parse(response.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e: any) {
    console.error("Error in analyzeLinkedInProfile:", e);
    if (e.message?.includes("API key")) {
      throw new Error("Invalid API key. Please check your Gemini API key configuration.");
    }
    throw new Error(`Gemini analysis failed: ${e.message || "Unknown error"}`);
  }
}
