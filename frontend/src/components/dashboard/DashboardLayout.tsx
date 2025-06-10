'use client';

import { useDashboardWidgets, DashboardWidget } from '@/hooks/useDashboardWidgets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, TrendingUp, Activity, AlertTriangle, Target, DollarSign, UserCheck } from 'lucide-react';

/**
 * Widget component registry - maps widget component names to actual components
 */
const WIDGET_COMPONENTS = {
  ClientSummaryWidget: ClientSummaryWidget,
  ReferralStatsWidget: ReferralStatsWidget,
  ProgramMetricsWidget: ProgramMetricsWidget,
  FinancialSummaryWidget: FinancialSummaryWidget,
  RecentActivityWidget: RecentActivityWidget,
  AlertsWidget: AlertsWidget,
  AnalyticsWidget: AnalyticsWidget,
  TeamPerformanceWidget: TeamPerformanceWidget,
};

/**
 * Widget icon mapping
 */
const WIDGET_ICONS = {
  'client-summary': Users,
  'referral-stats': Target,
  'program-metrics': TrendingUp,
  'financial-summary': DollarSign,
  'recent-activity': Activity,
  'alerts': AlertTriangle,
  'analytics': BarChart3,
  'team-performance': UserCheck,
};

/**
 * Main dashboard layout component that renders widgets based on user permissions
 */
export function DashboardLayout() {
  const { getAvailableWidgets, getRecommendedLayout } = useDashboardWidgets();
  const layout = getRecommendedLayout();

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your MTK Care system activity and metrics
        </p>
      </div>

      {/* Alerts Section - Full Width */}
      {layout.primary.some(w => w.id === 'alerts') && (
        <div className="w-full">
          <WidgetRenderer widget={layout.primary.find(w => w.id === 'alerts')!} />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Column - Large Widgets */}
        <div className="lg:col-span-2 space-y-6">
          {layout.primary
            .filter(w => w.id !== 'alerts')
            .map(widget => (
              <WidgetRenderer key={widget.id} widget={widget} />
            ))}
        </div>

        {/* Secondary Column - Medium/Small Widgets */}
        <div className="space-y-6">
          {layout.secondary.map(widget => (
            <WidgetRenderer key={widget.id} widget={widget} />
          ))}
          {layout.sidebar.map(widget => (
            <WidgetRenderer key={widget.id} widget={widget} />
          ))}
        </div>
      </div>

      {/* Widget Summary for Development */}
      <div className="mt-8">
        <WidgetSummary />
      </div>
    </div>
  );
}

/**
 * Renders individual widget with proper component
 */
function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
  const Component = WIDGET_COMPONENTS[widget.component as keyof typeof WIDGET_COMPONENTS];
  const Icon = WIDGET_ICONS[widget.id as keyof typeof WIDGET_ICONS] || Activity;

  if (!Component) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {widget.title}
          </CardTitle>
          <CardDescription>{widget.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            Widget component '{widget.component}' not implemented yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return <Component widget={widget} />;
}

/**
 * Development component showing available widgets
 */
function WidgetSummary() {
  const { getAvailableWidgets, getWidgetsByCategory } = useDashboardWidgets();
  const available = getAvailableWidgets();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Widgets</CardTitle>
        <CardDescription>
          Widgets visible to your current role ({available.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['metrics', 'activity', 'analytics', 'management'].map(category => (
            <div key={category}>
              <h4 className="font-medium mb-2 capitalize">{category}</h4>
              <div className="space-y-1">
                {getWidgetsByCategory(category as any).map(widget => (
                  <Badge key={widget.id} variant="secondary" className="text-xs">
                    {widget.title}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example widget components (to be implemented)
 */
function ClientSummaryWidget({ widget }: { widget: DashboardWidget }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">1,234</div>
            <div className="text-sm text-muted-foreground">Total Clients</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">56</div>
            <div className="text-sm text-muted-foreground">New This Month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">98%</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralStatsWidget({ widget }: { widget: DashboardWidget }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Pending</span>
            <Badge variant="outline">23</Badge>
          </div>
          <div className="flex justify-between">
            <span>In Progress</span>
            <Badge variant="secondary">45</Badge>
          </div>
          <div className="flex justify-between">
            <span>Completed</span>
            <Badge variant="default">156</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramMetricsWidget({ widget }: { widget: DashboardWidget }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl font-bold">87%</div>
          <div className="text-sm text-muted-foreground">Program Completion Rate</div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialSummaryWidget({ widget }: { widget: DashboardWidget }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Budget Used</span>
            <span className="font-medium">68%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full w-[68%]"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityWidget({ widget }: { widget: DashboardWidget }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm">
            <div className="font-medium">New client registered</div>
            <div className="text-muted-foreground">2 hours ago</div>
          </div>
          <div className="text-sm">
            <div className="font-medium">Referral completed</div>
            <div className="text-muted-foreground">4 hours ago</div>
          </div>
          <div className="text-sm">
            <div className="font-medium">Case note added</div>
            <div className="text-muted-foreground">6 hours ago</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsWidget({ widget }: { widget: DashboardWidget }) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Urgent</Badge>
            <span className="text-sm">5 overdue assessments require attention</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Info</Badge>
            <span className="text-sm">System maintenance scheduled for Sunday</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsWidget({ widget }: { widget: DashboardWidget }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-lg font-semibold">Trending Up</div>
          <div className="text-sm text-muted-foreground">
            Client satisfaction increased 12% this quarter
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamPerformanceWidget({ widget }: { widget: DashboardWidget }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Avg. Caseload</span>
            <span className="font-medium">12 clients</span>
          </div>
          <div className="flex justify-between">
            <span>Response Time</span>
            <span className="font-medium">2.3 hours</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}