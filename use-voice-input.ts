import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export type VoiceState = 'idle' | 'listening' | 'error';

interface VoiceInputOptions {
  lang?: string;
  continuous?: boolean;
  timeout?: number;
  onTranscript?: (text: string) => void;
  autoSend?: boolean;
  onAutoSend?: (text: string) => void;
}

interface VoiceInputReturn {
  state: VoiceState;
  transcript: string;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  cancel: () => void;
}

const SpeechRecognition =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function useVoiceInput(options: VoiceInputOptions = {}): VoiceInputReturn {
  const {
    lang = 'en-US',
    continuous = false,
    timeout = 30000,
    onTranscript,
    autoSend = false,
    onAutoSend,
  } = options;

  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSupported = !!SpeechRecognition;

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    recognitionRef.current?.stop();
    setState('idle');
  }, [cleanup]);

  const cancel = useCallback(() => {
    cleanup();
    recognitionRef.current?.abort();
    setTranscript('');
    setState('idle');
  }, [cleanup]);

  const start = useCallback(() => {
    if (!isSupported) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = continuous;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setState('listening');
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      const text = finalText || interimText;
      setTranscript(text);
      onTranscript?.(text);
    };

    recognition.onerror = (event: any) => {
      cleanup();
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied');
      } else if (event.error === 'no-speech') {
        toast.error("Couldn't understand, try again");
      } else if (event.error !== 'aborted') {
        toast.error("Couldn't understand, try again");
      }
      setState('idle');
    };

    recognition.onend = () => {
      cleanup();
      setState(prev => {
        if (prev === 'listening') {
          // Natural end — deliver final transcript
          if (autoSend && transcript) {
            onAutoSend?.(transcript);
          }
          return 'idle';
        }
        return prev === 'error' ? 'idle' : prev;
      });
    };

    recognition.start();

    // Timeout fallback
    timeoutRef.current = setTimeout(() => {
      stop();
    }, timeout);
  }, [isSupported, lang, continuous, timeout, onTranscript, autoSend, onAutoSend, transcript, stop, cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
      recognitionRef.current?.abort();
    };
  }, [cleanup]);

  return { state, transcript, isSupported, start, stop, cancel };
}
