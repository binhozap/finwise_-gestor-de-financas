import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import { Plus, Trash2, Edit2, X, Check, User, Sun, Moon, GripVertical, ChevronRight, ChevronDown, Upload, Palette, Sticker, Cloud, HardDrive } from 'lucide-react';
import { Category } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import CategoryIcon, { ICONS_MAP } from './CategoryIcon';

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (category: Omit<Category, 'id'>) => void;
  onUpdate: (id: string, category: Partial<Category>) => void;
  onDelete: (id: string) => void;
  userName: string;
  onUserNameChange: (name: string) => void;
  userAvatar: string;
  onUserAvatarChange: (avatar: string) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onOpenGoogleDrive?: () => void;
}

const PRESET_COLORS = [
  '#EF4444', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', 
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#64748B'
];

const PRESET_AVATARS = [
  '👤', '👨', '👩', '🧑', '👧', '👦', '👵', '👴', '👶', '🤓', '😎', '🤠', '😇',
  '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦉',
  '🦄', '🐙', '🦖', '🐢', '🐍', '🐠', '🐬', '🐳', '🦈', '🐊', '🐅', '🐆', '🦓',
  '🤖', '👾', '👽', '👻', '🤡', '👹', '👺', '🚀', '🛸', '⭐', '🔥', '💎', '💡', 
  '🎨', '🎮', '🎸', '🎧', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🎳', '🎯'
];

const PRESET_ICONS_LIST = [
  'Utensils', 'Car', 'Home', 'Gamepad2', 'HeartPulse', 'GraduationCap', 
  'ShoppingBag', 'Laptop', 'Coffee', 'Dumbbell', 'Music', 'Plane',
  'Gift', 'Baby', 'Briefcase', 'Zap', 'Shield', 'Smartphone', 'Tv', 'Camera'
];

const CATEGORY_AVATARS = [
  '🍏', '🍔', '🍕', '🍰', '🚗', '🚌', '🏠', '🏨', '🎮', '💡',
  '💊', '🏥', '🎓', '📚', '🛍️', '💰', '💳', '💻', '⚽', '🎨',
  '✈️', '🎁', '👶', '💼', '⚡', '🚿', '📱', '📺', '🎞️', '🌳'
];

