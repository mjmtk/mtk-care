'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/services/api-request';
import { ROLE_NAMES } from '@/types/auth';

// Enhanced role interface with backend data
export interface DynamicRole {
  id: string;
  name: string;
  description?: string;
  level: number;
  is_system_role: boolean;
  is_active: boolean;
  custom_permissions: Record<string, any>;
  permissions: string[];
}

interface DynamicRoleContextType {
  roles: DynamicRole[];
  loading: boolean;
  error: string | null;
  getRoleByName: (name: string) => DynamicRole | undefined;
  getAvailableRoleNames: () => string[];
  refreshRoles: () => Promise<void>;
}

const DynamicRoleContext = createContext<DynamicRoleContextType | undefined>(undefined);

interface DynamicRoleProviderProps {
  children: ReactNode;
}

export function DynamicRoleProvider({ children }: DynamicRoleProviderProps) {
  const [roles, setRoles] = useState<DynamicRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const rolesData = await apiRequest<DynamicRole[]>({
        url: 'v1/roles/',
        method: 'GET',
      });
      
      // Filter to only active roles for frontend use
      const activeRoles = rolesData.filter(role => role.is_active);
      setRoles(activeRoles);
      
      console.log(`[DynamicRoleProvider] Loaded ${activeRoles.length} active roles from API`);
      
    } catch (err) {
      console.error('[DynamicRoleProvider] Failed to fetch roles from API:', err);
      setError('Failed to load roles');
      
      // Fallback to hardcoded roles if API fails
      const fallbackRoles: DynamicRole[] = Object.values(ROLE_NAMES).map((name, index) => ({
        id: `fallback-${index}`,
        name,
        description: `Fallback role: ${name}`,
        level: index,
        is_system_role: true,
        is_active: true,
        custom_permissions: {},
        permissions: [],
      }));
      
      setRoles(fallbackRoles);
      console.warn('[DynamicRoleProvider] Using fallback hardcoded roles');
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const getRoleByName = (name: string): DynamicRole | undefined => {
    return roles.find(role => role.name === name);
  };

  const getAvailableRoleNames = (): string[] => {
    return roles.map(role => role.name);
  };

  const refreshRoles = async (): Promise<void> => {
    await fetchRoles();
  };

  const contextValue: DynamicRoleContextType = {
    roles,
    loading,
    error,
    getRoleByName,
    getAvailableRoleNames,
    refreshRoles,
  };

  return (
    <DynamicRoleContext.Provider value={contextValue}>
      {children}
    </DynamicRoleContext.Provider>
  );
}

export function useDynamicRoles(): DynamicRoleContextType {
  const context = useContext(DynamicRoleContext);
  if (context === undefined) {
    throw new Error('useDynamicRoles must be used within a DynamicRoleProvider');
  }
  return context;
}

// Utility hooks that work with the dynamic roles
export function useDynamicRole(roleName: string): DynamicRole | undefined {
  const { getRoleByName } = useDynamicRoles();
  return getRoleByName(roleName);
}

export function useAvailableRoles(): string[] {
  const { getAvailableRoleNames } = useDynamicRoles();
  return getAvailableRoleNames();
}