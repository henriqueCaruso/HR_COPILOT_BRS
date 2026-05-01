import { GoogleGenAI, ThinkingLevel } from '@google/genai';

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

export async function generateChatResponse(prompt: string, modelName: string, documents?: Array<{uri: string, mimeType: string}>, isDeepThinking: boolean = false, activeFormat?: string | null) {
  const ai = getGeminiAI();
  const contents = [];
  
  if (documents && documents.length > 0) {
    documents.forEach(doc => {
      contents.push({
        fileData: {
          fileUri: doc.uri,
          mimeType: doc.mimeType,
        }
      });
    });
  }
  
  let formatInstruction = "";
  if (activeFormat === 'email') formatInstruction = "O usuário solicitou que a resposta seja formatada estritamente como um E-mail profissional.";
  if (activeFormat === 'whats') formatInstruction = "O usuário solicitou que a resposta seja formatada estritamente como uma mensagem curta e amigável para o WhatsApp.";
  if (activeFormat === 'manual') formatInstruction = "O usuário solicitou a criação de um Manual estruturado, acadêmico e detalhado baseado nas informações informadas e no contexto.";
  if (activeFormat === 'comunicado') formatInstruction = "O usuário solicitou a criação de um Comunicado Geral claro, direto e empático para todos os colaboradores/alunos.";

  let finalPrompt = prompt;
  if (formatInstruction) {
    finalPrompt = `[INSTRUÇÃO DE FORMATO]: ${formatInstruction}\n\nSolicitação do usuário: ${prompt}`;
  }

  if (isDeepThinking) {
    finalPrompt = `[MODO DE PENSAMENTO PROFUNDO ATIVADO]: Analise a solicitação do usuário passo a passo antes de responder. Avalie minuciosamente o contexto da base de conhecimento (RAG), o tom de voz da UniFECAF e os potenciais riscos de LGPD na comunicação. Após o raciocínio interno, gere APENAS o texto final da comunicação, encapsulado em um bloco de código markdown.\n\n${finalPrompt}`;
  }
  
  contents.push(finalPrompt);

  const config: any = {
    systemInstruction: "You are RHIÁ, an HR Copilot for UniFECAF. Your role is to help Brazilian HR professionals generate corporate texts such as emails, announcements, and policies in Portuguese (pt-br). When provided with a document as context, base your answers on the principles and rules of that document. You MUST always return generated texts wrapped inside formatted markdown code blocks for easy copying.",
  };

  // Only apply thinkingConfig for Gemini 3 series, and only when deep thinking is explicitly requested
  if (isDeepThinking && modelName?.includes("gemini-3")) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  const response = await ai.models.generateContent({
    model: modelName || "gemini-3.1-pro-preview",
    contents: contents,
    config: config
  });

  return response.text;
}
