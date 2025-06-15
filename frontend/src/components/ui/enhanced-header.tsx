'use client';

import React from 'react';
import { SaveStatus } from '@/components/ui/save-status';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SaveStatus as SaveStatusType } from '@/components/ui/save-status';

interface StepInfo {
  id: number;
  title: string;
  status: 'pending' | 'current' | 'completed';
  warning?: boolean; // Add warning flag for amber/warning states
  icon?: React.ComponentType<{ className?: string }>;
}

interface EnhancedHeaderProps {
  pageTitle?: string;
  pageSubtitle?: string;
  saveStatus?: SaveStatusType;
  lastSaved?: Date;
  steps?: StepInfo[];
  currentStep?: number;
  mobileNav: React.ReactNode;
  rightContent: React.ReactNode;
}

export function EnhancedHeader({
  pageTitle,
  pageSubtitle,
  saveStatus,
  lastSaved,
  steps,
  currentStep,
  mobileNav,
  rightContent
}: EnhancedHeaderProps) {
  const hasPageInfo = pageTitle || steps?.length;
  
  return (
    <header className="flex items-center justify-between h-16 px-4 border-b md:justify-between bg-background">
      {/* Left side - Page info and steps */}
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* Mobile hamburger */}
        <div className="md:hidden">
          {mobileNav}
        </div>
        
        {hasPageInfo && (
          <>
            {/* Page Title and Subtitle */}
            <div className="flex items-center space-x-2 min-w-0">
              <div className="min-w-0">
                <h1 className="text-sm font-semibold truncate">{pageTitle}</h1>
                {pageSubtitle && (
                  <p className="text-xs text-muted-foreground truncate">{pageSubtitle}</p>
                )}
              </div>
            </div>

            {/* Steps indicator */}
            {steps && steps.length > 0 && (
              <>
                <div className="h-6 w-px bg-border hidden md:block" />
                <div className="hidden md:flex items-center space-x-2 min-w-0">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    return (
                      <React.Fragment key={step.id}>
                        <div className="flex items-center space-x-1.5">
                          {StepIcon ? (
                            <StepIcon className={cn(
                              'w-4 h-4',
                              step.status === 'current' ? 'text-blue-600' :
                              step.status === 'completed' ? (step.warning ? 'text-amber-600' : 'text-green-600') :
                              'text-gray-400'
                            )} />
                          ) : (
                            <div className={cn(
                              'w-2 h-2 rounded-full',
                              step.status === 'completed' ? (step.warning ? 'bg-amber-500' : 'bg-green-500') :
                              step.status === 'current' ? 'bg-blue-500' :
                              'bg-gray-300'
                            )} />
                          )}
                          <span className={cn(
                            'text-sm font-medium truncate',
                            step.status === 'current' ? 'text-blue-600' :
                            step.status === 'completed' ? (step.warning ? 'text-amber-600' : 'text-green-600') :
                            'text-gray-500'
                          )}>
                            {step.title}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Mobile steps indicator (simplified) */}
                <div className="md:hidden flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs">
                    Step {currentStep} of {steps.length}
                  </Badge>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Right side - Save status, Role switcher and user nav */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Save Status - Right aligned with fixed width */}
        {saveStatus && (
          <div className="w-32 text-right">
            <SaveStatus 
              status={saveStatus} 
              lastSaved={lastSaved}
              size="sm"
            />
          </div>
        )}
        {rightContent}
      </div>
    </header>
  );
}