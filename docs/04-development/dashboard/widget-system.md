# Dashboard Widget System

The MTK Care dashboard uses a **permission-based widget system** that automatically shows/hides widgets based on user roles and permissions.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Widget Hook    │    │ CASL Abilities  │
│   Layout        │    │                  │    │                 │
│                 │    │ useDashboard     │    │ Widget          │
│ ┌─────────────┐ │    │ Widgets()        │    │ Permissions     │
│ │   Widget    │ │◄───┤                  │◄───┤                 │
│ │ Renderer    │ │    │ - filters by     │    │ can('view',     │
│ └─────────────┘ │    │   permissions    │    │ 'WidgetName')   │
│                 │    │ - sorts by       │    │                 │
│ ┌─────────────┐ │    │   priority       │    │                 │
│ │   Widget    │ │    │ - suggests       │    │                 │
│ │ Registry    │ │    │   layout         │    │                 │
│ └─────────────┘ │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🧩 Widget Definition

### **Widget Interface**
```typescript
interface DashboardWidget {
  id: string;                    // Unique identifier
  title: string;                 // Display name
  description: string;           // Widget purpose
  component: string;             // Component name to render
  size: 'small' | 'medium' | 'large' | 'full-width';
  permission: string;            // CASL subject for permission check
  priority: number;              // Layout priority (higher = more important)
  category: 'metrics' | 'activity' | 'analytics' | 'management';
}
```

### **Available Widgets**

| Widget | Permission | Size | Roles |
|--------|------------|------|-------|
| **ClientSummaryWidget** | `ClientSummaryWidget` | medium | Manager, Supervisor, Practitioner, Staff |
| **ReferralStatsWidget** | `ReferralStatsWidget` | medium | Manager, Supervisor, Practitioner |
| **ProgramMetricsWidget** | `ProgramMetricsWidget` | large | Manager, Supervisor |
| **FinancialSummaryWidget** | `FinancialSummaryWidget` | medium | Manager |
| **RecentActivityWidget** | `RecentActivityWidget` | large | Manager, Supervisor, Practitioner, Staff |
| **AlertsWidget** | `AlertsWidget` | full-width | Manager, Supervisor |
| **AnalyticsWidget** | `AnalyticsWidget` | large | Manager |
| **TeamPerformanceWidget** | `TeamPerformanceWidget` | medium | Manager, Supervisor |

## 🎛️ Usage

### **Basic Dashboard Implementation**
```typescript
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DashboardPage() {
  return <DashboardLayout />;
}
```

### **Custom Widget Filtering**
```typescript
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';

function CustomDashboard() {
  const { 
    getAvailableWidgets,
    getWidgetsByCategory,
    getRecommendedLayout 
  } = useDashboardWidgets();

  // Get all widgets user can see
  const allWidgets = getAvailableWidgets();
  
  // Get only metrics widgets
  const metricsWidgets = getWidgetsByCategory('metrics');
  
  // Get smart layout recommendation
  const layout = getRecommendedLayout();
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Primary column - large widgets */}
      <div className="col-span-2">
        {layout.primary.map(widget => (
          <WidgetRenderer key={widget.id} widget={widget} />
        ))}
      </div>
      
      {/* Secondary column - medium/small widgets */}
      <div>
        {layout.secondary.map(widget => (
          <WidgetRenderer key={widget.id} widget={widget} />
        ))}
      </div>
    </div>
  );
}
```

### **Role-Specific Widget Examples**

#### **Manager Dashboard**
```typescript
// Manager sees: ClientSummary, Financial, TeamPerformance, Analytics
const managerWidgets = [
  'ClientSummaryWidget',
  'FinancialSummaryWidget', 
  'TeamPerformanceWidget',
  'AnalyticsWidget'
];
```

#### **Practitioner Dashboard**
```typescript
// Practitioner sees: ClientSummary, ReferralStats, RecentActivity
const practitionerWidgets = [
  'ClientSummaryWidget',
  'ReferralStatsWidget',
  'RecentActivityWidget'
];
```

#### **Staff Dashboard**
```typescript
// Staff sees: ClientSummary, RecentActivity
const staffWidgets = [
  'ClientSummaryWidget',
  'RecentActivityWidget'
];
```

## 🎨 Widget Components

### **Widget Component Structure**
```typescript
interface WidgetComponentProps {
  widget: DashboardWidget;
}

function ExampleWidget({ widget }: WidgetComponentProps) {
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
        {/* Widget content */}
      </CardContent>
    </Card>
  );
}
```

### **Widget Registry**
```typescript
// components/dashboard/DashboardLayout.tsx
const WIDGET_COMPONENTS = {
  ClientSummaryWidget: ClientSummaryWidget,
  ReferralStatsWidget: ReferralStatsWidget,
  ProgramMetricsWidget: ProgramMetricsWidget,
  // ... other widgets
};

// Dynamic component rendering
function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
  const Component = WIDGET_COMPONENTS[widget.component];
  
  if (!Component) {
    return <div>Widget '{widget.component}' not implemented</div>;
  }
  
  return <Component widget={widget} />;
}
```

