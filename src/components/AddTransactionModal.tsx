import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Calendar, Tag, FileText, Check, ScanLine, Loader2, Cloud, Paperclip, Upload } from 'lucide-react';
import { Category, TransactionType, RecurrenceFrequency } from '../types';
import { cn } from '../lib/utils';
import { uploadReceiptToDrive } from '../services/googleDrive';
import { getAccessToken } from '../services/googleAuth';

import CategoryIcon from './CategoryIcon';
import BarcodeScanner from './BarcodeScanner';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (t: any) => void;
  categories: Category[];
}

export default function AddTransactionModal({ isOpen, onClose, onAdd, categories }: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('none');
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const sortedCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    const main = categories.filter(c => !c.parentId);
    const result: Category[] = [];
    main.forEach(m => {
      result.push(m);
      const subs = categories.filter(c => c.parentId === m.id);
      result.push(...subs);
    });
    return result;
  }, [categories]);

  const fetchProductFromBarcode = async (barcode: string) => {
    setIsScanning(true);
    setShowScanner(false);
    try {
      // Usando a API do Open Food Facts
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const productName = data.product.product_name || data.product.generic_name || 'Produto com código: ' + barcode;
        setNote(productName);
        setType('expense');
        
        // Tentar sugerir categoria
        if (sortedCategories.some(c => c.name.toLowerCase().includes('alimentação') || c.name.toLowerCase().includes('mercado'))) {
           const cat = sortedCategories.find(c => c.name.toLowerCase().includes('mercado') || c.name.toLowerCase().includes('alimentação'));
           if (cat) setCategory(cat.name);
        }
      } else {
        setNote(`Código: ${barcode}`);
      }
    } catch (e) {
      console.error(e);
      setNote(`Código: ${barcode}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    let receiptUrl: string | undefined;
    let receiptDriveId: string | undefined;
    let receiptName: string | undefined;

    if (receiptFile) {
      setIsUploadingReceipt(true);
      try {
        const token = await getAccessToken();
        if (token) {
          const uploaded = await uploadReceiptToDrive(receiptFile, note || category);
          receiptUrl = uploaded.webViewLink;
          receiptDriveId = uploaded.id;
          receiptName = uploaded.name;
        }
      } catch (err) {
        console.warn('Não foi possível salvar recibo no Drive:', err);
      } finally {
        setIsUploadingReceipt(false);
      }
    }

    onAdd({
      type,
      amount: parseFloat(amount),
      category,
      note,
      date: new Date().toISOString(),
      frequency,
      receiptUrl,
      receiptDriveId,
      receiptName
    });
    
    // Reset and close
    setAmount('');
    setNote('');
    setFrequency('none');
    setReceiptFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {showScanner && (
        <BarcodeScanner 
          onResult={fetchProductFromBarcode} 
          onClose={() => setShowScanner(false)} 
        />
      )}
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            "relative w-full max-w-md max-h-[90dvh] overflow-y-auto scrollbar-thin rounded-t-[2.5rem] sm:rounded-3xl p-8 pb-10 shadow-2xl safe-bottom transition-all duration-300",
            "bg-white dark:bg-slate-950"
          )}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className={cn(
              "text-xl font-bold tracking-tight transition-colors duration-300",
              "text-slate-800 dark:text-slate-100"
            )}>Nova Transação</h2>
            <button onClick={onClose} className={cn(
              "p-2 rounded-full transition-all duration-300",
              "bg-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-300"
            )}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Switcher */}
            <div className={cn(
              "flex p-1 rounded-2xl transition-colors duration-300",
              "bg-slate-100 dark:bg-slate-900"
            )}>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300",
                  type === 'expense' 
                    ? "bg-white text-rose-500 shadow-sm dark:bg-slate-800 dark:text-rose-400" 
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300",
                  type === 'income' 
                    ? "bg-white text-emerald-500 shadow-sm dark:bg-slate-800 dark:text-emerald-400" 
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                Receita
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Valor</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xl">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  autoFocus
                  placeholder="0,00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={cn(
                    "w-full border rounded-2xl py-4 pl-16 pr-6 text-2xl font-bold focus:outline-none focus:ring-4 transition-all duration-300",
                    "bg-slate-50 border-slate-100 text-slate-800 focus:ring-blue-50 placeholder:text-slate-200",
                    "dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/20 dark:placeholder:text-slate-700"
                  )}
                />
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Categoria</label>
              <div className="grid grid-cols-3 gap-2">
                {sortedCategories.map((cat, index) => (
                  <button
                    key={`${cat.id}-${index}`}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={cn(
                      "py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all duration-300 shadow-sm",
                      category === cat.name 
                        ? (type === 'expense' 
                            ? "bg-rose-500 border-rose-500 text-white shadow-rose-200 dark:shadow-rose-900/40" 
                            : "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 dark:shadow-emerald-900/40")
                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700",
                      cat.parentId && "opacity-80 scale-95"
                    )}
                  >
                    <div className="relative">
                      <CategoryIcon name={cat.icon} size={cat.parentId ? 14 : 16} />
                      {cat.parentId && (
                        <div className="absolute -left-2 -top-1 w-1 h-3 border-l border-b border-current opacity-30" />
                      )}
                    </div>
                    <span className={cn(
                      "font-bold uppercase tracking-tight truncate w-full px-1",
                      cat.parentId ? "text-[8px]" : "text-[9px]"
                    )}>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Nota ou descrição (opcional)" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={cn(
                      "w-full border rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-300",
                      "bg-slate-50 border-slate-100 focus:ring-blue-100",
                      "dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
                    )}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  disabled={isScanning}
                  className={cn(
                    "px-4 border rounded-2xl flex items-center justify-center transition-all duration-300 group",
                    "bg-slate-50 border-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200",
                    "dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 dark:hover:border-blue-800/50"
                  )}
                  title="Escanear código de barras"
                >
                  {isScanning ? <Loader2 size={20} className="animate-spin" /> : <ScanLine size={20} className="group-hover:scale-110 transition-transform" />}
                </button>
              </div>
            </div>

            {/* Receipt Attachment (Google Drive) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud size={12} className="text-blue-500" />
                  <span>Comprovante (Google Drive)</span>
                </label>
                {receiptFile && (
                  <button
                    type="button"
                    onClick={() => setReceiptFile(null)}
                    className="text-[10px] text-rose-500 hover:underline font-bold"
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className={cn(
                "p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors",
                "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
              )}>
                {receiptFile ? (
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <Paperclip size={16} className="text-blue-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {receiptFile.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({(receiptFile.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer w-full text-slate-400 hover:text-blue-500 transition-colors">
                    <Paperclip size={16} className="shrink-0" />
                    <span className="text-xs font-medium">Anexar foto ou PDF do recibo</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setReceiptFile(file);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Recurrence Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Repetição</label>
              <div className={cn(
                "flex p-1 rounded-2xl transition-colors duration-300 w-full overflow-x-auto scrollbar-none",
                "bg-slate-100 dark:bg-slate-900"
              )}>
                {[
                  { value: 'none', label: 'Não' },
                  { value: 'weekly', label: 'Semanal' },
                  { value: 'monthly', label: 'Mensal' },
                  { value: 'yearly', label: 'Anual' }
                ].map(freq => (
                  <button
                    key={freq.value}
                    type="button"
                    onClick={() => setFrequency(freq.value as RecurrenceFrequency)}
                    className={cn(
                      "flex-1 min-w-[60px] py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                      frequency === freq.value 
                        ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400" 
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className={cn(
                "w-full text-white font-bold py-5 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-2 group duration-300",
                type === 'expense' 
                  ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100 dark:shadow-rose-900/20" 
                  : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100 dark:shadow-emerald-900/20"
              )}
            >
              <span>Salvar Transação</span>
              <Check className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
