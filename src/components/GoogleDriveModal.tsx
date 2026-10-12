import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ExternalLink, 
  X, 
  HardDrive, 
  FileSpreadsheet, 
  FolderCheck,
  ShieldCheck,
  Upload,
  Receipt,
  LogOut,
  Clock,
  Sparkles
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getCurrentUser 
} from '../services/googleAuth';
import { 
  getDriveStorageInfo, 
  listDriveBackups, 
  createDriveBackup, 
  downloadDriveBackup, 
  exportCsvToDrive, 
  uploadReceiptToDrive, 
  listReceiptFiles, 
  deleteDriveFile,
  APP_FOLDER_NAME
} from '../services/googleDrive';
import { 
  Transaction, 
  Category, 
  BillReminder, 
  FinWiseBackupData, 
  DriveFileInfo 
} from '../types';
import GoogleSignInButton from './GoogleSignInButton';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  reminders: BillReminder[];
  userName: string;
  userAvatar: string;
  theme: 'light' | 'dark';
  onRestoreData: (backup: FinWiseBackupData) => void;
}

export default function GoogleDriveModal({
  isOpen,
  onClose,
  transactions,
  categories,
  reminders,
  userName,
  userAvatar,
  theme,
  onRestoreData,
}: GoogleDriveModalProps) {
  const [activeTab, setActiveTab] = useState<'backup' | 'csv' | 'receipts'>('backup');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // User & Drive quota
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<{ usageBytes: number; limitBytes: number } | null>(null);

  // Files from Drive
  const [backups, setBackups] = useState<DriveFileInfo[]>([]);
  const [receipts, setReceipts] = useState<DriveFileInfo[]>([]);
  const [customBackupName, setCustomBackupName] = useState('');

  // Destructive Confirmation Dialog State
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<DriveFileInfo | null>(null);
  const [confirmRestoreFile, setConfirmRestoreFile] = useState<DriveFileInfo | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Check auth on mount / modal open
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      (user, _token) => {
        setIsAuthenticated(true);
        setGoogleUser(user);
        loadDriveData();
      },
      () => {
        setIsAuthenticated(false);
        setGoogleUser(null);
      }
    );

    const currentUser = getCurrentUser();
    if (currentUser) {
      setGoogleUser(currentUser);
      setIsAuthenticated(true);
      loadDriveData();
    }

    return () => unsubscribe();
  }, [isOpen]);

  const loadDriveData = async () => {
    setIsLoading(true);
    try {
      const [storage, backupFiles, receiptFiles] = await Promise.all([
        getDriveStorageInfo().catch(() => null),
        listDriveBackups().catch(() => []),
        listReceiptFiles().catch(() => [])
      ]);

      if (storage) setStorageInfo(storage);
      setBackups(backupFiles);
      setReceipts(receiptFiles);
    } catch (err: any) {
      console.error('Erro ao carregar dados do Google Drive:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setIsAuthenticated(true);
        setGoogleUser(res.user);
        setStatusMessage({ type: 'success', text: 'Conectado ao Google Drive com sucesso!' });
        await loadDriveData();
      }
    } catch (err: any) {
      console.error('Falha ao autenticar:', err);
      setStatusMessage({ 
        type: 'error', 
        text: err?.message || 'Não foi possível conectar com o Google Drive.' 
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      setGoogleUser(null);
      setBackups([]);
      setReceipts([]);
      setStorageInfo(null);
      setStatusMessage({ type: 'info', text: 'Desconectado do Google Drive.' });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateBackup = async () => {
    setIsProcessingAction(true);
    setStatusMessage(null);
    try {
      const payload: FinWiseBackupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        transactions,
        categories,
        reminders,
        userName,
        userAvatar,
        theme,
        meta: {
          totalTransactions: transactions.length,
          totalReminders: reminders.length,
          appName: 'FinWise'
        }
      };

      const created = await createDriveBackup(payload, customBackupName);
      setCustomBackupName('');
      setStatusMessage({ 
        type: 'success', 
        text: `Backup "${created.name}" salvo com sucesso no Google Drive!` 
      });
      await loadDriveData();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err?.message || 'Falha ao criar backup.' });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!confirmRestoreFile) return;
    setIsProcessingAction(true);
    setStatusMessage(null);
    try {
      const backupData = await downloadDriveBackup(confirmRestoreFile.id);
      onRestoreData(backupData);
      setStatusMessage({ 
        type: 'success', 
        text: `Dados restaurados com sucesso a partir de "${confirmRestoreFile.name}"!` 
      });
      setConfirmRestoreFile(null);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ 
        type: 'error', 
        text: err?.message || 'Falha ao restaurar dados do backup.' 
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!confirmDeleteFile) return;
    setIsProcessingAction(true);
    setStatusMessage(null);
    try {
      await deleteDriveFile(confirmDeleteFile.id);
      setStatusMessage({ 
        type: 'success', 
        text: `Arquivo "${confirmDeleteFile.name}" excluído do Google Drive com sucesso.` 
      });
      setConfirmDeleteFile(null);
      await loadDriveData();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ 
        type: 'error', 
        text: err?.message || 'Falha ao excluir arquivo do Google Drive.' 
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleExportCsv = async () => {
    setIsProcessingAction(true);
    setStatusMessage(null);
    try {
      const created = await exportCsvToDrive(transactions, categories);
      setStatusMessage({ 
        type: 'success', 
        text: `Relatório CSV "${created.name}" salvo no Google Drive!` 
      });
      await loadDriveData();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err?.message || 'Falha ao exportar CSV.' });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAction(true);
    setStatusMessage(null);
    try {
      const uploaded = await uploadReceiptToDrive(file, file.name.split('.')[0]);
      setStatusMessage({ 
        type: 'success', 
        text: `Comprovante "${uploaded.name}" enviado com sucesso ao Drive!` 
      });
      await loadDriveData();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err?.message || 'Erro ao fazer upload do comprovante.' });
    } finally {
      setIsProcessingAction(false);
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes?: string | number) => {
    if (!bytes) return '0 KB';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num)) return '0 KB';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatStorageUsage = (usage: number, limit: number) => {
    const usedGb = (usage / (1024 * 1024 * 1024)).toFixed(1);
    const totalGb = (limit / (1024 * 1024 * 1024)).toFixed(1);
    const pct = limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 0;
    return { usedGb, totalGb, pct };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={cn(
          "w-full max-w-xl max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl border overflow-hidden transition-colors duration-300",
          theme === 'dark' 
            ? "bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/80" 
            : "bg-white border-slate-100 text-slate-800 shadow-slate-200"
        )}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-md",
              "bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 text-white"
            )}>
              <Cloud size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">Google Drive</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase tracking-widest">
                  Nuvem
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Backups, extratos em CSV e comprovantes sincronizados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
          {/* Status Message Banner */}
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-3.5 rounded-2xl flex items-center gap-3 text-xs font-medium border",
                statusMessage.type === 'success' && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
                statusMessage.type === 'error' && "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800",
                statusMessage.type === 'info' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
              )}
            >
              {statusMessage.type === 'success' && <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />}
              {statusMessage.type === 'error' && <AlertCircle size={16} className="shrink-0 text-rose-500" />}
              {statusMessage.type === 'info' && <Cloud size={16} className="shrink-0 text-blue-500" />}
              <span className="flex-1">{statusMessage.text}</span>
              <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100">
                <X size={14} />
              </button>
            </motion.div>
          )}

          {/* Connection Card */}
          <div className={cn(
            "p-5 rounded-3xl border transition-all duration-300",
            theme === 'dark' ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200/60"
          )}>
            {!isAuthenticated ? (
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400">
                  <CloudUpload size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Conecte sua Conta Google</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                    Com permissão, salve seus dados financeiros no Google Drive com total segurança e restaure quando desejar.
                  </p>
                </div>
                <GoogleSignInButton
                  onClick={handleSignIn}
                  isLoading={isLoggingIn}
                  text="Conectar ao Google Drive"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {googleUser?.photoURL ? (
                      <img 
                        src={googleUser.photoURL} 
                        alt="Google Account" 
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {googleUser?.displayName?.charAt(0) || googleUser?.email?.charAt(0) || 'G'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm leading-tight text-slate-900 dark:text-slate-100">
                          {googleUser?.displayName || 'Conta Google'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} /> Conectado
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-xs mt-0.5">
                        {googleUser?.email || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={loadDriveData}
                      disabled={isLoading}
                      title="Atualizar dados do Drive"
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                      <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
                    </button>
                    <button
                      onClick={handleSignOut}
                      title="Desconectar"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>

                {/* Storage info bar if available */}
                {storageInfo && storageInfo.limitBytes > 0 && (() => {
                  const quota = formatStorageUsage(storageInfo.usageBytes, storageInfo.limitBytes);
                  return (
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                        <span className="flex items-center gap-1.5">
                          <HardDrive size={12} className="text-slate-400" />
                          Armazenamento no Drive
                        </span>
                        <span>{quota.usedGb} GB de {quota.totalGb} GB ({quota.pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                          style={{ width: `${quota.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <FolderCheck size={14} className="text-blue-500" />
                  <span>Pasta no Drive: <strong>{APP_FOLDER_NAME}</strong></span>
                </div>
              </div>
            )}
          </div>

          {isAuthenticated && (
            <>
              {/* Tab Selector */}
              <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/40 dark:border-slate-700/50">
                <button
                  onClick={() => setActiveTab('backup')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all",
                    activeTab === 'backup'
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  )}
                >
                  <CloudUpload size={14} />
                  <span>Backups ({backups.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('csv')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all",
                    activeTab === 'csv'
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  )}
                >
                  <FileSpreadsheet size={14} />
                  <span>Extratos CSV</span>
                </button>
                <button
                  onClick={() => setActiveTab('receipts')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all",
                    activeTab === 'receipts'
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  )}
                >
                  <Receipt size={14} />
                  <span>Recibos ({receipts.length})</span>
                </button>
              </div>

              {/* Tab: Backups */}
              {activeTab === 'backup' && (
                <div className="space-y-4">
                  {/* Create Backup Action Box */}
                  <div className={cn(
                    "p-5 rounded-3xl border space-y-3",
                    theme === 'dark' ? "bg-slate-950/40 border-slate-800" : "bg-blue-50/40 border-blue-100"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-blue-500" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Criar Novo Backup</h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {transactions.length} transações • {categories.length} categorias
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={customBackupName}
                        onChange={(e) => setCustomBackupName(e.target.value)}
                        placeholder="Nome personalizado (opcional)"
                        className={cn(
                          "flex-1 px-4 py-2.5 rounded-2xl text-xs border outline-none transition-all",
                          theme === 'dark' 
                            ? "bg-slate-900 border-slate-700 focus:border-blue-500 text-slate-100" 
                            : "bg-white border-slate-200 focus:border-blue-500 text-slate-800"
                        )}
                      />
                      <button
                        onClick={handleCreateBackup}
                        disabled={isProcessingAction}
                        className={cn(
                          "px-5 py-2.5 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50",
                          "bg-blue-600 hover:bg-blue-700"
                        )}
                      >
                        <CloudUpload size={14} />
                        <span>Fazer Backup Agora</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Existing Backups */}
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Backups Disponíveis no Google Drive
                    </h5>

                    {isLoading ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                        <RefreshCw size={20} className="animate-spin text-blue-500" />
                        <span>Consultando Google Drive...</span>
                      </div>
                    ) : backups.length === 0 ? (
                      <div className="p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                        <Cloud size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Nenhum backup encontrado na sua pasta do Google Drive.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Clique em "Fazer Backup Agora" acima para salvar sua primeira cópia na nuvem.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {backups.map((file) => (
                          <div
                            key={file.id}
                            className={cn(
                              "p-4 rounded-2xl border flex items-center justify-between gap-3 group transition-all",
                              theme === 'dark' 
                                ? "bg-slate-950/40 border-slate-800 hover:border-slate-700" 
                                : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                            )}
                          >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <FileText size={18} />
                              </div>
                              <div className="overflow-hidden">
                                <h6 className="font-bold text-xs truncate text-slate-800 dark:text-slate-200">
                                  {file.name}
                                </h6>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(file.modifiedTime).toLocaleDateString('pt-BR', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <span>•</span>
                                  <span>{formatFileSize(file.size)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Restore Button */}
                              <button
                                onClick={() => setConfirmRestoreFile(file)}
                                title="Restaurar este backup"
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1"
                              >
                                <CloudDownload size={13} />
                                <span>Restaurar</span>
                              </button>

                              {/* Open in Drive link */}
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Ver no Google Drive"
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                >
                                  <ExternalLink size={14} />
                                </a>
                              )}

                              {/* Delete Button (Triggers mandatory confirmation dialog) */}
                              <button
                                onClick={() => setConfirmDeleteFile(file)}
                                title="Excluir do Google Drive"
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: CSV Export */}
              {activeTab === 'csv' && (
                <div className="space-y-4">
                  <div className={cn(
                    "p-5 rounded-3xl border space-y-3",
                    theme === 'dark' ? "bg-slate-950/40 border-slate-800" : "bg-emerald-50/40 border-emerald-100"
                  )}>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={18} className="text-emerald-500" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Exportar Extrato para o Drive
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Gera uma planilha em formato CSV com todas as {transactions.length} transações cadastradas e salva diretamente na sua pasta do Google Drive. Compatível com Excel, Google Planilhas e Numbers.
                    </p>
                    <button
                      onClick={handleExportCsv}
                      disabled={isProcessingAction || transactions.length === 0}
                      className={cn(
                        "w-full py-3 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50",
                        "bg-emerald-600 hover:bg-emerald-700"
                      )}
                    >
                      <CloudUpload size={14} />
                      <span>Salvar Extrato CSV no Google Drive</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Receipts */}
              {activeTab === 'receipts' && (
                <div className="space-y-4">
                  <div className={cn(
                    "p-5 rounded-3xl border space-y-3",
                    theme === 'dark' ? "bg-slate-950/40 border-slate-800" : "bg-blue-50/40 border-blue-100"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt size={18} className="text-blue-500" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          Comprovantes e Notas Fiscais
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Armazene fotos e PDFs de recibos na nuvem do Google Drive na pasta <strong>FinWise - Comprovantes</strong>.
                    </p>
                    <label className={cn(
                      "w-full py-3 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer",
                      "bg-blue-600 hover:bg-blue-700"
                    )}>
                      <Upload size={14} />
                      <span>Fazer Upload de Comprovante</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Comprovantes no Google Drive
                    </h5>

                    {receipts.length === 0 ? (
                      <div className="p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                        <Receipt size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Nenhum comprovante salvo na pasta do Google Drive ainda.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {receipts.map((file) => (
                          <div
                            key={file.id}
                            className={cn(
                              "p-4 rounded-2xl border flex items-center justify-between gap-3 group transition-all",
                              theme === 'dark' 
                                ? "bg-slate-950/40 border-slate-800 hover:border-slate-700" 
                                : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                            )}
                          >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Receipt size={18} />
                              </div>
                              <div className="overflow-hidden">
                                <h6 className="font-bold text-xs truncate text-slate-800 dark:text-slate-200">
                                  {file.name}
                                </h6>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span>{new Date(file.modifiedTime).toLocaleDateString('pt-BR')}</span>
                                  <span>•</span>
                                  <span>{formatFileSize(file.size)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                >
                                  <ExternalLink size={12} />
                                  <span>Visualizar</span>
                                </a>
                              )}
                              <button
                                onClick={() => setConfirmDeleteFile(file)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Dados criptografados na sua conta Google</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>

      {/* MANDATORY USER CONFIRMATION DIALOG: DELETE FILE FROM GOOGLE DRIVE */}
      <AnimatePresence>
        {confirmDeleteFile && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "w-full max-w-md p-6 rounded-3xl shadow-2xl border space-y-4",
                theme === 'dark' ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold">Excluir arquivo do Google Drive?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Tem certeza que deseja excluir o arquivo <strong>"{confirmDeleteFile.name}"</strong> do seu Google Drive? Esta ação é definitiva e não pode ser desfeita.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteFile(null)}
                  disabled={isProcessingAction}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={isProcessingAction}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-md shadow-rose-900/20"
                >
                  {isProcessingAction && <RefreshCw size={12} className="animate-spin" />}
                  <span>Sim, Excluir do Drive</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY USER CONFIRMATION DIALOG: RESTORE BACKUP DATA */}
      <AnimatePresence>
        {confirmRestoreFile && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "w-full max-w-md p-6 rounded-3xl shadow-2xl border space-y-4",
                theme === 'dark' ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold">Restaurar dados do FinWise?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Deseja substituir as transações e lembretes atuais pelos dados salvos no backup <strong>"{confirmRestoreFile.name}"</strong>? Os dados atuais da aplicação serão atualizados para a versão deste backup.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmRestoreFile(null)}
                  disabled={isProcessingAction}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={isProcessingAction}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-md shadow-blue-900/20"
                >
                  {isProcessingAction && <RefreshCw size={12} className="animate-spin" />}
                  <span>Confirmar Restauração</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
