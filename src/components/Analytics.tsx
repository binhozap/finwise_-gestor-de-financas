import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Transaction, Category } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface AnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
  theme: 'light' | 'dark';
}

export default function Analytics({ transactions = [], categories = [], theme }: AnalyticsProps) {
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`relatorio-finwise-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const tDate = parseISO(t.date);
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));
    return isWithinInterval(tDate, { start, end });
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenseData = (categories || []).map((cat): { id: string, name: string, value: number, color: string } => {
    const total = filteredTransactions
      .filter(t => t.category === cat.name && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return { id: cat.id, name: cat.name, value: total, color: cat.color };
  }).filter(d => d.value > 0);

  // Comparison over time (grouped by date)
  const daysDiff = differenceInDays(parseISO(endDate), parseISO(startDate));
  const numDays = Math.max(1, daysDiff + 1);

  const comparisonData = Array.from({ length: numDays }, (_, i) => {
    const date = addDays(parseISO(startDate), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const income = filteredTransactions
      .filter(t => t.date && t.date.startsWith(dateStr) && t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.date && t.date.startsWith(dateStr) && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    
    return { 
      day: format(date, 'dd/MM'), 
      income, 
      expense 
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6 pb-20"
    >
      <div className="flex justify-end mb-2">
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm",
            theme === 'dark' 
              ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" 
              : "bg-blue-50 text-blue-600 hover:bg-blue-100",
            isExporting && "opacity-50 cursor-not-allowed"
          )}
        >
          <Download size={14} className={isExporting ? "animate-bounce" : ""} />
          {isExporting ? "Gerando PDF..." : "Exportar PDF"}
        </button>
      </div>

      <div ref={reportRef} className={cn("space-y-6", theme === 'dark' ? "text-slate-100" : "text-slate-800")}>
        {/* Date Range Filter */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Filter size={18} />
          </div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filtro de Período</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Início</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fim</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
            />
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <TrendingUp size={14} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receitas</span>
          </div>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg">
              <TrendingDown size={14} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Despesas</span>
          </div>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalExpense)}</p>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Comparativo Diário</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                formatter={(value: any) => {
                  const v = Array.isArray(value) ? value[0] : value;
                  return formatCurrency(Number(v) || 0);
                }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  color: 'var(--tooltip-text, #000)'
                }}
                cursor={{ fill: 'transparent', opacity: 0.1 }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle" 
                wrapperStyle={{ paddingTop: 0, paddingBottom: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}
              />
              <Bar name="Receita" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar name="Despesa" dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Gastos por Categoria</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name?: any, props?: any) => {
                  const v = Array.isArray(value) ? value[0] : value;
                  return formatCurrency(Number(v) || 0);
                }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  color: 'var(--tooltip-text, #000)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          {expenseData.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{item.name}</p>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{formatCurrency(item.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Monitoring Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Controle de Orçamentos</h3>
        <div className="space-y-6">
          {categories
            .filter(cat => cat.budgetLimit && cat.budgetLimit > 0)
            .map((cat, index) => {
              const spent = filteredTransactions
                .filter(t => t.category === cat.name && t.type === 'expense')
                .reduce((acc, t) => acc + t.amount, 0);
              const percentage = Math.min((spent / (cat.budgetLimit || 1)) * 100, 100);
              const isOver = spent > (cat.budgetLimit || 0);

              return (
                <div key={`${cat.id}-${index}`} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className={cn(
                        "text-xs font-bold transition-colors",
                        theme === 'dark' ? "text-slate-100" : "text-slate-800"
                      )}>
                        {cat.name}
                        {cat.parentId && (
                          <span className="text-[9px] text-slate-400 ml-1 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                            Sub
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {formatCurrency(spent)} de {formatCurrency(cat.budgetLimit || 0)}
                      </p>
                    </div>
                    <p className={cn(
                      "text-[10px] font-bold",
                      isOver ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {Math.round((spent / (cat.budgetLimit || 1)) * 100)}%
                    </p>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={cn(
                        "h-full rounded-full transition-colors",
                        isOver ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-emerald-500"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          {categories.filter(cat => cat.budgetLimit && cat.budgetLimit > 0).length === 0 && (
            <div className="py-8 text-center">
              <p className="text-xs text-slate-400 font-medium">Nenhum orçamento configurado.</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </motion.div>
  );
}
