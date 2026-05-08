import { useState, useCallback } from 'react';
import { Copy, Check, RefreshCw, Pencil, X, Check as CheckIcon } from 'lucide-react';
import miraIcon from '@/assets/mira_icon.jpg';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: () => void;
  onEdit?: (id: string, content: string) => void;
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden my-3 border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-raised text-xs text-muted-foreground">
        <span className="font-mono">{language || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: '13px' }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-surface-raised transition-colors text-muted-foreground hover:text-foreground">
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export function MessageBubble({ message, isLast, onRegenerate, onEdit }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const isUser = message.role === 'user';

  const handleSaveEdit = useCallback(() => {
    if (editValue.trim() && onEdit) {
      onEdit(message.id, editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, message.id, onEdit]);

  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
    >
      {isUser ? (
        <div className="max-w-[85%]">
          {isEditing ? (
            <div className="bg-surface-raised rounded-2xl p-3 space-y-2">
              <textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-full bg-transparent text-sm resize-none focus:outline-none min-h-[60px]"
                autoFocus
              />
              <div className="flex items-center gap-2 justify-end">
                <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg hover:bg-border transition-colors"><X size={14} /></button>
                <button onClick={handleSaveEdit} className="p-1.5 rounded-lg bg-primary text-primary-foreground"><CheckIcon size={14} /></button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-surface-raised rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-muted-foreground tabular-nums">{time}</span>
                <button onClick={() => { setEditValue(message.content); setIsEditing(true); }} className="p-1 rounded hover:bg-surface-raised transition-colors text-muted-foreground hover:text-foreground">
                  <Pencil size={12} />
                </button>
                <CopyButton text={message.content} />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="max-w-[85%] w-full">
          <div className="flex items-center gap-2 mb-2">
            <img src={miraIcon} alt="MIRA" className="w-7 h-7 rounded-lg shrink-0" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/60">MIRA</span>
          </div>
          <div className="mira-prose pl-9">
            <ReactMarkdown
              components={{
                code(props) {
                  const { children, node, ...rest } = props as any;
                  const cls = node?.properties?.className;
                  const langClass = Array.isArray(cls) ? cls.find((c: string) => c.startsWith('language-')) : typeof cls === 'string' ? cls : '';
                  const match = /language-(\w+)/.exec(langClass || '');
                  const codeStr = String(children).replace(/\n$/, '');
                  if (match) {
                    return <CodeBlock language={match[1]}>{codeStr}</CodeBlock>;
                  }
                  return <code {...rest}>{children}</code>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          <div className="flex items-center gap-2 mt-2 pl-9 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-muted-foreground tabular-nums">{time}</span>
            <CopyButton text={message.content} />
            {isLast && onRegenerate && (
              <button onClick={onRegenerate} className="p-1 rounded hover:bg-surface-raised transition-colors text-muted-foreground hover:text-foreground" title="Regenerate">
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
