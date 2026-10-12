import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownLeft, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import { Transaction, Category, BillReminder } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface DashboardProps {
  transactions: Transaction[];
  reminders: BillReminder[];
  budgets: Category[];
  aiAdvice: string;
}

export default function Dashboard({ transactions = [], reminders = [], budgets = [], aiAdvice }: DashboardProps) {
  const totalIncome = (transactions || [])
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalExpenses = (transactions || [])
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpenses;

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
            <Calendar size={24} className="text-white" />
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
