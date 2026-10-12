import { Transaction, BudgetStatus } from "../types";

export async function getSavingsAdvice(
  transactions: Transaction[],
  budgets: BudgetStatus[]
): Promise<string> {
  try {
    const response = await fetch('/api/ai/savings-advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions, budgets }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    if (data && Array.isArray(data.tips) && data.tips.length > 0) {
      return JSON.stringify(data.tips);
    }
    
    return JSON.stringify([
      "Mantenha o foco nos seus limites de orçamento mensal.",
      "Acompanhe cada gasto para ter clareza financeira.",
      "Pequenas economias diárias geram grandes resultados."
    ]);
  } catch (_error) {
    return JSON.stringify([
      "Mantenha o foco nos seus limites de orçamento mensal.",
      "Acompanhe cada gasto para ter clareza financeira.",
      "Pequenas economias diárias geram grandes resultados."
    ]);
  }
}
