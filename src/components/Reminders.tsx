import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, CheckCircle2, Circle, AlertCircle, Plus, X, Tag, DollarSign, Repeat } from 'lucide-react';
import { BillReminder, Category, RecurrenceFrequency } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { addDays, addWeeks, addMonths, addYears, format, parseISO } from 'date-fns';

import CategoryIcon from './CategoryIcon';

interface RemindersProps {
  reminders: BillReminder[];
  setReminders: React.Dispatch<React.SetStateAction<BillReminder[]>>;
  categories: Category[];
}

export default function Reminders({ reminders = [], setReminders, categories = [] }: RemindersProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('none');
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedReminders = [...reminders].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  const togglePaid = (id: string) => {
    setReminders(prev => {
      const reminder = prev.find(r => r.id === id);
      if (!reminder || !reminder.dueDate) return prev;

      const isMarkingPaid = !reminder.isPaid;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Update existing reminder
      let updatedReminders = prev.map(r => 
        r.id === id 
          ? { ...r, isPaid: isMarkingPaid, paidAt: isMarkingPaid ? today : undefined } 
          : r
      );

      // If marking as paid and it's recurring, generate the next one if it doesn't exist
      if (isMarkingPaid && reminder.frequency && reminder.frequency !== 'none') {
        const date = parseISO(reminder.dueDate);
        let nextDate: Date;
        
        switch (reminder.frequency) {
          case 'daily': nextDate = addDays(date, 1); break;
          case 'weekly': nextDate = addWeeks(date, 1); break;
          case 'biweekly': nextDate = addWeeks(date, 2); break;
          case 'monthly': nextDate = addMonths(date, 1); break;
          case 'quarterly': nextDate = addMonths(date, 3); break;
          case 'yearly': nextDate = addYears(date, 1); break;
          default: nextDate = date;
        }

        const nextDueDate = format(nextDate, 'yyyy-MM-dd');

        // Robust duplicate check: same title, same date, and same category
        const alreadyExists = prev.some(r => 
          r.title.trim().toLowerCase() === reminder.title.trim().toLowerCase() && 
          r.dueDate === nextDueDate &&
          r.category === reminder.category
        );
        
        if (!alreadyExists) {
          const nextReminder: BillReminder = {
            ...reminder,
            id: crypto.randomUUID(),
            dueDate: nextDueDate,
            isPaid: false,
            paidAt: undefined
          };
          updatedReminders = [...updatedReminders, nextReminder];
        }
      } else if (!isMarkingPaid && reminder.frequency && reminder.frequency !== 'none') {
        // If we're marking it as UNPAID, and it was recurring, we might want to clean up
        // But for simplicity in this version, we'll keep it as is to avoid deleting something
        // that the user might have modified.
      }

      return updatedReminders;
    });
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) return;

    const newReminder: BillReminder = {
      id: crypto.randomUUID(),
      title,
      amount: parseFloat(amount),
      dueDate,
      category,
      isPaid: false,
      frequency
    };

    setReminders(prev => [...prev, newReminder]);
    
    // Reset form
    setTitle('');
    setAmount('');
    setDueDate('');
    setFrequency('none');
    setIsAdding(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 pb-20"
    >
      <div className="flex justify-between items-center gap-4">
        <div className={cn(
          "flex p-1 rounded-xl transition-colors duration-300",
          "bg-slate-100 dark:bg-slate-900"
        )}>
          <button 
            onClick={() => setFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
              filter === 'all' 
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100" 
                : "text-slate-400"
            )}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
              filter === 'pending' 
                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400" 
                : "text-slate-400"
            )}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setFilter('paid')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
              filter === 'paid' 
                ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-400" 
                : "text-slate-400"
            )}
          >
            Pagos
          </button>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "p-3 rounded-2xl transition-all shadow-lg duration-300",
            isAdding 
              ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" 
              : "bg-slate-900 text-white shadow-slate-200 dark:bg-blue-600 dark:shadow-blue-900/20"
          )}
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form 
              onSubmit={handleAddReminder}
              className={cn(
                "p-6 rounded-[2rem] border shadow-sm space-y-4 mb-6 transition-all duration-300",
                "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
              )}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Título da Conta</label>
                  <div className="relative">
                    <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                    <input 
                      type="text" 
                      placeholder="Ex: Aluguel, Energia..." 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={cn(
                        "w-full border rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-300",
                        "bg-slate-50 border-slate-100 focus:ring-blue-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-blue-900/40"
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="0,00" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={cn(
                          "w-full border rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 transition-all duration-300",
                          "bg-slate-50 border-slate-100 text-slate-800 focus:ring-blue-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-blue-900/40"
                        )}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vencimento</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                      <input 
                        type="date" 
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className={cn(
                          "w-full border rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-300",
                          "bg-slate-50 border-slate-100 focus:ring-blue-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-blue-900/40"
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={cn(
                        "w-full border rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 appearance-none transition-all duration-300",
                        "bg-slate-50 border-slate-100 focus:ring-blue-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:ring-blue-900/40"
                      )}
                    >
                      {categories.map((cat, index) => (
                        <option key={`${cat.id}-${index}`} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Frequência</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { id: 'none', label: 'Única', icon: Circle },
                      { id: 'daily', label: 'Diário', icon: Repeat },
                      { id: 'weekly', label: 'Semanal', icon: Repeat },
                      { id: 'biweekly', label: '15 dias', icon: Repeat },
                      { id: 'monthly', label: 'Mensal', icon: Repeat },
                      { id: 'quarterly', label: 'Trimestral', icon: Repeat },
                      { id: 'yearly', label: 'Anual', icon: Repeat },
                    ].map((freq) => (
                      <button
                        key={freq.id}
                        type="button"
                        onClick={() => setFrequency(freq.id as RecurrenceFrequency)}
                        className={cn(
                          "py-3 px-1 rounded-2xl border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1",
                          freq.id === 'none' && "col-span-3",
                          frequency === freq.id
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                        )}
                      >
                        <freq.icon size={14} strokeWidth={3} />
                        {freq.label}
                      </button>
                    ))}
                  </div>
                  {frequency !== 'none' && dueDate && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="text-[9px] text-blue-500 font-bold uppercase tracking-wider mt-2 ml-1"
                    >
                      Próxima após pagamento: {(() => {
                        const date = parseISO(dueDate);
                        let next: Date;
                        switch(frequency) {
                          case 'daily': next = addDays(date, 1); break;
                          case 'weekly': next = addWeeks(date, 1); break;
                          case 'biweekly': next = addWeeks(date, 2); break;
                          case 'monthly': next = addMonths(date, 1); break;
                          case 'quarterly': next = addMonths(date, 3); break;
                          case 'yearly': next = addYears(date, 1); break;
                          default: next = date;
                        }
                        return format(next, 'dd/MM/yyyy');
                      })()}
                    </motion.p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className={cn(
                  "w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] duration-300",
                  "bg-slate-900 text-white shadow-slate-200 dark:bg-blue-600 dark:shadow-blue-900/20"
                )}
              >
                Adicionar Lembrete
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {/* Section: Pendentes */}
        {(filter === 'all' || filter === 'pending') && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pendentes</h4>
            </div>
            <div className="space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {sortedReminders.filter(r => !r.isPaid).length > 0 ? (
                  sortedReminders.filter(r => !r.isPaid).map((bill, index) => (
                    <motion.div 
                      key={`${bill.id}-${index}`} 
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "p-5 rounded-[2rem] border shadow-sm transition-all flex flex-col group duration-300 cursor-pointer hover:shadow-md",
                        "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
                      )}
                      onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4 flex-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); togglePaid(bill.id); }}
                            className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm flex-shrink-0",
                              "bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500 dark:bg-slate-800 dark:text-slate-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                            )}
                          >
                            <Circle size={24} />
                          </button>
                          <div className="flex-1 overflow-hidden">
                            <h4 className={cn(
                              "font-bold text-sm transition-colors duration-300 truncate",
                              "text-slate-800 dark:text-slate-200"
                            )}>
                              {bill.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter transition-colors">Vence {bill.dueDate ? format(parseISO(bill.dueDate), 'dd/MM/yyyy') : 'N/A'}</p>
                              {bill.frequency && bill.frequency !== 'none' && (
                                <>
                                  <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                  <div className={cn(
                                    "flex items-center gap-0.5 text-[10px] font-bold uppercase transition-colors shrink-0",
                                    "text-blue-400 dark:text-blue-500"
                                  )}>
                                    <Repeat size={10} />
                                    <span>{
                                      bill.frequency === 'daily' ? 'Diário' :
                                      bill.frequency === 'weekly' ? 'Semanal' : 
                                      bill.frequency === 'biweekly' ? 'Quinzenal' :
                                      bill.frequency === 'monthly' ? 'Mensal' :
                                      bill.frequency === 'quarterly' ? 'Trimestral' : 'Anual'
                                    }</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end pl-2">
                          <p className={cn(
                            "font-bold text-sm transition-colors duration-300",
                            "text-slate-700 dark:text-slate-300"
                          )}>
                            {formatCurrency(bill.amount)}
                          </p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(bill.id); }}
                            className="mt-1 flex items-center justify-center w-6 h-6 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:text-slate-700 dark:hover:text-rose-500 dark:hover:bg-rose-900/30 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedId === bill.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden border-t border-slate-100 dark:border-slate-800 pt-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Categoria</span>
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <CategoryIcon name={categories.find(c => c.name === bill.category)?.icon} size={14} className="text-slate-500 dark:text-slate-400" />
                                  </div>
                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{bill.category}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Data Original de Ref.</span>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center h-full">
                                  {bill.dueDate ? format(parseISO(bill.dueDate), 'dd/MM/yyyy') : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "py-12 text-center rounded-[2.5rem] border border-dashed transition-all duration-300",
                      "bg-white/50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800"
                    )}
                  >
                    <CheckCircle2 className="mx-auto text-emerald-200 dark:text-emerald-900/50 mb-3" size={32} />
                    <p className="text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest">Sem contas pendentes</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Section: Pagos */}
        {(filter === 'all' || filter === 'paid') && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full" />
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pagos</h4>
            </div>
            <div className="space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {sortedReminders.filter(r => r.isPaid).length > 0 ? (
                  sortedReminders.filter(r => r.isPaid).map((bill, index) => (
                    <motion.div 
                      key={`${bill.id}-${index}`} 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "p-4 rounded-[1.5rem] border transition-all flex flex-col opacity-80 duration-300 cursor-pointer hover:opacity-100",
                        "bg-emerald-50/30 border-emerald-100/50 dark:bg-emerald-900/10 dark:border-emerald-800/30"
                      )}
                      onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); togglePaid(bill.id); }}
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner",
                              "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-500"
                            )}
                          >
                            <CheckCircle2 size={20} />
                          </button>
                          <div>
                            <h4 className={cn(
                              "font-bold text-xs line-through transition-colors duration-300",
                              "text-slate-400 dark:text-slate-600"
                            )}>
                              {bill.title}
                            </h4>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-none mt-1 transition-colors">
                              {bill.paidAt ? `Pago em ${format(parseISO(bill.paidAt), 'dd/MM/yyyy')}` : `Vencimento em ${bill.dueDate ? format(parseISO(bill.dueDate), 'dd/MM/yyyy') : ''}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="font-bold text-xs text-slate-500 dark:text-slate-700">
                            {formatCurrency(bill.amount)}
                          </p>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedId === bill.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden border-t border-emerald-100/50 dark:border-emerald-800/30 pt-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Categoria</span>
                                <div className="flex items-center gap-2">
                                  <div className="p-1 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30">
                                    <CategoryIcon name={categories.find(c => c.name === bill.category)?.icon} size={12} className="text-emerald-600 dark:text-emerald-500" />
                                  </div>
                                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{bill.category}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Data Original de Ref.</span>
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center h-full">
                                  {bill.dueDate ? format(parseISO(bill.dueDate), 'dd/MM/yyyy') : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Nenhuma conta paga este mês</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Lembrete?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">
                Esta ação cancelará este lembrete de pagamento e não poderá ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deleteReminder(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="flex-1 bg-rose-600 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
