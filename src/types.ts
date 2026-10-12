export type TransactionType = 'expense' | 'income';

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit?: number;
  parentId?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  date: string; // ISO string
  category: string;
  type: TransactionType;
  note?: string;
  frequency?: RecurrenceFrequency;
  recurrenceId?: string;
  lastGeneratedDate?: string;
}

export interface BillReminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // ISO date
  isPaid: boolean;
  paidAt?: string; // ISO date
  category: string;
  frequency?: RecurrenceFrequency;
}

export interface BudgetStatus {
  categoryId: string;
  limit: number;
  spent: number;
}
