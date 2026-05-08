import { useState } from 'react';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { MiraSidebar } from './MiraSidebar';
import { ChatWindow } from './ChatWindow';
import { SettingsModal } from './SettingsModal';
import { useChatStore } from '@/hooks/use-chat-store';
import { useTheme } from '@/hooks/use-theme';
import type { ModelId } from '@/types/chat';
import { MODEL_LABELS } from '@/types/chat';

const VOICE_SETTINGS_KEY = 'mira_voice_settings';
const SYSTEM_PROMPT_KEY = 'mira_system_prompt';
const DEFAULT_SYSTEM_PROMPT = 'You are MIRA (My Intelligent Responsive Assistant), a compassionate and empowering AI built specifically for women\'s safety and wellbeing. Respond with warmth, clarity, and confidence. Be concise, helpful, and always prioritize the user\'s safety and comfort.';

function loadVoiceSettings() {
  try {
    const raw = localStorage.getItem(VOICE_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { enabled: true, autoSend: false, lang: 'en-US' };
  } catch {
    return { enabled: true, autoSend: false, lang: 'en-US' };
  }
}

export function AppShell() {
  const store = useChatStore();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [model, setModel] = useState<ModelId>('mira-core');
  const [voiceSettings, setVoiceSettings] = useState(loadVoiceSettings);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    () => localStorage.getItem(SYSTEM_PROMPT_KEY) ?? DEFAULT_SYSTEM_PROMPT
  );

  const updateSystemPrompt = (prompt: string) => {
    setSystemPrompt(prompt);
    localStorage.setItem(SYSTEM_PROMPT_KEY, prompt);
  };

  const updateVoiceSettings = (patch: Partial<typeof voiceSettings>) => {
    setVoiceSettings((prev: typeof voiceSettings) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <MiraSidebar
        chats={store.chats}
        activeChatId={store.activeChatId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectChat={store.setActiveChatId}
        onNewChat={() => store.createChat(model)}
        onDeleteChat={store.deleteChat}
        onRenameChat={store.renameChat}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-border flex items-center justify-between px-3 shrink-0">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-surface-raised transition-colors"
          >
            <Menu size={18} />
          </motion.button>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Model:</span>
            <span className="px-2 py-1 bg-surface-raised rounded-md border border-border font-medium tabular-nums">
              {MODEL_LABELS[model]}
            </span>
          </div>
          <div className="w-9" />
        </header>

        <ChatWindow
          chat={store.activeChat}
          isGenerating={store.isGenerating}
          onSend={(content) => store.sendMessage(content, systemPrompt)}
          onStop={store.stopGenerating}
          onRegenerate={store.regenerateLastResponse}
          onEditMessage={store.editMessage}
          voiceEnabled={voiceSettings.enabled}
          voiceLang={voiceSettings.lang}
          voiceAutoSend={voiceSettings.autoSend}
        />
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
        model={model}
        onModelChange={setModel}
        onClearAll={store.clearAllChats}
        onExport={store.exportChats}
        onImport={store.importChats}
        voiceEnabled={voiceSettings.enabled}
        voiceAutoSend={voiceSettings.autoSend}
        voiceLang={voiceSettings.lang}
        onVoiceSettingsChange={updateVoiceSettings}
          systemPrompt={systemPrompt}
          onSystemPromptChange={updateSystemPrompt}
        />
    </div>
  );
}
