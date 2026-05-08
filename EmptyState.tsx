import { MessageCircle, MapPin, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import miraIcon from '@/assets/mira_icon.jpg';

interface EmptyStateProps {
  onPromptClick: (prompt: string) => void;
}

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Conversational Safety',
    subtitle: 'Talk safely with MIRA',
    button: 'Start',
    prompt: 'I need help with a safety concern',
    variant: 'primary' as const,
  },
  {
    icon: MapPin,
    title: 'Safe Locations',
    subtitle: 'Find nearby help',
    button: 'Locate',
    prompt: 'Help me find nearby safe locations like police stations, hospitals, and pharmacies',
    variant: 'secondary' as const,
  },
  {
    icon: Shield,
    title: 'Law & Support',
    subtitle: 'Know your rights',
    button: 'Guide',
    prompt: 'I want to understand my rights and reporting options',
    variant: 'secondary' as const,
  },
  {
    icon: AlertTriangle,
    title: 'Emergency',
    subtitle: 'Quick SOS help',
    button: 'Help',
    prompt: 'I need urgent help',
    variant: 'danger' as const,
  },
];

const variantStyles = {
  primary: {
    card: 'border-primary/15 hover:border-primary/35',
    icon: 'text-primary',
    btn: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  secondary: {
    card: 'border-border hover:border-primary/25',
    icon: 'text-muted-foreground',
    btn: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  },
  danger: {
    card: 'border-destructive/15 hover:border-destructive/35',
    icon: 'text-destructive',
    btn: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
};

export function EmptyState({ onPromptClick }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="text-center max-w-lg w-full"
      >
        <img src={miraIcon} alt="MIRA" className="w-12 h-12 rounded-xl mx-auto mb-4" />
        <h1 className="text-xl font-semibold tracking-tight mb-1">Hi, I'm MIRA.</h1>
        <p className="text-muted-foreground text-sm mb-6">Your personal safety companion. How can I help?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
          {FEATURES.map((f, i) => {
            const styles = variantStyles[f.variant];
            return (
              <motion.button
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                onClick={() => onPromptClick(f.prompt)}
                className={cn(
                  'flex items-center gap-3 p-3.5 text-left border rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm group cursor-pointer bg-background',
                  styles.card,
                )}
              >
                <f.icon size={18} className={cn('shrink-0', styles.icon, f.variant === 'danger' && 'animate-pulse')} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm leading-tight">{f.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{f.subtitle}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    styles.btn,
                  )}
                >
                  {f.button}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
