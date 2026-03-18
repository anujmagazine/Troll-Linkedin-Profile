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

export async function trollWithNanobanana1(base64Image: string): Promise<string> {
  // Use the platform-provided key
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.5-flash-image";
  
  console.log("Resizing image for Nanobanana 1...");
  const resizedImage = await resizeImage(base64Image, 1024);
  const base64Data = resizedImage.split(',')[1];
  
  const prompt = "You are a professional LinkedIn troller. Edit this LinkedIn profile screenshot by adding snarky, funny, 'red ink' style annotations, circles, and doodles (like clown noses or poop emojis) over the most cringe or braggy parts. Make it look like a teacher graded a bad essay with a red pen. The annotations should be funny and mocking.";

  console.log("Calling Nanobanana 1 for image editing...");
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Data } },
          { text: prompt }
        ]
      }
    });

    // Find the image part in the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Gemini did not return an edited image.");
  } catch (e: any) {
    console.error("Nanobanana 1 failed:", e);
    throw new Error(`Trolling failed: ${e.message || "Unknown error"}`);
  }
}
