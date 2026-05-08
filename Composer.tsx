import { useRef, useState, useEffect, KeyboardEvent } from 'react';
import { Send, Square, Paperclip, Mic, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ComposerProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  voiceEnabled?: boolean;
  voiceLang?: string;
  voiceAutoSend?: boolean;
}

export function Composer({ onSend, onStop, isGenerating, voiceEnabled = true, voiceLang = 'en-US', voiceAutoSend = false }: ComposerProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const voice = useVoiceInput({
    lang: voiceLang,
    timeout: 30000,
    autoSend: voiceAutoSend,
    onAutoSend: (text) => {
      if (text.trim()) onSend(text.trim());
    },
  });

  // Sync live transcript into textarea
  useEffect(() => {
    if (voice.state === 'listening' && voice.transcript) {
      setValue(voice.transcript);
      handleInput();
    }
  }, [voice.transcript, voice.state]);

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const handleSend = () => {
    if (!value.trim() || isGenerating) return;
    if (voice.state === 'listening') voice.stop();
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (voice.state === 'listening') {
      voice.stop();
    } else {
      voice.start();
    }
  };

  const isListening = voice.state === 'listening';

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        {/* Listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium w-fit mx-auto"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
              Listening…
              <button onClick={voice.cancel} className="ml-1 p-0.5 rounded hover:bg-destructive/20 transition-colors">
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-end bg-surface-raised border border-border rounded-2xl transition-shadow focus-within:ring-1 focus-within:ring-ring">
          <button
            className="p-3 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => { setValue(e.target.value); handleInput(); }}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Speak now…' : 'Message MIRA...'}
            rows={1}
            className="flex-1 bg-transparent text-foreground caret-foreground py-3.5 pr-2 text-sm resize-none focus:outline-none placeholder:text-muted-foreground/60 max-h-[200px] scrollbar-thin"
          />

          {/* Voice button */}
          {voiceEnabled && voice.isSupported && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleVoice}
                    className={`m-1.5 p-2 rounded-xl transition-colors shrink-0 ${
                      isListening
                        ? 'bg-destructive text-destructive-foreground animate-pulse'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Mic size={16} />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{isListening ? 'Stop listening' : 'Speak to MIRA'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={isGenerating ? onStop : handleSend}
            disabled={!isGenerating && !value.trim()}
            className="m-2 p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-opacity shrink-0"
          >
            {isGenerating ? <Square size={16} /> : <Send size={16} />}
          </motion.button>
        </div>
        <p className="text-[10px] text-center mt-2.5 text-muted-foreground/50 uppercase tracking-[0.15em] font-medium tabular-nums">
          MIRA Core v1.0 · Precision Intelligence
        </p>
      </div>
    </div>
  );
}
