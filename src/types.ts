export type TransactionType = 'expense' | 'income';

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

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
  receiptUrl?: string;
  receiptDriveId?: string;
  receiptName?: string;
}

export interface FinWiseBackupData {
  version: string;
  exportedAt: string;
  transactions: Transaction[];
  reminders: BillReminder[];
  categories: Category[];
  userName?: string;
  userAvatar?: string;
  theme?: string;
  meta?: {
    totalTransactions: number;
    totalReminders: number;
    appName: string;
  };
}

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  description?: string;
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
