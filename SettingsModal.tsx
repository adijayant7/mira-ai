import { useState, useRef } from 'react';
import { X, Download, Upload, Trash2, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ModelId } from '@/types/chat';
import { MODEL_LABELS } from '@/types/chat';

const VOICE_LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'pt-BR', label: 'Portuguese (BR)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'ar-SA', label: 'Arabic' },
];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  model: ModelId;
  onModelChange: (m: ModelId) => void;
  onClearAll: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  voiceEnabled: boolean;
  voiceAutoSend: boolean;
  voiceLang: string;
  onVoiceSettingsChange: (patch: { enabled?: boolean; autoSend?: boolean; lang?: string }) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
}

export function SettingsModal({ open, onClose, theme, onToggleTheme, model, onModelChange, onClearAll, onExport, onImport, voiceEnabled, voiceAutoSend, voiceLang, onVoiceSettingsChange, systemPrompt, onSystemPromptChange }: SettingsModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImport(reader.result as string);
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card border border-border rounded-2xl shadow-subtle w-full max-w-md max-h-[85vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
                <h2 className="font-semibold text-sm">Settings</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Theme</p>
                    <p className="text-xs text-muted-foreground">Switch between light and dark</p>
                  </div>
                  <button
                    onClick={onToggleTheme}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-surface-raised transition-colors"
                  >
                    {theme === 'light' ? 'Dark' : 'Light'}
                  </button>
                </div>

                {/* Model */}
                <div>
                  <p className="text-sm font-medium mb-2">Model</p>
                  <div className="flex gap-2">
                    {(Object.keys(MODEL_LABELS) as ModelId[]).map(m => (
                      <button
                        key={m}
                        onClick={() => onModelChange(m)}
                        className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                          model === m ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-surface-raised'
                        }`}
                      >
                        {MODEL_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* System Prompt */}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">System Prompt</p>
                    <p className="text-xs text-muted-foreground">Define MIRA's personality, tone, and behavior</p>
                  </div>
                  <textarea
                    value={systemPrompt}
                    onChange={e => onSystemPromptChange(e.target.value)}
                    placeholder="e.g. You are MIRA, a helpful women's safety AI assistant. Be empathetic, concise, and always prioritize user safety. Reply in a calm and reassuring tone."
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-raised text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed placeholder:text-muted-foreground/60"
                  />
                  <p className="text-[11px] text-muted-foreground">This prompt shapes how MIRA responds in every conversation.</p>
                </div>

                {/* Voice Input */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mic size={14} className="text-muted-foreground" />
                    <p className="text-sm font-medium">Voice Input</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">Enable voice input</p>
                      <p className="text-[11px] text-muted-foreground">Show microphone button in composer</p>
                    </div>
                    <button
                      onClick={() => onVoiceSettingsChange({ enabled: !voiceEnabled })}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        voiceEnabled ? 'bg-primary' : 'bg-border'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground shadow-sm transition-transform ${
                        voiceEnabled ? 'left-[18px]' : 'left-0.5'
                      }`} />
                    </button>
                  </div>

                  {voiceEnabled && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium">Auto-send after speech</p>
                          <p className="text-[11px] text-muted-foreground">Send message automatically when done speaking</p>
                        </div>
                        <button
                          onClick={() => onVoiceSettingsChange({ autoSend: !voiceAutoSend })}
                          className={`w-9 h-5 rounded-full transition-colors relative ${
                            voiceAutoSend ? 'bg-primary' : 'bg-border'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground shadow-sm transition-transform ${
                            voiceAutoSend ? 'left-[18px]' : 'left-0.5'
                          }`} />
                        </button>
                      </div>

                      <div>
                        <p className="text-xs font-medium mb-1.5">Language</p>
                        <select
                          value={voiceLang}
                          onChange={e => onVoiceSettingsChange({ lang: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-raised text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {VOICE_LANGUAGES.map(l => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Data</p>
                  <div className="flex gap-2">
                    <button onClick={onExport} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-surface-raised transition-colors flex-1">
                      <Download size={14} /> Export
                    </button>
                    <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-surface-raised transition-colors flex-1">
                      <Upload size={14} /> Import
                    </button>
                    <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </div>
                  {confirmClear ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-destructive">Delete all chats?</span>
                      <button onClick={() => { onClearAll(); setConfirmClear(false); }} className="px-2 py-1 rounded text-xs bg-destructive text-destructive-foreground">Yes</button>
                      <button onClick={() => setConfirmClear(false)} className="px-2 py-1 rounded text-xs border border-border">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmClear(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors w-full">
                      <Trash2 size={14} /> Clear all chats
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
