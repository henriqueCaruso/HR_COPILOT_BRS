import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenAI({ apiKey });
}

export async function uploadDocument(file: File, mimeTypeOverride?: string) {
  const ai = getGeminiAI();
  try {
    const mimeType = mimeTypeOverride || file.type || 'text/plain';
    // Attempt standard file upload
    const uploadedFile = await ai.files.upload({
      file: file,
      config: {
        mimeType: mimeType,
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
    for (const doc of documents) {
      try {
        const fileNameMatch = doc.uri.match(/files\/[a-zA-Z0-9_-]+/);
        const fileName = fileNameMatch ? fileNameMatch[0] : null;
        
        if (fileName) {
          await ai.files.get({ name: fileName });
          contents.push({
            fileData: {
              fileUri: doc.uri,
              mimeType: doc.mimeType,
            }
          });
        } else {
          throw new Error("Invalid file URI format");
        }
      } catch (err) {
        console.warn("File URI dead or inaccessible, skipping:", doc.uri);
      }
    }
  }
  
  let formatInstruction = "";
  if (activeFormat === 'email') formatInstruction = "A resposta deve ser formatada estritamente como um E-mail profissional.";
  if (activeFormat === 'whats') formatInstruction = "A resposta deve ser formatada estritamente como uma mensagem curta e amigável para o WhatsApp.";
  if (activeFormat === 'manual') formatInstruction = "Crie um Manual estruturado, acadêmico e detalhado baseado nas informações.";
  if (activeFormat === 'comunicado') formatInstruction = "Crie um Comunicado Geral claro, direto e empático para todos.";

  let finalPrompt = prompt;
  if (formatInstruction) {
    finalPrompt = `[INSTRUÇÃO DE FORMATO]: ${formatInstruction}\n\nSolicitação do usuário: ${prompt}`;
  }

  if (isDeepThinking) {
    finalPrompt = `[MODO DE PENSAMENTO PROFUNDO ATIVADO]: Analise a solicitação passo a passo antes de responder. Avalie minuciosamente o contexto, o tom de voz da UniFECAF e potenciais riscos de LGPD. Após o raciocínio, gere APENAS o texto final da comunicação, SEM formatação markdown.\n\n${finalPrompt}`;
  }
  
  contents.push(finalPrompt);

  const config: any = {
    systemInstruction: "Você é RHIÁ, um Copiloto de RH da UniFECAF. Seu papel é auxiliar profissionais de RH brasileiros a gerar textos corporativos, como e-mails, comunicados e políticas, em português (pt-br). Baseie suas respostas nos documentos de contexto fornecidos. É ESTRITAMENTE PROIBIDO usar formatação Markdown. NÃO use blocos de código, NÃO use asteriscos para negrito e NÃO use hashtags. A saída deve ser 100% texto puro (plain text), perfeitamente formatado com quebras de linha padrão para copiar e colar diretamente no Outlook ou WhatsApp.",
  };

  // Only apply thinkingConfig for gemini-3.1-pro-preview when deep thinking is explicitly requested
  if (isDeepThinking && modelName === "gemini-3.1-pro-preview") {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  const response = await ai.models.generateContent({
    model: modelName || "gemini-3.1-pro-preview",
    contents: contents,
    config: config
  });

  return response.text;
}
