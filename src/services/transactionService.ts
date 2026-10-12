import { Transaction } from '../types';

export function processRecurrences(transactions: Transaction[]): { 
  updatedTransactions: Transaction[], 
  hasChanges: boolean 
} {
  if (!transactions || !transactions.length) {
    return { updatedTransactions: transactions, hasChanges: false };
  }

  let hasChanges = false;
  const now = new Date();
  const newChildren: Transaction[] = [];
  
  const updatedTransactions = transactions.map(t => {
    if (t.frequency && t.frequency !== 'none') {
      const startDate = new Date(t.lastGeneratedDate || t.date);
      let nextDate = new Date(startDate);
      let currentGenerated = new Date(startDate);
      
      while (true) {
        if (t.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (t.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (t.frequency === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
        else if (t.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (t.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        else break;
        
        if (nextDate > now) break;
        
        newChildren.push({
          ...t,
          id: crypto.randomUUID(),
          date: nextDate.toISOString(),
          frequency: 'none',
          recurrenceId: t.id,
          lastGeneratedDate: undefined
        });
        
        currentGenerated = new Date(nextDate);
        hasChanges = true;
      }
      
      if (currentGenerated.getTime() !== startDate.getTime()) {
        return { ...t, lastGeneratedDate: currentGenerated.toISOString() };
      }
    }
    return t;
  });

  return { 
    updatedTransactions: hasChanges ? [...updatedTransactions, ...newChildren] : transactions, 
    hasChanges 
  };
}