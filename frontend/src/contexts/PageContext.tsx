'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { SaveStatus } from '@/components/ui/save-status';

interface StepInfo {
  id: number;
  title: string;
  status: 'pending' | 'current' | 'completed';
  warning?: boolean; // Add warning flag for amber/warning states
}

interface PageContextType {
  pageTitle: string;
  pageSubtitle?: string;
  saveStatus?: SaveStatus;
  lastSaved?: Date;
  steps?: StepInfo[];
  currentStep?: number;
  setPageInfo: (info: {
    title: string;
    subtitle?: string;
    saveStatus?: SaveStatus;
    lastSaved?: Date;
    steps?: StepInfo[];
    currentStep?: number;
  }) => void;
  clearPageInfo: () => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState('');
  const [pageSubtitle, setPageSubtitle] = useState<string | undefined>();
  const [saveStatus, setSaveStatus] = useState<SaveStatus | undefined>();
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [steps, setSteps] = useState<StepInfo[] | undefined>();
  const [currentStep, setCurrentStep] = useState<number | undefined>();

  const setPageInfo = ({
    title,
    subtitle,
    saveStatus: newSaveStatus,
    lastSaved: newLastSaved,
    steps: newSteps,
    currentStep: newCurrentStep
  }: {
    title: string;
    subtitle?: string;
    saveStatus?: SaveStatus;
    lastSaved?: Date;
    steps?: StepInfo[];
    currentStep?: number;
  }) => {
    setPageTitle(title);
    setPageSubtitle(subtitle);
    setSaveStatus(newSaveStatus);
    setLastSaved(newLastSaved);
    setSteps(newSteps);
    setCurrentStep(newCurrentStep);
  };

  const clearPageInfo = () => {
    setPageTitle('');
    setPageSubtitle(undefined);
    setSaveStatus(undefined);
    setLastSaved(undefined);
    setSteps(undefined);
    setCurrentStep(undefined);
  };

  return (
    <PageContext.Provider
      value={{
        pageTitle,
        pageSubtitle,
        saveStatus,
        lastSaved,
        steps,
        currentStep,
        setPageInfo,
        clearPageInfo
      }}
    >
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error('usePageContext must be used within a PageProvider');
  }
  return context;
}