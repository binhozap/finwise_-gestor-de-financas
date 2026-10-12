/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  Bell, 
  Plus, 
  Settings, 
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingDown,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';

import { Transaction, Category, BillReminder, BudgetStatus } from './types';
import { cn, formatCurrency } from './lib/utils';
import { getSavingsAdvice } from './services/aiAdvisor';
import { processRecurrences } from './services/transactionService';

// Components (We will move these to separate files if they grow too large)
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Analytics from './components/Analytics';
import Reminders from './components/Reminders';
import AddTransactionModal from './components/AddTransactionModal';
import WelcomeScreen from './components/WelcomeScreen';
import Tooltip from './components/Tooltip';

import CategoryManager from './components/CategoryManager';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Alimentação', icon: 'Utensils', color: '#EF4444', budgetLimit: 0 },
  { id: '2', name: 'Transporte', icon: 'Car', color: '#3B82F6', budgetLimit: 0 },
  { id: '3', name: 'Moradia', icon: 'Home', color: '#8B5CF6', budgetLimit: 0 },
  { id: '4', name: 'Lazer', icon: 'Gamepad2', color: '#F59E0B', budgetLimit: 0 },
  { id: '5', name: 'Saúde', icon: 'HeartPulse', color: '#10B981', budgetLimit: 0 },
  { id: '6', name: 'Educação', icon: 'GraduationCap', color: '#EC4899', budgetLimit: 0 },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentView = location.pathname.split('/')[1] || 'dashboard';

  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('welcomeShown'));

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('finwise_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading transactions", e);
    }
    return [];
  });
  const [reminders, setReminders] = useState<BillReminder[]>(() => {
    try {
      const saved = localStorage.getItem('finwise_reminders');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading reminders", e);
    }
    return [];
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('finwise_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : DEFAULT_CATEGORIES;
      }
    } catch (e) {
      console.error("Error loading categories", e);
    }
    return DEFAULT_CATEGORIES;
  });
  const [userName, setUserName] = useState<string>(() => {
    const saved = localStorage.getItem('finwise_user_name');
    return (saved && typeof saved === 'string') ? saved : 'Usuário';
  });
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    const saved = localStorage.getItem('finwise_user_avatar');
    return (saved && typeof saved === 'string') ? saved : '';
  });
  const [savingsGoal, setSavingsGoal] = useState<number>(() => {
    const saved = localStorage.getItem('finwise_savings_goal');
    return saved ? parseFloat(saved) : 0;
  });
  const [completedMonths, setCompletedMonths] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('finwise_completed_months');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('finwise_theme') as 'light' | 'dark') || 'light';
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('Carregando dicas de economia...');

  // Persistent storage synchronization
  useEffect(() => {
    const saveToStorage = () => {
      try {
        localStorage.setItem('finwise_theme', theme);
        localStorage.setItem('finwise_user_name', userName);
        localStorage.setItem('finwise_user_avatar', userAvatar);
        localStorage.setItem('finwise_categories', JSON.stringify(categories));
        localStorage.setItem('finwise_transactions', JSON.stringify(transactions));
        localStorage.setItem('finwise_reminders', JSON.stringify(reminders));
        localStorage.setItem('finwise_savings_goal', savingsGoal.toString());
        localStorage.setItem('finwise_completed_months', JSON.stringify(completedMonths));
      } catch (e) {
        console.error("Failed to save state to localStorage", e);
      }
    };
    saveToStorage();
  }, [theme, userName, userAvatar, categories, transactions, reminders, savingsGoal, completedMonths]);

  useEffect(() => {
    const { updatedTransactions, hasChanges } = processRecurrences(transactions);
    if (hasChanges) {
      setTransactions(updatedTransactions);
    }
  }, [transactions]);

  useEffect(() => {
    const fetchAdvice = async () => {
      if (!transactions || transactions.length === 0) {
        setAiAdvice('Adicione suas primeiras transações para receber conselhos financeiros personalizados da IA!');
        return;
      }
      
      const budgetStatuses: BudgetStatus[] = categories.map(cat => ({
        categoryId: cat.name,
        limit: cat.budgetLimit || 0,
        spent: (transactions || [])
          .filter(t => t.category === cat.name && t.type === 'expense')
          .reduce((acc, t) => acc + t.amount, 0)
      }));
      const advice = await getSavingsAdvice(transactions || [], budgetStatuses);
      setAiAdvice(advice);
    };
    fetchAdvice();
  }, [transactions, categories]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    setTransactions([newTransaction, ...transactions]);
  };

  const handleGoalReached = (monthYear: string) => {
    if (!completedMonths.includes(monthYear)) {
      setCompletedMonths(prev => [...prev, monthYear]);
    }
  };

  const handles = {
    addCategory: (cat: Omit<Category, 'id'>) => {
      const newCat = { ...cat, id: crypto.randomUUID() };
      setCategories([...categories, newCat]);
    },
    updateCategory: (id: string, updates: Partial<Category>) => {
      setCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
    },
    deleteCategory: (id: string) => {
      setCategories(categories.filter(c => c.id !== id && c.parentId !== id));
    }
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Início', path: '/' },
    { id: 'transactions', icon: Wallet, label: 'Gastos', path: '/transactions' },
    { id: 'reminders', icon: Bell, label: 'Contas', path: '/reminders' },
    { id: 'analytics', icon: PieChart, label: 'Análise', path: '/analytics' },
    { id: 'categories', icon: Settings, label: 'Ajustes', path: '/categories' },
  ];

  if (showWelcome) {
    return (
      <WelcomeScreen 
        theme={theme}
        onComplete={() => {
          setShowWelcome(false);
          try { localStorage.setItem('welcomeShown', 'true'); } catch (e) {}
        }} 
      />
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-screen overflow-hidden relative transition-colors duration-300 w-full",
      theme === 'dark' ? "bg-slate-950 text-slate-100 dark" : "bg-slate-50 text-slate-800"
    )}>
      {/* Header */}
      <header className={cn(
        "px-6 py-6 flex justify-between items-center backdrop-blur-xl sticky top-0 z-10 border-b transition-colors duration-300",
        theme === 'dark' ? "bg-slate-950/40 border-slate-800" : "bg-white/40 border-slate-200/50"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg overflow-hidden border transition-all duration-300 relative",
            theme === 'dark' ? "bg-slate-800 text-white shadow-slate-900 border-slate-700" : "bg-slate-900 text-white shadow-slate-200 border-slate-700"
          )}>
            {userAvatar ? (
              userAvatar.startsWith('data:image') ? (
                <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{userAvatar}</span>
              )
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className={cn(
              "text-lg font-bold tracking-tight leading-none transition-colors duration-300",
              theme === 'dark' ? "text-slate-100" : "text-slate-900"
            )}>
              Olá, {(userName || 'Usuário').toString().split(' ')[0]}
            </h1>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60 transition-colors duration-300",
              theme === 'dark' ? "text-slate-400" : "text-slate-500"
            )}>
              {format(new Date(), "MMMM yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <Tooltip content="Lembretes e Contas" position="bottom">
          <Link 
            to="/reminders"
            aria-label="Ver lembretes de contas e pagamentos"
            className={cn(
              "p-2.5 rounded-2xl relative transition-all duration-300",
              currentView === 'reminders' 
                ? (theme === 'dark' ? "bg-blue-600 text-white shadow-lg" : "bg-slate-900 text-white shadow-lg")
                : (theme === 'dark' ? "bg-slate-900 border border-slate-800 text-slate-400 shadow-sm" : "bg-white border border-slate-200 text-slate-500 shadow-sm")
            )}
          >
            <Bell size={20} />
            {reminders.filter(r => !r.isPaid).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full" />
            )}
          </Link>
        </Tooltip>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pt-4 pb-[calc(8rem+env(safe-area-inset-bottom))] hide-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} className="flex-1">
            <Routes location={location}>
              <Route index element={
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Dashboard 
                    transactions={transactions} 
                    reminders={reminders} 
                    budgets={categories} 
                    aiAdvice={aiAdvice}
                    savingsGoal={savingsGoal}
                    onSetSavingsGoal={setSavingsGoal}
                    completedMonths={completedMonths}
                    onGoalReached={handleGoalReached}
                  />
                </motion.div>
              } />
              <Route path="transactions" element={
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Transactions 
                    transactions={transactions} 
                    categories={categories} 
                    onClearAll={() => setTransactions([])} 
                  />
                </motion.div>
              } />
              <Route path="analytics" element={
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Analytics transactions={transactions} categories={categories} theme={theme} />
                </motion.div>
              } />
              <Route path="reminders" element={
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Reminders reminders={reminders} setReminders={setReminders} categories={categories} />
                </motion.div>
              } />
              <Route path="categories" element={
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <CategoryManager 
                    categories={categories} 
                    onAdd={handles.addCategory}
                    onUpdate={handles.updateCategory}
                    onDelete={handles.deleteCategory}
                    userName={userName}
                    onUserNameChange={setUserName}
                    userAvatar={userAvatar}
                    onUserAvatarChange={setUserAvatar}
                    theme={theme}
                    onThemeChange={setTheme}
                  />
                </motion.div>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <Tooltip content="Nova Transação" className="absolute right-6 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAddModalOpen(true)}
          aria-label="Adicionar nova transação"
          className={cn(
            "w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl border transition-all duration-300",
            theme === 'dark' ? "bg-blue-600 text-white shadow-blue-900/40 border-blue-500" : "bg-slate-900 text-white shadow-slate-300 border-slate-800"
          )}
        >
          <Plus size={32} strokeWidth={2.5} />
        </motion.button>
      </Tooltip>

      {/* Navigation Bar */}
      <nav className={cn(
        "min-h-[5rem] backdrop-blur-lg border-t px-2 flex justify-around items-center sticky bottom-0 z-10 safe-bottom transition-all duration-300 w-full",
        theme === 'dark' ? "bg-slate-950/90 border-slate-800 shadow-[0_-1px_15px_rgba(0,0,0,0.4)]" : "bg-white/90 border-slate-200 shadow-[0_-1px_15px_rgba(0,0,0,0.05)]"
      )}>
        {navItems.map((item, index) => {
          const isActive = currentView === item.id || (item.id === 'dashboard' && currentView === '');
          return (
            <Link
              key={`${item.id}-${index}`}
              to={item.path}
              className="flex-1 flex justify-center items-center py-2 relative h-full"
            >
              <div className="relative px-3 py-2 flex flex-col items-center min-w-[4rem]">
                {isActive && (
                  <motion.div 
                    layoutId="nav-pill" 
                    className={cn(
                      "absolute inset-0 rounded-2xl",
                      theme === 'dark' ? "bg-slate-800/80" : "bg-blue-50"
                    )} 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-colors duration-300 relative z-10 w-full",
                    isActive 
                      ? (theme === 'dark' ? "text-blue-400" : "text-blue-600") 
                      : (theme === 'dark' ? "text-slate-400 hover:text-slate-300" : "text-slate-400 hover:text-slate-500")
                  )}
                >
                  <item.icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={cn("transition-transform duration-300", isActive && "-translate-y-0.5")}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center mt-0.5">{item.label}</span>
                </motion.div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Add Transaction Modal */}
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={addTransaction}
        categories={categories}
      />
    </div>
  );
}