## 🔐 Permission Configuration

### **CASL Ability Definitions**
```typescript
// auth/ability.ts
// Manager permissions
if (hasRole('Manager')) {
  can('view', ['ClientSummaryWidget', 'ReferralStatsWidget', 
               'ProgramMetricsWidget', 'FinancialSummaryWidget', 
               'AnalyticsWidget', 'TeamPerformanceWidget']);
}

// Practitioner permissions  
if (hasRole('Practitioner')) {
  can('view', ['ClientSummaryWidget', 'ReferralStatsWidget', 
               'RecentActivityWidget']);
}

// Staff permissions
if (hasRole('Staff')) {
  can('view', ['ClientSummaryWidget', 'RecentActivityWidget']);
}
```

### **Adding New Widgets**

1. **Define the widget**:
```typescript
const newWidget: DashboardWidget = {
  id: 'compliance-widget',
  title: 'Compliance Status',
  description: 'Regulatory compliance and audit status',
  component: 'ComplianceWidget',
  size: 'medium',
  permission: 'ComplianceWidget',
  priority: 85,
  category: 'management'
};
```

2. **Add permission to CASL**:
```typescript
// Add to Subjects type
type Subjects = '...' | 'ComplianceWidget' | '...';

// Add to role permissions
if (hasRole('Manager')) {
  can('view', [..., 'ComplianceWidget']);
}
```

3. **Create widget component**:
```typescript
function ComplianceWidget({ widget }: WidgetComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-green-600">✅ All systems compliant</div>
      </CardContent>
    </Card>
  );
}
```

4. **Register component**:
```typescript
const WIDGET_COMPONENTS = {
  // ... existing widgets
  ComplianceWidget: ComplianceWidget,
};
```

## 📊 Layout Engine

### **Automatic Layout**
```typescript
const getRecommendedLayout = () => {
  const available = getAvailableWidgets();
  
  return {
    primary: available.filter(w => w.size === 'large' || w.size === 'full-width'),
    secondary: available.filter(w => w.size === 'medium'),
    sidebar: available.filter(w => w.size === 'small')
  };
};
```

### **Priority-Based Sorting**
```typescript
// Higher priority widgets appear first
const sortedWidgets = widgets.sort((a, b) => b.priority - a.priority);

// Priority examples:
// AlertsWidget: 95 (most important)
// ClientSummaryWidget: 100 (always first for metrics)
// FinancialSummaryWidget: 70 (lower priority)
```

### **Responsive Grid**
```typescript
// DashboardLayout.tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Primary column - large widgets */}
  <div className="lg:col-span-2 space-y-6">
    {layout.primary.map(widget => (
      <WidgetRenderer key={widget.id} widget={widget} />
    ))}
  </div>

  {/* Secondary column - medium/small widgets */}
  <div className="space-y-6">
    {layout.secondary.map(widget => (
      <WidgetRenderer key={widget.id} widget={widget} />
    ))}
  </div>
</div>
```

## 🎯 Widget Categories

### **Metrics** (`category: 'metrics'`)
- Client counts, status breakdowns
- Basic operational metrics
- High-level KPIs

### **Activity** (`category: 'activity'`)
- Recent actions, events
- Notifications and alerts
- Real-time updates

### **Analytics** (`category: 'analytics'`)
- Trend analysis
- Performance insights
- Advanced reporting data

### **Management** (`category: 'management'`)
- Financial data
- Resource utilization
- Strategic metrics

## 🔍 Development Tools

### **Widget Debugging**
```typescript
const { getAvailableWidgets, canViewWidget } = useDashboardWidgets();

// Debug widget permissions
console.log('Available widgets:', getAvailableWidgets().map(w => w.id));
console.log('Can view financial widget:', canViewWidget('financial-summary'));
```

### **Widget Development Mode**
```typescript
// Add to widget component for development
{process.env.NODE_ENV === 'development' && (
  <div className="text-xs text-gray-500 p-2 border-t">
    Widget: {widget.component} | Permission: {widget.permission}
  </div>
)}
```

## 🚨 Troubleshooting

### **Widget Not Showing**
1. Check user has permission: `permissions.can('view', 'WidgetName')`
2. Verify widget is in `ALL_WIDGETS` array
3. Ensure widget component is registered in `WIDGET_COMPONENTS`
4. Check widget `is_active` status

### **Wrong Widget Layout**
1. Verify widget `size` and `priority` values
2. Check responsive grid breakpoints
3. Ensure `getRecommendedLayout()` logic is correct

### **Permission Denied**
1. Check CASL ability definitions for role
2. Verify widget permission subject name matches
3. Ensure user has correct role assigned

## 📚 Related Documentation

- **[Permission System Overview](../permissions/README.md)**
- **[CASL Integration](../permissions/casl-integration.md)**
- **[Role-Based UI Patterns](./role-based-ui.md)**
- **[Dashboard Architecture](./README.md)**