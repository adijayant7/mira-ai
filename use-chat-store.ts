import { useState, useEffect, useCallback, useRef } from 'react';
import type { Chat, Message, ModelId } from '@/types/chat';

const STORAGE_KEY = 'mira_chats';
const ACTIVE_KEY = 'mira_active_chat';

async function fetchGeminiResponse(history: Message[], systemPrompt?: string) {
  const response = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history, systemPrompt })
  });
  if (!response.ok) throw new Error('Failed to fetch from backend');
  const data = await response.json();
  return data.response;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function useChatStore() {
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(loadActiveId);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem(ACTIVE_KEY, activeChatId);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }, [activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId) ?? null;

  const createChat = useCallback((model: ModelId = 'mira-core') => {
    const chat: Chat = {
      id: generateId(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      model,
    };
    setChats(prev => [chat, ...prev]);
    setActiveChatId(chat.id);
    return chat.id;
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    setActiveChatId(prev => prev === id ? null : prev);
  }, []);

  const renameChat = useCallback((id: string, title: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  }, []);

  const clearAllChats = useCallback(() => {
    setChats([]);
    setActiveChatId(null);
  }, []);

  const sendMessage = useCallback(async (content: string, systemPrompt?: string) => {
    const trimmed = content.trim();
    if (!trimmed || generatingRef.current) return;

    // Determine or create chat
    let chatId: string;
    setChats(prev => {
      const existingActive = prev.find(c => c.id === activeChatId);
      if (existingActive) {
        chatId = existingActive.id;
        return prev;
      }
      // No active chat — create inline
      const newChat: Chat = {
        id: generateId(),
        title: trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : ''),
        messages: [],
        createdAt: Date.now(),
        model: 'mira-core',
      };
      chatId = newChat.id;
      return [newChat, ...prev];
    });

    // We need chatId to be set — use a micro-task to ensure state settled
    // Actually chatId is set synchronously inside the updater above
    setActiveChatId(chatId!);

    // Add user message
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setChats(prev => prev.map(c => {
      if (c.id !== chatId!) return c;
      const isFirst = c.messages.length === 0;
      return {
        ...c,
        title: isFirst ? trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : '') : c.title,
        messages: [...c.messages, userMsg],
      };
    }));

    generatingRef.current = true;
    setIsGenerating(true);

    try {
      // Build exactly the messages array that we expect to send
      let pastMessages: Message[] = [];
      const existingActive = chats.find(c => c.id === activeChatId);
      if (existingActive) {
        pastMessages = existingActive.messages;
      }
      const currentMessages = [...pastMessages, userMsg];

      const responseContent = await fetchGeminiResponse(currentMessages, systemPrompt);

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
      };

      setChats(prev => prev.map(c => {
        if (c.id !== chatId!) return c;
        return { ...c, messages: [...c.messages, assistantMsg] };
      }));
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Is the backend server running?",
        timestamp: Date.now(),
      };
      setChats(prev => prev.map(c => {
        if (c.id !== chatId!) return c;
        return { ...c, messages: [...c.messages, errorMsg] };
      }));
    }

    generatingRef.current = false;
    setIsGenerating(false);
  }, [activeChatId]);

  const regenerateLastResponse = useCallback(async () => {
    if (!activeChat || generatingRef.current) return;
    const msgs = activeChat.messages;
    if (msgs.length < 2 || msgs[msgs.length - 1].role !== 'assistant') return;

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return { ...c, messages: c.messages.slice(0, -1) };
      }
      return c;
    }));

    generatingRef.current = true;
    setIsGenerating(true);
    try {
      // Build exactly the messages array that we expect to send
      const currentMessages = activeChat.messages.slice(0, -1);

      const responseContent = await fetchGeminiResponse(currentMessages);

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
      };

      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, assistantMsg] };
        }
        return c;
      }));
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Is the backend server running?",
        timestamp: Date.now(),
      };
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, errorMsg] };
        }
        return c;
      }));
    }

    generatingRef.current = false;
    setIsGenerating(false);
  }, [activeChat, activeChatId]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!activeChat || generatingRef.current) return;

    const msgIndex = activeChat.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1 || activeChat.messages[msgIndex].role !== 'user') return;

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        const newMessages = c.messages.slice(0, msgIndex);
        newMessages.push({ ...c.messages[msgIndex], content: newContent, timestamp: Date.now() });
        return { ...c, messages: newMessages };
      }
      return c;
    }));

    generatingRef.current = true;
    setIsGenerating(true);
    try {
      // Build exactly the messages array that we expect to send
      const currentMessages = activeChat.messages.slice(0, msgIndex);
      currentMessages.push({ ...activeChat.messages[msgIndex], content: newContent, timestamp: Date.now() });

      const responseContent = await fetchGeminiResponse(currentMessages);

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
      };

      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, assistantMsg] };
        }
        return c;
      }));
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Is the backend server running?",
        timestamp: Date.now(),
      };
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, errorMsg] };
        }
        return c;
      }));
    }

    generatingRef.current = false;
    setIsGenerating(false);
  }, [activeChat, activeChatId]);

  const stopGenerating = useCallback(() => {
    generatingRef.current = false;
    setIsGenerating(false);
  }, []);

  const exportChats = useCallback(() => {
    const blob = new Blob([JSON.stringify(chats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mira-chats-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chats]);

  const importChats = useCallback((json: string) => {
    try {
      const imported = JSON.parse(json) as Chat[];
      if (Array.isArray(imported)) {
        setChats(prev => [...imported, ...prev]);
      }
    } catch { /* ignore */ }
  }, []);

  return {
    chats,
    activeChat,
    activeChatId,
    isGenerating,
    setActiveChatId,
    createChat,
    deleteChat,
    renameChat,
    clearAllChats,
    sendMessage,
    regenerateLastResponse,
    editMessage,
    stopGenerating,
    exportChats,
    importChats,
  };
}
