import { usePermissions } from './usePermissions';

/**
 * Dashboard widget definitions with permission requirements
 */
export interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  component: string; // Component name to render
  size: 'small' | 'medium' | 'large' | 'full-width';
  permission: string; // CASL subject for permission check
  priority: number; // Higher number = higher priority in layout
  category: 'metrics' | 'activity' | 'analytics' | 'management';
}

/**
 * All available dashboard widgets
 */
const ALL_WIDGETS: DashboardWidget[] = [
  {
    id: 'client-summary',
    title: 'Client Overview',
    description: 'Total clients, new registrations, and client status breakdown',
    component: 'ClientSummaryWidget',
    size: 'medium',
    permission: 'ClientSummaryWidget',
    priority: 100,
    category: 'metrics'
  },
  {
    id: 'referral-stats',
    title: 'Referral Statistics',
    description: 'Referral metrics, conversion rates, and pending referrals',
    component: 'ReferralStatsWidget',
    size: 'medium',
    permission: 'ReferralStatsWidget',
    priority: 90,
    category: 'metrics'
  },
  {
    id: 'program-metrics',
    title: 'Program Performance',
    description: 'Program enrollment, completion rates, and outcomes',
    component: 'ProgramMetricsWidget',
    size: 'large',
    permission: 'ProgramMetricsWidget',
    priority: 80,
    category: 'analytics'
  },
  {
    id: 'financial-summary',
    title: 'Financial Overview',
    description: 'Budget utilization, costs, and financial trends',
    component: 'FinancialSummaryWidget',
    size: 'medium',
    permission: 'FinancialSummaryWidget',
    priority: 70,
    category: 'management'
  },
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    description: 'Latest case notes, referrals, and system activity',
    component: 'RecentActivityWidget',
    size: 'large',
    permission: 'RecentActivityWidget',
    priority: 60,
    category: 'activity'
  },
  {
    id: 'alerts',
    title: 'Alerts & Notifications',
    description: 'System alerts, overdue tasks, and important notifications',
    component: 'AlertsWidget',
    size: 'full-width',
    permission: 'AlertsWidget',
    priority: 95,
    category: 'activity'
  },
  {
    id: 'analytics',
    title: 'Quick Analytics',
    description: 'Key performance indicators and trend analysis',
    component: 'AnalyticsWidget',
    size: 'large',
    permission: 'AnalyticsWidget',
    priority: 75,
    category: 'analytics'
  },
  {
    id: 'team-performance',
    title: 'Team Performance',
    description: 'Staff caseloads, performance metrics, and team analytics',
    component: 'TeamPerformanceWidget',
    size: 'medium',
    permission: 'TeamPerformanceWidget',
    priority: 65,
    category: 'management'
  }
];

/**
 * Hook to get widgets available to current user based on their permissions
 */
export function useDashboardWidgets() {
  const permissions = usePermissions();

  /**
   * Get all widgets the current user can view
   */
  const getAvailableWidgets = (): DashboardWidget[] => {
    return ALL_WIDGETS.filter(widget => 
      permissions.can('view', widget.permission as any)
    ).sort((a, b) => b.priority - a.priority); // Sort by priority descending
  };

  /**
   * Get widgets by category
   */
  const getWidgetsByCategory = (category: DashboardWidget['category']): DashboardWidget[] => {
    return getAvailableWidgets().filter(widget => widget.category === category);
  };

  /**
   * Check if user can view a specific widget
   */
  const canViewWidget = (widgetId: string): boolean => {
    const widget = ALL_WIDGETS.find(w => w.id === widgetId);
    if (!widget) return false;
    return permissions.can('view', widget.permission as any);
  };

  /**
   * Get recommended layout based on available widgets
   */
  const getRecommendedLayout = (): {
    primary: DashboardWidget[];
    secondary: DashboardWidget[];
    sidebar: DashboardWidget[];
  } => {
    const available = getAvailableWidgets();
    
    return {
      primary: available.filter(w => w.size === 'large' || w.size === 'full-width').slice(0, 3),
      secondary: available.filter(w => w.size === 'medium').slice(0, 4),
      sidebar: available.filter(w => w.size === 'small').slice(0, 2)
    };
  };

  return {
    getAllWidgets: () => ALL_WIDGETS,
    getAvailableWidgets,
    getWidgetsByCategory,
    canViewWidget,
    getRecommendedLayout,
    
    // Convenience methods for different roles
    hasMetricsWidgets: () => getWidgetsByCategory('metrics').length > 0,
    hasAnalyticsWidgets: () => getWidgetsByCategory('analytics').length > 0,
    hasManagementWidgets: () => getWidgetsByCategory('management').length > 0,
  };
}