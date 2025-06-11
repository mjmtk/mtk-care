'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusProps {
  status: SaveStatus;
  lastSaved?: Date;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function SaveStatus({ status, lastSaved, className, size = 'default' }: SaveStatusProps) {
  const [displayTime, setDisplayTime] = useState<string>('');

  useEffect(() => {
    if (!lastSaved) return;

    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - lastSaved.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 60) {
        setDisplayTime('just now');
      } else if (minutes < 60) {
        setDisplayTime(`${minutes}m ago`);
      } else if (hours < 24) {
        setDisplayTime(`${hours}h ago`);
      } else {
        setDisplayTime(lastSaved.toLocaleDateString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastSaved]);

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          variant: 'secondary' as const,
          iconClassName: 'animate-spin'
        };
      case 'saved':
        return {
          icon: Check,
          text: lastSaved ? `Saved ${displayTime}` : 'Draft saved',
          variant: 'outline' as const,
          iconClassName: 'text-green-600'
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          variant: 'destructive' as const,
          iconClassName: ''
        };
      default:
        return {
          icon: Clock,
          text: 'Unsaved changes',
          variant: 'secondary' as const,
          iconClassName: 'text-orange-500'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 h-6',
    default: 'text-sm px-2 py-1 h-7',
    lg: 'text-base px-3 py-1.5 h-8'
  };

  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        'flex items-center gap-1 font-normal',
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn('h-3 w-3 flex-shrink-0', config.iconClassName)} />
      <span className="whitespace-nowrap">{config.text}</span>
    </Badge>
  );
}