export default function CategoryManager({ 
  categories = [], 
  onAdd, 
  onUpdate, 
  onDelete,
  userName,
  onUserNameChange,
  userAvatar,
  onUserAvatarChange,
  theme,
  onThemeChange,
  onOpenGoogleDrive
}: CategoryManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'icons' | 'emojis' | 'upload'>('emojis');
  const [profileAvatarTab, setProfileAvatarTab] = useState<'emojis' | 'upload'>('emojis');
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newIcon, setNewIcon] = useState('Tag');
  const [newBudget, setNewBudget] = useState('');
  const [newParentId, setNewParentId] = useState<string | undefined>(undefined);

  const [tempUserName, setTempUserName] = useState(userName);

  const handleSave = () => {
    if (!newName) return;
    
    if (editingId) {
      onUpdate(editingId, { 
        name: newName, 
        color: newColor, 
        icon: newIcon,
        budgetLimit: parseFloat(newBudget) || 0,
        parentId: newParentId === 'none' ? undefined : newParentId
      });
      setEditingId(null);
    } else {
      onAdd({ 
        name: newName, 
        color: newColor, 
        icon: newIcon, 
        budgetLimit: parseFloat(newBudget) || 0,
        parentId: newParentId === 'none' ? undefined : newParentId
      });
      setIsAdding(false);
    }
    
    setNewName('');
    setNewColor(PRESET_COLORS[0]);
    setNewIcon('Tag');
    setNewBudget('');
    setNewParentId(undefined);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setNewColor(cat.color);
    setNewIcon(cat.icon || 'Tag');
    setNewBudget(cat.budgetLimit?.toString() || '');
    setNewParentId(cat.parentId || 'none');
    setIsAdding(true);
  };

  const handleDragEnd = (event: any, info: any, draggedId: string) => {
    const droppedOnId = dragOverId;
    setDragOverId(null);

    if (droppedOnId && droppedOnId !== draggedId) {
      onUpdate(draggedId, { parentId: droppedOnId });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for performance
        alert('A imagem deve ter no máximo 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewIcon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-20"
    >
      {/* Profile Section */}
      <section className={cn(
        "p-5 rounded-[2rem] border shadow-sm transition-colors duration-300",
        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div 
          className="flex justify-between items-center cursor-pointer select-none"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm border transition-all duration-300 relative overflow-hidden",
              theme === 'dark' ? "bg-slate-800 text-white border-slate-700" : "bg-slate-50 text-slate-800 border-slate-200"
            )}>
              {userAvatar ? (
                userAvatar.startsWith('data:image') ? (
                  <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{userAvatar}</span>
                )
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Perfil & Ajustes</h3>
              <p className={cn(
                "text-sm font-bold leading-none",
                theme === 'dark' ? "text-slate-200" : "text-slate-700"
              )}>
                {userName || "Seu Nome"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onThemeChange('light')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  theme === 'light' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Sun size={14} />
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  theme === 'dark' ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Moon size={14} />
              </button>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <ChevronRight className={cn("transition-transform duration-300", isProfileOpen ? "rotate-90" : "")} size={20} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 space-y-5">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Seu nome" 
                    value={tempUserName}
                    onChange={(e) => setTempUserName(e.target.value)}
                    className={cn(
                      "w-full border rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 transition-all duration-300",
                      theme === 'dark' 
                        ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-900/50" 
                        : "bg-slate-50 border-slate-100 text-slate-800 focus:ring-blue-100"
                    )}
                  />
                  {tempUserName !== userName && (
                    <button 
                      onClick={() => onUserNameChange(tempUserName)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-500 text-white rounded-lg shadow-md"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full mb-3">
                  {[
                    { id: 'emojis', label: 'Emojis' },
                    { id: 'upload', label: 'Upload' }
                  ].map((t, index) => (
                    <button
                      key={`${t.id}-${index}`}
                      onClick={() => setProfileAvatarTab(t.id as 'emojis' | 'upload')}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                        profileAvatarTab === t.id
                          ? (theme === 'dark' ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-800 shadow-sm")
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Escolha um avatar</h4>
                  {profileAvatarTab === 'emojis' ? (
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto px-1 py-1 scrollbar-thin">
                      {PRESET_AVATARS.map(avatar => (
                        <button
                          key={avatar}
                          onClick={() => onUserAvatarChange(avatar)}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                            userAvatar === avatar 
                              ? (theme === 'dark' ? "bg-blue-600/20 border-2 border-blue-500 scale-110 shadow-sm" : "bg-blue-100 border-2 border-blue-500 scale-110 shadow-sm") 
                              : (theme === 'dark' ? "bg-slate-800 border border-slate-700 hover:bg-slate-700" : "bg-slate-50 border border-slate-100 hover:bg-slate-100")
                          )}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-5 border rounded-2xl border-dashed border-slate-200 dark:border-slate-800">
                      <div className="w-16 h-16 rounded-2xl relative flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {userAvatar && userAvatar.startsWith('data:image') ? (
                          <img src={userAvatar} alt="Custom Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Upload size={24} className="text-slate-400" />
                        )}
                      </div>
                      
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 1024 * 1024) {
                                alert('A imagem deve ter no máximo 1MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                onUserAvatarChange(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button type="button" className={cn(
                          "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                          theme === 'dark' ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        )}>
                          <Upload size={14} />
                          Carregar Imagem
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 text-center uppercase tracking-widest font-bold">Máx 1MB</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Google Drive Integration Card */}
      <section className={cn(
        "p-6 rounded-[2.5rem] border shadow-sm transition-all duration-300",
        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center shadow-md",
              "bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 text-white"
            )}>
              <Cloud size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "text-sm font-bold leading-none",
                  theme === 'dark' ? "text-slate-100" : "text-slate-800"
                )}>
                  Google Drive
                </h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase tracking-wider">
                  Nuvem
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Backups, extratos CSV e recibos na sua conta Google
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenGoogleDrive}
            className={cn(
              "px-4 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 active:scale-95",
              "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
            )}
          >
            <span>Gerenciar</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </section>

      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Minhas Categorias</h3>
            <p className="text-[10px] text-slate-300 font-medium">Arraste uma subcategoria para mover ou nesting</p>
          </div>
          <button 
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setNewName('');
              setNewBudget('');
            }}
            className={cn(
              "p-3 rounded-2xl shadow-lg transition-all duration-300 active:scale-90",
              theme === 'dark' ? "bg-blue-600 text-white shadow-blue-900/20" : "bg-slate-900 text-white shadow-slate-200"
            )}
          >
            <Plus size={24} />
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "p-6 rounded-[2.5rem] border shadow-2xl space-y-6 overflow-hidden mb-8 transition-all duration-300",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-blue-50"
              )}
            >
              <div className="flex justify-between items-center">
                <h4 className={cn(
                  "text-base font-bold transition-colors",
                  theme === 'dark' ? "text-slate-100" : "text-slate-800"
                )}>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h4>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Nome da categoria" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={cn(
                      "w-full border rounded-2xl py-4 px-5 text-sm font-semibold focus:outline-none focus:ring-2 transition-all",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-900/50" : "bg-slate-50 border-slate-100 focus:ring-blue-100"
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Orçamento (R$)</label>
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={newBudget}
                        onChange={(e) => setNewBudget(e.target.value)}
                        className={cn(
                          "w-full border rounded-2xl py-4 px-5 text-sm font-bold focus:outline-none focus:ring-2 transition-all",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-900/50" : "bg-slate-50 border-slate-100 focus:ring-blue-100"
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Parentesco</label>
                      <select 
                        value={newParentId || 'none'}
                        onChange={(e) => setNewParentId(e.target.value)}
                        className={cn(
                          "w-full border rounded-2xl py-4 px-5 text-sm font-semibold focus:outline-none focus:ring-2 appearance-none transition-all",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-900/50" : "bg-slate-50 border-slate-100 focus:ring-blue-100"
                        )}
                      >
                        <option value="none">Principal</option>
                        {categories.filter(c => !c.parentId && c.id !== editingId).map((cat, index) => (
                          <option key={`${cat.id}-${index}`} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-100 text-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: newColor }}>
                        <Palette size={18} />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-widest text-[10px] text-slate-400">Paleta de Cores</span>
                    </div>
                    <ChevronDown size={18} className={cn("transition-transform duration-300 text-slate-400", isColorPickerOpen ? "rotate-180" : "")} />
                  </button>

                  <AnimatePresence>
                    {isColorPickerOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={cn(
                          "p-4 rounded-2xl border border-dashed mt-2 flex flex-wrap gap-3",
                          theme === 'dark' ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"
                        )}>
                          {PRESET_COLORS.map((color, index) => (
                            <button
                              key={`${color}-${index}`}
                              type="button"
                              onClick={() => {
                                setNewColor(color);
                                setIsColorPickerOpen(false);
                              }}
                              className={cn(
                                "w-10 h-10 rounded-2xl transition-all relative overflow-hidden",
                                newColor === color ? "ring-4 ring-blue-500/20 scale-110 shadow-lg" : "opacity-90 hover:opacity-100 hover:scale-105"
                              )}
                              style={{ backgroundColor: color }}
                            >
                              {newColor === color && <div className="absolute inset-0 flex items-center justify-center text-white"><Check size={16} strokeWidth={3} /></div>}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-100 text-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: newColor }}>
                        {newIcon.startsWith('data:image') ? (
                          <img src={newIcon} alt="Icon" className="w-5 h-5 object-cover rounded-lg" />
                        ) : activeTab === 'icons' && ICONS_MAP[newIcon as keyof typeof ICONS_MAP] ? (
                          <CategoryIcon name={newIcon} size={18} />
                        ) : (
                          <span className="text-sm">{newIcon}</span>
                        )}
                      </div>
                      <span className="text-sm font-bold uppercase tracking-widest text-[10px] text-slate-400">Escolha o Símbolo</span>
                    </div>
                    <ChevronDown size={18} className={cn("transition-transform duration-300 text-slate-400", isIconPickerOpen ? "rotate-180" : "")} />
                  </button>

                  <AnimatePresence>
                    {isIconPickerOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={cn(
                          "p-4 rounded-2xl border border-dashed mt-2 space-y-4",
                          theme === 'dark' ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"
                        )}>
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {[
                              { id: 'emojis', label: 'Emoji' },
                              { id: 'icons', label: 'Vetor' },
                              { id: 'upload', label: 'Upload' }
                            ].map((t, index) => (
                              <button
                                key={`${t.id}-${index}`}
                                type="button"
                                onClick={() => setActiveTab(t.id as any)}
                                className={cn(
                                  "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                                  activeTab === t.id 
                                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                                    : "text-slate-500"
                                )}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>

                          <div className={cn(
                            activeTab !== 'upload' && "grid grid-cols-5 gap-2 max-h-48",
                            "overflow-y-auto p-2 scrollbar-thin transition-all"
                          )}>
                            {activeTab === 'upload' ? (
                              <div className="flex flex-col items-center justify-center py-6 gap-5">
                                <div className="w-20 h-20 rounded-3xl relative flex items-center justify-center shrink-0" style={{ backgroundColor: newColor }}>
                                  {newIcon.startsWith('data:image') ? (
                                    <img src={newIcon} alt="Custom Icon" className="w-12 h-12 object-cover rounded-xl" />
                                  ) : (
                                    <Upload size={32} className="text-white opacity-40" />
                                  )}
                                </div>
                                
                                <div className="relative">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                  <button type="button" className={cn(
                                    "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                                    theme === 'dark' ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                  )}>
                                    <Upload size={14} />
                                    Carregar Imagem
                                  </button>
                                </div>
                                <p className="text-[9px] text-slate-400 text-center uppercase tracking-widest font-bold">Máx 1MB • Fundo Transparente</p>
                              </div>
                            ) : activeTab === 'emojis' ? (
                              CATEGORY_AVATARS.map((emoji, index) => (
                                <button
                                  key={`${emoji}-${index}`}
                                  type="button"
                                  onClick={() => {
                                    setNewIcon(emoji);
                                    setIsIconPickerOpen(false);
                                  }}
                                  className={cn(
                                    "aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all",
                                    newIcon === emoji 
                                      ? (theme === 'dark' ? "bg-blue-600 text-white shadow-lg scale-110" : "bg-slate-900 text-white shadow-lg scale-110") 
                                      : (theme === 'dark' ? "bg-slate-800 border border-slate-700 hover:bg-slate-700" : "bg-white border border-slate-100 hover:bg-slate-50")
                                  )}
                                >
                                  {emoji}
                                </button>
                              ))
                            ) : (
                              PRESET_ICONS_LIST.map((name, index) => (
                                <button
                                  key={`${name}-${index}`}
                                  type="button"
                                  onClick={() => {
                                    setNewIcon(name);
                                    setIsIconPickerOpen(false);
                                  }}
                                  className={cn(
                                    "aspect-square rounded-2xl flex items-center justify-center transition-all",
                                    newIcon === name 
                                      ? (theme === 'dark' ? "bg-blue-600 text-white shadow-lg scale-110" : "bg-slate-900 text-white shadow-lg scale-110") 
                                      : (theme === 'dark' ? "bg-slate-800 border border-slate-700 hover:bg-slate-700" : "bg-white border border-slate-100 hover:bg-slate-50")
                                  )}
                                >
                                  <CategoryIcon name={name} size={20} />
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                 <button 
                  onClick={() => setIsAdding(false)}
                  className={cn(
                    "flex-1 py-4 rounded-2xl text-sm font-bold transition-all",
                    theme === 'dark' ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <Check size={20} />
                  <span>{editingId ? 'Salvar Tudo' : 'Confirmar'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {categories.filter(c => !c.parentId).map((mainCat, index) => (
              <motion.div 
                key={`${mainCat.id}-${index}`} 
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-3"
                onMouseEnter={() => setDragOverId(mainCat.id)}
                onMouseLeave={() => dragOverId === mainCat.id && setDragOverId(null)}
              >
                <div className={cn(
                  "p-5 rounded-[2rem] border flex items-center justify-between shadow-sm group transition-all duration-300 relative",
                  theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200",
                  dragOverId === mainCat.id && "ring-2 ring-emerald-500 ring-offset-4 ring-offset-transparent shadow-emerald-500/10"
                )}>
                  {dragOverId === mainCat.id && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Solte para aninhar</div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner" style={{ backgroundColor: mainCat.color }}>
                      <CategoryIcon name={mainCat.icon} size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-bold text-sm transition-colors",
                        theme === 'dark' ? "text-slate-100" : "text-slate-800"
                      )}>{mainCat.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {mainCat.budgetLimit ? formatCurrency(mainCat.budgetLimit) : 'Sem limite'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setNewParentId(mainCat.id);
                        setNewColor(mainCat.color);
                        setNewIcon(mainCat.icon || 'Tag');
                        setEditingId(null);
                        setNewName('');
                        setNewBudget('');
                        setIsAdding(true);
                      }}
                      className={cn(
                        "p-2 transition-colors rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
                        theme === 'dark' ? "text-slate-500 hover:text-emerald-500" : "text-slate-400 hover:text-emerald-600"
                      )}
                      title="Adicionar subcategoria"
                    >
                      <Plus size={18} />
                    </button>
                    <button 
                      onClick={() => startEdit(mainCat)}
                      className={cn(
                        "p-2 transition-colors rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20",
                        theme === 'dark' ? "text-slate-500 hover:text-blue-500" : "text-slate-400 hover:text-blue-600"
                      )}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(mainCat.id)}
                      className={cn(
                        "p-2 transition-colors rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20",
                        theme === 'dark' ? "text-slate-500 hover:text-rose-500" : "text-slate-400 hover:text-rose-600"
                      )}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Subcategories Container */}
                <div className="ml-8 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 pl-4 py-1">
                  <AnimatePresence>
                    {categories.filter(c => c.parentId === mainCat.id).map((subCat, index) => (
                      <motion.div 
                        key={`${subCat.id}-${index}`} 
                        layout
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        onDragEnd={(e, info) => handleDragEnd(e, info, subCat.id)}
                        whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          "p-4 rounded-[1.5rem] border flex items-center justify-between shadow-sm group transition-all duration-300 relative bg-white/60 dark:bg-slate-900/50",
                          theme === 'dark' ? "border-slate-800 hover:border-slate-700" : "border-slate-100 hover:border-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-slate-300 dark:text-slate-700 cursor-grab active:cursor-grabbing p-1">
                             <GripVertical size={14} />
                          </div>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-inner" style={{ backgroundColor: subCat.color }}>
                            <CategoryIcon name={subCat.icon} size={16} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className={cn(
                              "font-bold text-xs transition-colors",
                              theme === 'dark' ? "text-slate-100" : "text-slate-700"
                            )}>{subCat.name}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                              {subCat.budgetLimit ? formatCurrency(subCat.budgetLimit) : 'Sem limite'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button 
                            onClick={() => {
                              onUpdate(subCat.id, { parentId: undefined });
                            }}
                            className={cn(
                              "p-1.5 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800",
                              theme === 'dark' ? "text-slate-500 hover:text-amber-500" : "text-slate-400 hover:text-amber-600"
                            )}
                            title="Remover do aninhamento"
                          >
                             <ChevronRight className="rotate-180" size={14} />
                          </button>
                          <button 
                            onClick={() => startEdit(subCat)}
                            className={cn(
                              "p-1.5 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800",
                              theme === 'dark' ? "text-slate-500 hover:text-blue-500" : "text-slate-400 hover:text-blue-600"
                            )}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(subCat.id)}
                            className={cn(
                              "p-1.5 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800",
                              theme === 'dark' ? "text-slate-500 hover:text-rose-500" : "text-slate-400 hover:text-rose-600"
                            )}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {deleteConfirmId && (() => {
          const catToDelete = categories.find(c => c.id === deleteConfirmId);
          const relatedSubcategories = categories.filter(c => c.parentId === deleteConfirmId);
          const hasSubcategories = relatedSubcategories.length > 0;
          
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "w-full max-w-sm rounded-[2rem] p-6 shadow-2xl",
                  theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white"
                )}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mb-2",
                    theme === 'dark' ? "bg-rose-900/30 text-rose-500" : "bg-rose-100 text-rose-600"
                  )}>
                    <Trash2 size={32} />
                  </div>
                  <h3 className={cn(
                    "text-xl font-bold",
                    theme === 'dark' ? "text-white" : "text-slate-900"
                  )}>
                    Excluir Categoria?
                  </h3>
                  <div className={cn(
                    "text-sm font-medium space-y-2",
                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                  )}>
                    <p>Você está prestes a excluir a categoria <strong>{catToDelete?.name}</strong>.</p>
                    {hasSubcategories && (
                      <p className="text-rose-500 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-900/20 p-2 rounded-xl border border-rose-100 dark:border-rose-900/30">
                        Atenção: Esta categoria possui {relatedSubcategories.length} subcategoria(s) associada(s) que também {relatedSubcategories.length === 1 ? 'será excluída' : 'serão excluídas'}!
                      </p>
                    )}
                    <p>Esta ação não pode ser desfeita.</p>
                  </div>
                  <div className="flex gap-3 w-full mt-4">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className={cn(
                        "flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all",
                        theme === 'dark' ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        onDelete(deleteConfirmId);
                        setDeleteConfirmId(null);
                      }}
                      className="flex-1 bg-rose-600 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                    >
                      Excluir {hasSubcategories ? "Tudo" : ""}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}
