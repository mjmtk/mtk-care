'use client';

import { Button } from '@/components/ui/button';
import { SaveStatus, type SaveStatus as SaveStatusType } from '@/components/ui/save-status';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  saveStatus?: SaveStatusType;
  lastSaved?: Date;
  className?: string;
  children?: React.ReactNode;
}

export function FormHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  saveStatus,
  lastSaved,
  className,
  children
}: FormHeaderProps) {
  return (
    <div className={cn('border-b bg-white px-6 py-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </Button>
          
          <div className="h-6 w-px bg-border" />
          
          <div>
            <h1 className="text-xl font-semibold leading-none">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {saveStatus && (
            <SaveStatus 
              status={saveStatus} 
              lastSaved={lastSaved}
              size="sm"
            />
          )}
          {children}
        </div>
      </div>
    </div>
  );
}