import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, History, Trash2, Repeat, X, Cloud, ExternalLink, Receipt } from 'lucide-react';
import { Transaction, Category } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import CategoryIcon from './CategoryIcon';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onClearAll: () => void;
}

export default function Transactions({ transactions = [], categories = [], onClearAll }: TransactionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredTransactions = (transactions || []).filter(t => {
    const search = searchTerm.toLowerCase();
    const categoryName = (t.category || '').toLowerCase();
    const note = (t.note || '').toLowerCase();
    
    const matchesSearch = categoryName.includes(search) || note.includes(search);
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    
    let matchesDate = true;
    if (t.date) {
      if (startDate && t.date < startDate) matchesDate = false;
      if (endDate && t.date > endDate) matchesDate = false;
    }

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const clearFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setStartDate('');
    setEndDate('');
  };
  
  const hasActiveFilters = filterType !== 'all' || filterCategory !== 'all' || startDate !== '' || endDate !== '';

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar gastos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full border rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 shadow-sm transition-all duration-300",
              "bg-white border-slate-100 focus:ring-blue-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
            )}
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "p-3 border rounded-2xl shadow-sm transition-all duration-300 relative",
            showFilters 
              ? "bg-blue-50 border-blue-100 text-blue-500 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400"
              : "bg-white border-slate-100 text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
          )}
          title="Filtros"
        >
          <Filter size={18} />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white dark:border-slate-950 rounded-full"></span>
          )}
        </button>
        <button 
          onClick={() => transactions.length > 0 && setShowConfirm(true)}
          className={cn(
            "p-3 border rounded-2xl shadow-sm transition-all duration-300",
            transactions.length > 0 
              ? "bg-rose-50 border-rose-100 text-rose-500 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400"
              : "bg-white border-slate-100 text-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-700 cursor-not-allowed"
          )}
          title="Limpar Histórico"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Filtros Avançados</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-[10px] text-blue-500 hover:text-blue-600 font-bold uppercase flex items-center gap-1">
                    <X size={12} /> Limpar
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                  <button
                    onClick={() => setFilterType('all')}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                      filterType === 'all' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterType('expense')}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                      filterType === 'expense' ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 shadow-sm" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    Despesas
                  </button>
                  <button
                    onClick={() => setFilterType('income')}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                      filterType === 'income' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    Receitas
                  </button>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Categoria</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">Todas as Categorias</option>
                    {categories.map((c, index) => (
                      <option key={`${c.id}-${index}`} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">De</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 text-slate-800 dark:text-slate-200"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Até</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showConfirm && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-4 rounded-3xl space-y-3"
        >
          <p className="text-xs font-bold text-rose-800 dark:text-rose-300 text-center">
            Tem certeza que deseja apagar TODO o histórico? Esta ação é irreversível.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                onClearAll();
                setShowConfirm(false);
              }}
              className="flex-1 bg-rose-500 text-white font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider"
            >
              Sim, Apagar Tudo
            </button>
            <button 
              onClick={() => setShowConfirm(false)}
              className="flex-1 bg-white dark:bg-slate-800 text-slate-500 font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider border border-slate-200 dark:border-slate-700"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        <AnimatePresence initial={false} mode="popLayout">
          {sortedTransactions.length > 0 ? sortedTransactions.map((t, index) => {
            const cat = categories.find(c => c.name === t.category);
            return (
              <motion.div 
                key={`${t.id}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "p-4 rounded-2xl border flex items-center justify-between shadow-sm group transition-all duration-300",
                  "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner shrink-0" style={{ backgroundColor: cat?.color || '#cbd5e1' }}>
                    <CategoryIcon name={cat?.icon} size={22} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <h4 className={cn(
                      "font-bold text-sm transition-colors duration-300 truncate",
                      "text-slate-800 dark:text-slate-200"
                    )}>{t.note || t.category}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <p className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight transition-colors duration-300",
                        "bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500 w-fit truncate max-w-[100px]"
                      )}>{t.category}</p>
                      <p className="text-[10px] text-slate-300 font-bold uppercase flex items-center gap-1 shrink-0">
                        {t.date ? format(parseISO(t.date), "dd MMM", { locale: ptBR }) : '-'}
                        {t.frequency && t.frequency !== 'none' && <Repeat size={10} className="text-blue-400" />}
                        {t.recurrenceId && <Repeat size={10} className="text-slate-200" />}
                      </p>
                      {t.receiptUrl && (
                        <a
                          href={t.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver comprovante no Google Drive"
                          className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight transition-colors flex items-center gap-1 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60"
                        >
                          <Cloud size={10} />
                          <span>Recibo</span>
                          <ExternalLink size={8} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p className={cn(
                    "font-bold text-sm",
                    t.type === 'expense' ? "text-rose-500" : "text-emerald-500"
                  )}>
                    {t.type === 'expense' ? '-' : '+'} {formatCurrency(t.amount)}
                  </p>
                </div>
              </motion.div>
            );
          }) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <History className="mx-auto text-slate-200 dark:text-slate-700 mb-4" size={48} />
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Nenhuma transação encontrada.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
