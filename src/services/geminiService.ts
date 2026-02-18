
import { GoogleGenAI } from "@google/genai";
import { Project, Transaction, Vehicle } from "../types";

// Removed the getClient helper to follow strict initialization rules for GoogleGenAI instances

export const generateStrategicAnalysis = async (
  projects: Project[],
  financials: Transaction[],
  fleet: Vehicle[]
): Promise<string> => {
  // Always initialize GoogleGenAI right before making an API call to ensure use of correct environment variables
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const projectSummary = projects.map(p => 
    `- ${p.name}: ${p.status}, Orçamento €${p.budget}, Gasto €${p.spent}`
  ).join('\n');

  const income = financials.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const expenses = financials.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  
  const prompt = `Analise como Consultor Sênior a empresa PromptMetal:\nFinanças: Receita €${income}, Despesas €${expenses}\nObras:\n${projectSummary}\nFrota: ${fleet.length} veículos.\nForneça insights estratégicos em Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    // response.text is a direct property, not a method call
    return response.text || "Análise indisponível.";
  } catch (error) {
    console.error(error);
    return "Erro ao processar análise IA.";
  }
};

export const editImageWithGemini = async (
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string | null> => {
  // Always initialize GoogleGenAI right before making an API call with process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ inlineData: { data: base64Data, mimeType } }, { text: prompt }],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        // Iterate through all parts to find the image part, do not assume it is the first part
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};
