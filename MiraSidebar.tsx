import { useState, useMemo } from 'react';
import { Plus, Search, MessageSquare, Settings, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import miraIcon from '@/assets/mira_icon.jpg';
import { motion, AnimatePresence } from 'framer-motion';
import type { Chat } from '@/types/chat';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onOpenSettings: () => void;
}

function groupChats(chats: Chat[]) {
  const now = Date.now();
  const dayMs = 86400000;
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart - dayMs;
  const weekStart = todayStart - 7 * dayMs;

  const groups: { label: string; chats: Chat[] }[] = [
    { label: 'Today', chats: [] },
    { label: 'Yesterday', chats: [] },
    { label: 'Previous 7 Days', chats: [] },
    { label: 'Older', chats: [] },
  ];

  chats.forEach(c => {
    if (c.createdAt >= todayStart) groups[0].chats.push(c);
    else if (c.createdAt >= yesterdayStart) groups[1].chats.push(c);
    else if (c.createdAt >= weekStart) groups[2].chats.push(c);
    else groups[3].chats.push(c);
  });

  return groups.filter(g => g.chats.length > 0);
}

function ChatItem({ chat, isActive, onSelect, onDelete, onRename }: {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);

  const handleRename = () => {
    if (renameValue.trim()) onRename(renameValue.trim());
    setIsRenaming(false);
  };

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
        isActive ? 'bg-surface border border-border shadow-subtle' : 'hover:bg-surface-raised'
      }`}
      onClick={isRenaming ? undefined : onSelect}
    >
      <MessageSquare size={14} className="shrink-0 text-muted-foreground" />
      {isRenaming ? (
        <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <input
            autoFocus
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <button onClick={handleRename} className="p-0.5 text-primary"><Pencil size={12} /></button>
          <button onClick={() => setIsRenaming(false)} className="p-0.5 text-muted-foreground"><X size={12} /></button>
        </div>
      ) : (
        <>
          <span className="truncate flex-1">{chat.title}</span>
          <button
            onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-border transition-all shrink-0"
          >
            <MoreHorizontal size={14} />
          </button>
        </>
      )}

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-subtle py-1 min-w-[140px]"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => { setIsRenaming(true); setShowMenu(false); }} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-surface-raised w-full transition-colors">
              <Pencil size={12} /> Rename
            </button>
            <button onClick={() => { onDelete(); setShowMenu(false); }} className="flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5 w-full transition-colors">
              <Trash2 size={12} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MiraSidebar({ chats, activeChatId, isOpen, onClose, onSelectChat, onNewChat, onDeleteChat, onRenameChat, onOpenSettings }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return chats.filter(c => c.title.toLowerCase().includes(q));
  }, [chats, searchQuery]);

  const groups = useMemo(() => groupChats(filtered), [filtered]);

  const sidebarContent = (
    <div className="flex flex-col h-full w-[260px]">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={miraIcon} alt="MIRA" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold tracking-tight text-base">MIRA</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onNewChat}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          title="New chat"
        >
          <Plus size={18} />
        </motion.button>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
          <input
            placeholder="Search chats…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-sidebar-accent rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-thin space-y-4">
        {groups.map(group => (
          <div key={group.label}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium px-3 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.chats.map(chat => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === activeChatId}
                  onSelect={() => { onSelectChat(chat.id); onClose(); }}
                  onDelete={() => onDeleteChat(chat.id)}
                  onRename={title => onRenameChat(chat.id, title)}
                />
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-sidebar-accent transition-colors w-full"
        >
          <Settings size={14} className="text-muted-foreground" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 260 : 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:block relative h-full bg-sidebar border-r border-sidebar-border overflow-hidden shrink-0"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 bg-sidebar border-r border-sidebar-border md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
