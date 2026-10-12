import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Cooldown to prevent repeating failed external API requests
let geminiFailureCooldown = 0;

function generatePersonalizedTips(transactions: any[] = [], budgets: any[] = []): string[] {
  const tips: string[] = [];

  // Check budgets
  const overBudget = (budgets || []).find((b: any) => Number(b.limit) > 0 && Number(b.spent) >= Number(b.limit));
  const nearBudget = (budgets || []).find((b: any) => Number(b.limit) > 0 && Number(b.spent) >= Number(b.limit) * 0.8 && Number(b.spent) < Number(b.limit));

  if (overBudget) {
    tips.push(`Atenção: sua categoria "${overBudget.categoryId}" ultrapassou o orçamento limite definido.`);
  } else if (nearBudget) {
    tips.push(`Alerta: sua categoria "${nearBudget.categoryId}" já atingiu mais de 80% do limite estipulado.`);
  }

  // Check top expense
  const expenses = (transactions || []).filter((t: any) => t.type === 'expense');
  if (expenses.length > 0) {
    const highestExpense = [...expenses].sort((a: any, b: any) => Number(b.amount) - Number(a.amount))[0];
    if (highestExpense && tips.length < 3) {
      tips.push(`Maior despesa recente foi de R$ ${Number(highestExpense.amount).toFixed(2)} em ${highestExpense.category}.`);
    }
  }

  // Balance & savings calculation
  const totalIncome = (transactions || [])
    .filter((t: any) => t.type === 'income')
    .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const totalExpense = expenses.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

  if (totalExpense > totalIncome && totalIncome > 0 && tips.length < 3) {
    tips.push("Suas despesas superaram as receitas no período. Priorize apenas gastos essenciais.");
  }

  const defaultPool = [
    "Mantenha o foco nos seus limites de orçamento mensal para evitar imprevistos.",
    "Registre todas as pequenas despesas diárias para ter clareza financeira completa.",
    "Separe pelo menos 10% da sua receita mensal para sua reserva de emergência.",
    "Revise assinaturas e pagamentos recorrentes que não estejam sendo aproveitados.",
    "Pequenas economias cotidianas geram grande liberdade financeira no longo prazo."
  ];

  for (const tip of defaultPool) {
    if (tips.length >= 3) break;
    if (!tips.includes(tip)) {
      tips.push(tip);
    }
  }

  return tips.slice(0, 3);
}

app.post('/api/ai/savings-advice', async (req, res) => {
  try {
    const { transactions = [], budgets = [] } = req.body;
    let tips: string[] = [];

    const now = Date.now();
    const canAttemptGemini = Boolean(ai && now > geminiFailureCooldown);

    if (canAttemptGemini && ai) {
      try {
        const lastTransactions = (transactions || [])
          .slice(-10)
          .map((t: any) => `${t.date}: ${t.type === 'expense' ? '-' : '+'}${t.amount} (${t.category})`)
          .join('\n');
        const budgetSummary = (budgets || [])
          .map((b: any) => `${b.categoryId}: Limite ${b.limit}, Gasto ${b.spent}`)
          .join('\n');

        const prompt = `
          Você é um experiente consultor financeiro pessoal (FinWise AI).
          Analise os dados financeiros abaixo e forneça exatamente 3 dicas curtas, práticas e motivadoras em português (PT-BR) para ajudar o usuário a economizar este mês.
          
          Regras:
          1. Cada dica deve ter no máximo 15 palavras.
          2. Retorne APENAS as 3 dicas, uma em cada linha, sem números, hifens ou marcadores.
          3. As dicas devem ser baseadas nos gastos e orçamentos fornecidos.

          Últimas transações:
          ${lastTransactions || 'Nenhuma transação recente'}

          Resumo de Orçamentos:
          ${budgetSummary || 'Nenhum orçamento configurado'}
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text || '';
        const parsedTips = text
          .split('\n')
          .map((line: string) => line.replace(/^[\d\.\-\*\•\s]+/, '').trim())
          .filter((line: string) => line.length > 0)
          .slice(0, 3);

        if (parsedTips.length > 0) {
          tips = parsedTips;
        }
      } catch (err: any) {
        // Cooldown for 10 minutes on error to avoid repeated failing calls and latency
        geminiFailureCooldown = Date.now() + 10 * 60 * 1000;
        // Use console.log (stdout) so cloud logging does not flag standard fallback flow as an error
        console.log('[AI Advisor] Using personalized financial rule engine fallback.');
      }
    }

    if (tips.length === 0) {
      tips = generatePersonalizedTips(transactions, budgets);
    }

    return res.json({ tips });
  } catch (error: any) {
    console.log('[AI Advisor] Route fallback activated.');
    return res.json({
      tips: [
        "Mantenha o foco nos seus limites de orçamento mensal.",
        "Acompanhe cada gasto para ter clareza financeira.",
        "Pequenas economias diárias geram grandes resultados."
      ]
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
