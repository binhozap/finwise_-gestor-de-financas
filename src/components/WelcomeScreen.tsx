import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Wallet, TrendingUp, PieChart, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onComplete: () => void;
  theme: 'dark' | 'light';
}

export default function WelcomeScreen({ onComplete, theme }: WelcomeScreenProps) {
  return (
    <div className={cn(
      "flex flex-col h-screen w-full relative overflow-hidden transition-colors duration-300",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-40",
          theme === 'dark' ? "bg-blue-600/30" : "bg-blue-200"
        )} />
        <div className={cn(
          "absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-40",
          theme === 'dark' ? "bg-purple-600/30" : "bg-blue-300/50"
        )} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className={cn(
            "w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl mb-8",
            theme === 'dark' ? "bg-blue-600 text-white shadow-blue-900/50" : "bg-blue-600 text-white shadow-blue-200"
          )}
        >
          <Wallet size={48} strokeWidth={1.5} />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-4 mb-12"
        >
          <h1 className="text-4xl font-extrabold tracking-tight">FinWise</h1>
          <p className={cn(
            "text-lg max-w-[280px] mx-auto leading-relaxed font-medium",
            theme === 'dark' ? "text-slate-400" : "text-slate-600"
          )}>
            O seu gestor financeiro inteligente. Simples, rápido e no seu controle.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full space-y-4 max-w-sm"
        >
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-3xl border",
            theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white/80 border-slate-100"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              theme === 'dark' ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"
            )}>
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Controle de Gastos</h3>
              <p className={cn("text-xs", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>Monitore cada centavo</p>
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-4 p-4 rounded-3xl border",
            theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white/80 border-slate-100"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              theme === 'dark' ? "bg-purple-900/30 text-purple-400" : "bg-purple-50 text-purple-600"
            )}>
              <PieChart size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Análises Interativas</h3>
              <p className={cn("text-xs", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>Entenda para onde vai o dinheiro</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-6 relative z-10 pb-safe"
      >
        <button
          onClick={onComplete}
          className={cn(
            "w-full py-4 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98]",
            theme === 'dark' 
              ? "bg-blue-600 text-white shadow-blue-900/30 hover:bg-blue-500" 
              : "bg-slate-900 text-white shadow-slate-300 hover:bg-slate-800"
          )}
        >
          Começar
          <ArrowRight size={20} />
        </button>
      </motion.div>
    </div>
  );
}
