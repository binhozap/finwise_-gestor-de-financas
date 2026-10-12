import { GoogleGenAI } from "@google/genai";
import { Transaction, BudgetStatus } from "../types";

export async function getSavingsAdvice(
  transactions: Transaction[],
  budgets: BudgetStatus[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return "Configure sua chave de API para receber dicas de IA.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const lastTransactions = transactions.slice(-10).map(t => `${t.date}: ${t.type === 'expense' ? '-' : '+'}${t.amount} (${t.category})`).join('\n');
  const budgetSummary = budgets.map(b => `${b.categoryId}: Limite ${b.limit}, Gasto ${b.spent}`).join('\n');

  const prompt = `
    Você é um experiente consultor financeiro pessoal (FinWise AI).
    Analise os dados financeiros abaixo e forneça exatamente 3 dicas curtas, práticas e motivadoras em português (PT-BR) para ajudar o usuário a economizar este mês.
    
    Regras:
    1. Cada dica deve ter no máximo 15 palavras.
    2. Retorne APENAS as 3 dicas, uma em cada linha, sem números, hifens ou marcadores.
    3. As dicas devem ser baseadas nos gastos e orçamentos fornecidos.

    Últimas transações:
    ${lastTransactions}

    Resumo de Orçamentos:
    ${budgetSummary}
  `;

  try {
    const response = await ai.models.generateContent({ 
      model: "gemini-1.5-flash", 
      contents: prompt 
    });
    
    const text = response.text || "";
    const tips = text.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
    
    if (tips.length > 0) {
      return JSON.stringify(tips);
    }
    
    return JSON.stringify([
      "Revise seus gastos fixos para encontrar pequenas economias.",
      "Evite compras por impulso hoje e foque nos seus objetivos.",
      "Tente reduzir as despesas de lazer nas próximas duas semanas."
    ]);
  } catch (error) {
    console.error("AI Advisor error:", error);
    return JSON.stringify([
      "Mantenha o foco nos seus limites de orçamento mensal.",
      "Acompanhe cada gasto para ter clareza financeira.",
      "Pequenas economias diárias geram grandes resultados."
    ]);
  }
}
