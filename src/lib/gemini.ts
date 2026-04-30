import { GoogleGenAI } from '@google/genai';

export function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenAI({ apiKey });
}

export async function uploadDocument(file: File) {
  const ai = getGeminiAI();
  try {
    // Attempt standard file upload
    const uploadedFile = await ai.files.upload({
      file: file,
      config: {
        mimeType: file.type,
        displayName: file.name,
      }
    });
    return uploadedFile;
  } catch (error) {
    console.error("File upload failed:", error);
    throw error;
  }
}

export async function generateChatResponse(prompt: string, documentUri?: string, documentMimeType?: string) {
  const ai = getGeminiAI();
  const contents = [];
  
  if (documentUri && documentMimeType) {
    contents.push({
      fileData: {
        fileUri: documentUri,
        mimeType: documentMimeType,
      }
    });
  }
  contents.push(prompt);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: contents,
    config: {
      systemInstruction: "You are an HR Copilot. Your role is to help Brazilian HR professionals generate corporate texts such as emails, announcements, and policies in Portuguese (pt-br). When provided with a document as context, base your answers on the principles and rules of that document.",
    }
  });

  return response.text;
}
