import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownLeft, Sparkles, AlertCircle, Calendar, Target, TrendingUp, Edit2, Check, Medal, Trophy, Star, Zap, Bell } from 'lucide-react';
import { Transaction, Category, BillReminder } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format, subMonths } from 'date-fns';
// canvas-confetti has no bundled TypeScript types in this project; use require to avoid TS import error
// eslint-disable-next-line @typescript-eslint/no-var-requires
const confetti: any = require('canvas-confetti');

interface DashboardProps {
  transactions: Transaction[];
  reminders: BillReminder[];
  budgets: Category[];
  aiAdvice: string;
  savingsGoal: number;
  onSetSavingsGoal: (goal: number) => void;
  completedMonths: string[];
  onGoalReached: (monthYear: string) => void;
}

const BADGES = [
  { months: 1, label: 'Iniciante', icon: Star, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { months: 2, label: 'Focado', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { months: 3, label: 'Consistente', icon: Medal, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { months: 6, label: 'Mestre', icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
];

export default function Dashboard({ transactions = [], reminders = [], budgets = [], aiAdvice, savingsGoal, onSetSavingsGoal, completedMonths = [], onGoalReached }: DashboardProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(savingsGoal.toString());

  const currentMonthKey = format(new Date(), 'MM-yyyy');

  // Calculate current consecutive streak
  const streak = React.useMemo(() => {
    let count = 0;
    let checkDate = new Date();
    
    // If goal not reached this month yet, start checking from last month
    if (!completedMonths.includes(currentMonthKey)) {
      checkDate = subMonths(checkDate, 1);
    }

    while (completedMonths.includes(format(checkDate, 'MM-yyyy'))) {
      count++;
      checkDate = subMonths(checkDate, 1);
    }
    return count;
  }, [completedMonths, currentMonthKey]);

  // Filter current month transactions for savings logic
  const currentMonthTransactions = transactions.filter(t => {
    const date = parseISO(t.date);
    return isWithinInterval(date, {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    });
  });

  const totalIncome = (transactions || [])
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalExpenses = (transactions || [])
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const currentSavings = monthlyIncome - monthlyExpenses;
  const savingsProgress = savingsGoal > 0 ? Math.min((currentSavings / savingsGoal) * 100, 100) : 0;
  const isGoalReached = savingsGoal > 0 && currentSavings >= savingsGoal;

  useEffect(() => {
    if (isGoalReached) {
      onGoalReached(currentMonthKey);
      const lastFired = sessionStorage.getItem('finwise_goal_celebrated');
      const currentMonthYear = currentMonthKey;
      
      if (lastFired !== currentMonthYear) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#6366f1']
        });
        sessionStorage.setItem('finwise_goal_celebrated', currentMonthYear);
      }
    }
  }, [isGoalReached, currentMonthKey, onGoalReached]);

  const nextReminders = (reminders || [])
    .filter(r => !r.isPaid)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 2);

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      exit="exit"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        },
        exit: { opacity: 0, transition: { duration: 0.2 } }
      }}
      className="grid grid-cols-2 gap-4 pb-10"
    >
      {/* Wallet Card - Full Width */}
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 }
        }}
        className="col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800"
      >
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <ArrowUpRight size={140} className="text-blue-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Saldo Disponível</p>
          </div>
          <h2 className="text-4xl font-bold mb-8 tracking-tight">{formatCurrency(balance)}</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-4 border border-white/10">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Entradas</p>
              <p className="font-bold text-lg text-emerald-400">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-4 border border-white/10">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Saídas</p>
              <p className="font-bold text-lg text-rose-400">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Savings Goal Card */}
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 }
        }}
        className={cn(
          "col-span-2 rounded-[2rem] p-6 border shadow-sm transition-all duration-300",
          "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
        )}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-blue-500" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meta de Economia</h3>
          </div>
          <button 
            onClick={() => {
              if (isEditingGoal) {
                onSetSavingsGoal(parseFloat(tempGoal) || 0);
                setIsEditingGoal(false);
              } else {
                setIsEditingGoal(true);
              }
            }}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-blue-500"
          >
            {isEditingGoal ? <Check size={16} /> : <Edit2 size={16} />}
          </button>
        </div>

        {isEditingGoal ? (
          <div className="mb-4">
            <input 
              type="number"
              value={tempGoal}
              onChange={(e) => setTempGoal(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-xl font-bold focus:ring-2 focus:ring-blue-500"
              placeholder="Quanto quer poupar?"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {formatCurrency(currentSavings < 0 ? 0 : currentSavings)}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Poupado de {formatCurrency(savingsGoal)}
              </p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-extrabold",
              isGoalReached ? "bg-emerald-100 text-emerald-600" : "bg-blue-50 text-blue-600"
            )}>
              {isGoalReached ? "META ATINGIDA! 🎉" : `${Math.round(savingsProgress)}% CONCLUÍDO`}
            </div>
          </div>
        )}

        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${savingsProgress}%` }}
            className={cn("h-full transition-colors duration-500", isGoalReached ? "bg-emerald-500" : "bg-blue-500")}
          />
        </div>
      </motion.div>

      {/* Achievements / Badges Section */}
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 }
        }}
        className={cn(
          "col-span-2 rounded-[2rem] p-6 border shadow-sm transition-all duration-300",
          "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
        )}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Medal size={18} className="text-amber-500" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Suas Conquistas</h3>
          </div>
          <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500">
            STREAK: {streak} {streak === 1 ? 'MÊS' : 'MESES'}
          </div>
        </div>

        <div className="flex justify-around items-center gap-2">
          {BADGES.map((badge, idx) => {
            const isUnlocked = streak >= badge.months;
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  isUnlocked ? badge.bg : "bg-slate-50 dark:bg-slate-800/50 opacity-30 grayscale"
                )}>
                  <badge.icon size={24} className={isUnlocked ? badge.color : "text-slate-400"} />
                </div>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-tighter",
                  isUnlocked ? "text-slate-700 dark:text-slate-300" : "text-slate-400"
                )}>{badge.label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* AI Advice Card - Full Width */}
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 }
        }}
        className={cn(
          "col-span-2 rounded-[2rem] p-6 flex flex-col gap-4 border shadow-sm relative overflow-hidden group transition-all duration-300",
          "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300",
            "bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400"
          )}>
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dicas Especialistas</h3>
            <p className={cn(
              "text-sm font-bold underline decoration-amber-200 underline-offset-4 transition-colors",
              "text-slate-800 dark:text-slate-200"
            )}>FinWise AI</p>
          </div>
        </div>
        <div className="space-y-3">
          {(() => {
            try {
              const tips = JSON.parse(aiAdvice || '[]');
              if (Array.isArray(tips) && tips.length > 0) {
                return tips.slice(0, 3).map((tip, idx) => (
                  <motion.div 
                    key={`tip-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-2xl transition-all duration-300",
                      "bg-slate-50/50 dark:bg-slate-800/50"
                    )}
                  >
                    <div className="mt-0.5 text-amber-500 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                    </div>
                    <p className={cn(
                      "text-[13px] leading-relaxed font-bold italic",
                      "text-slate-600 dark:text-slate-300"
                    )}>
                      "{tip}"
                    </p>
                  </motion.div>
                ));
              }
            } catch (e) {
              // Fallback to plain text if parsing fails (for initial loading state or legacy text)
            }
            return (
              <p className={cn(
                "text-sm leading-relaxed font-bold p-4 rounded-2xl transition-all duration-300 italic",
                "text-slate-600 bg-slate-50/50 dark:text-slate-300 dark:bg-slate-800/50"
              )}>
                {aiAdvice}
              </p>
            );
          })()}
        </div>
      </motion.div>

      {/* Budget Progress - Full Width */}
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 }
        }}
        className={cn(
          "col-span-2 rounded-[2rem] p-6 border shadow-sm transition-all duration-300",
          "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
        )}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meta de Orçamento</h3>
          <span className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-full transition-colors duration-300",
            "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          )}>MENSAL</span>
        </div>
        <div className="space-y-6">
          {budgets.slice(0, 3).map((cat, index) => {
            const spent = transactions
              .filter(t => t.category === cat.name && t.type === 'expense')
              .reduce((acc, t) => acc + t.amount, 0);
            const limit = cat.budgetLimit || 0;
            const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            
            return (
              <div key={`${cat.id}-${index}`} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-8 rounded-full" style={{ backgroundColor: cat.color }} />
                    <div>
                      <p className={cn(
                        "font-bold text-sm leading-tight transition-colors duration-300",
                        "text-slate-800 dark:text-slate-200"
                      )}>{cat.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {formatCurrency(spent)} {limit > 0 && ` / ${formatCurrency(limit)}`}
                      </p>
                    </div>
                  </div>
                  {limit > 0 && (
                    <span className={cn(
                      "text-xs font-bold font-mono transition-colors",
                      percentage > 90 ? "text-rose-500" : "text-slate-400 dark:text-slate-500"
                    )}>
                      {percentage.toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className={cn(
                  "h-2.5 w-full rounded-full overflow-hidden transition-colors duration-300",
                  "bg-slate-100 dark:bg-slate-800"
                )}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Reminders Card - Half Width */}
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 }
        }}
        className={cn(
          "col-span-2 rounded-[2rem] p-6 border flex flex-col justify-between gap-6 transition-all duration-300",
          "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50"
        )}
      >
        <div>
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-all duration-300",
            "bg-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/40 dark:bg-emerald-600"
          )}>
            <Bell size={24} className="text-white" />
          </div>
          <h4 className={cn(
            "font-bold text-lg leading-tight uppercase tracking-tight transition-colors duration-300",
            "text-emerald-900 dark:text-emerald-400"
          )}>Contas Próximas</h4>
          <div className="mt-4 space-y-3">
            {nextReminders.slice(0, 2).map((r, index) => (
              <div key={`${r.id}-${index}`} className={cn(
                "flex justify-between items-center p-3 rounded-2xl border transition-all duration-300",
                "bg-white/50 border-emerald-100/50 dark:bg-slate-900/40 dark:border-emerald-800/30"
              )}>
                <p className={cn(
                  "text-xs font-bold truncate pr-2 transition-colors",
                  "text-emerald-800 dark:text-emerald-300"
                )}>{r.title}</p>
                <p className={cn(
                  "text-xs font-bold whitespace-nowrap transition-colors",
                  "text-emerald-600 dark:text-emerald-500"
                )}>{formatCurrency(r.amount)}</p>
              </div>
            ))}
            {nextReminders.length === 0 && <p className="text-xs text-emerald-600 opacity-60">Tudo em dia!</p>}
          </div>
        </div>
      </motion.div>
    </motion.div>

  );
}
