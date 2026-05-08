import { useRef, useEffect } from 'react';
import type { Chat } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { EmptyState } from './EmptyState';
import { Composer } from './Composer';

interface ChatWindowProps {
  chat: Chat | null;
  isGenerating: boolean;
  onSend: (content: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
  onEditMessage: (id: string, content: string) => void;
  voiceEnabled?: boolean;
  voiceLang?: string;
  voiceAutoSend?: boolean;
}

export function ChatWindow({ chat, isGenerating, onSend, onStop, onRegenerate, onEditMessage, voiceEnabled, voiceLang, voiceAutoSend }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat?.messages.length, isGenerating]);

  const hasMessages = chat && chat.messages.length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {!hasMessages ? (
          <EmptyState onPromptClick={onSend} />
        ) : (
          <div className="max-w-3xl mx-auto w-full py-6 px-4 space-y-6">
            {chat.messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLast={i === chat.messages.length - 1 && msg.role === 'assistant'}
                onRegenerate={onRegenerate}
                onEdit={onEditMessage}
              />
            ))}
            {isGenerating && <TypingIndicator />}
          </div>
        )}
      </div>
      <Composer
        onSend={onSend}
        onStop={onStop}
        isGenerating={isGenerating}
        voiceEnabled={voiceEnabled}
        voiceLang={voiceLang}
        voiceAutoSend={voiceAutoSend}
      />
    </div>
  );
}
