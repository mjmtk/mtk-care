# Dashboard System

The MTK Care dashboard system provides **role-based, customizable dashboards** with permission-controlled widgets that automatically adapt to user roles and organizational needs.

## 🎯 Key Features

- **Role-Based Widgets**: Automatically show/hide widgets based on user permissions
- **Smart Layout Engine**: Responsive grid system with priority-based placement
- **Permission Integration**: CASL-powered widget visibility control
- **Extensible Architecture**: Easy to add new widgets and layouts

## 📁 Documentation

- **[Widget System](./widget-system.md)** - Permission-based widget architecture
- **[Role-Based UI](./role-based-ui.md)** - UI patterns for different roles *(coming soon)*

## 🚀 Quick Start

```typescript
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DashboardPage() {
  return <DashboardLayout />;
}
```

The `DashboardLayout` component automatically:
1. Fetches user's current roles and permissions
2. Filters available widgets based on permissions  
3. Arranges widgets in optimal layout
4. Renders only components user can access

## 🎛️ Customization

```typescript
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';

function CustomDashboard() {
  const { getWidgetsByCategory } = useDashboardWidgets();
  
  // Show only metrics widgets
  const metricsWidgets = getWidgetsByCategory('metrics');
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {metricsWidgets.map(widget => (
        <WidgetRenderer key={widget.id} widget={widget} />
      ))}
    </div>
  );
}
```

## 📊 Widget Categories

- **Metrics**: Client counts, operational KPIs
- **Activity**: Recent actions, notifications, alerts  
- **Analytics**: Trends, performance insights, reports
- **Management**: Financial data, team performance, strategic metrics

## 🔐 Security

- Widgets are **permission-controlled** at component level
- Frontend permissions are **advisory** (UX enhancement)
- Backend APIs **re-validate** all data access
- Sensitive widgets hidden by default unless explicitly permitted

## 📚 Related Documentation

- **[Permission System](../permissions/README.md)** - Overall permission architecture
- **[Dynamic Roles](../authentication/dynamic-roles.md)** - Role management system
- **[CASL Integration](../permissions/casl-integration.md)** - Permission engine details