'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionGuard, AdminGuard } from '@/components/auth/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { useRoles, useHasRole, useHasAnyRole } from '@/hooks/usePermissions'; // Legacy compatibility
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Shield, Users, Briefcase, UserCheck, BookOpen, Star } from 'lucide-react';
import { useDynamicRoles } from '@/contexts/DynamicRoleProvider';

export default function RoleDemoPage() {
  const currentRoles = useRoles();
  const permissions = usePermissions();
  const isAdmin = useHasRole('Administrator');
  const isSupervisor = useHasRole('Supervisor');
  const isManager = useHasAnyRole(['Manager']);
  const { getAvailableRoleNames } = useDynamicRoles();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Role-Based Access Demo</h1>
        <p className="text-muted-foreground mt-2">
          Test different UI components and features based on user roles
        </p>
      </div>

      {/* Current Roles Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Current Roles
          </CardTitle>
          <CardDescription>
            Use the role switcher in the header to test different role views
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {currentRoles.length > 0 ? (
              currentRoles.map(role => (
                <Badge key={role} variant="default" className="text-sm">
                  {role}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">No roles assigned</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role-Specific Features */}
      <Tabs defaultValue="features" className="space-y-4">
        <TabsList>
          <TabsTrigger value="features">Features by Role</TabsTrigger>
          <TabsTrigger value="components">UI Components</TabsTrigger>
          <TabsTrigger value="permissions">Permissions Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4">
          {/* Administrator Features */}
          <AdminGuard showError>
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Shield className="h-5 w-5" />
                  Administrator Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>✅ System Configuration</div>
                <div>✅ User Management</div>
                <div>✅ Audit Logs</div>
                <div>✅ Role Assignment</div>
                <div>✅ Full Data Access</div>
              </CardContent>
            </Card>
          </AdminGuard>

          {/* Manager Features */}
          <PermissionGuard check={p => p.canAccessDashboard('admin')}>
            <Card className="border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Briefcase className="h-5 w-5" />
                  Manager Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>✅ Strategic Dashboards</div>
                <div>✅ Organisation-wide Reports</div>
                <div>✅ Budget Management</div>
                <div>✅ Program Oversight</div>
                <div>✅ Resource Allocation</div>
              </CardContent>
            </Card>
          </PermissionGuard>

          {/* Supervisor Features */}
          <PermissionGuard check={p => p.canAccessDashboard('program')}>
            <Card className="border-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <UserCheck className="h-5 w-5" />
                  Supervisor Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>✅ Team Management</div>
                <div>✅ Case Assignment</div>
                <div>✅ Quality Assurance</div>
                <div>✅ Staff Schedules</div>
              </CardContent>
            </Card>
          </PermissionGuard>

          {/* Practitioner Features */}
          <PermissionGuard action="create" subject="Client">
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Users className="h-5 w-5" />
                  Practitioner Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>✅ Client Management</div>
                <div>✅ Case Notes</div>
                <div>✅ Service Planning</div>
                <div>✅ Referral Creation</div>
              </CardContent>
            </Card>
          </PermissionGuard>

          {/* Staff Features */}
          <PermissionGuard action="access" subject="Dashboard">
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <BookOpen className="h-5 w-5" />
                  Staff Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>✅ Daily Operations</div>
                <div>✅ Data Entry</div>
                <div>✅ Basic Reporting</div>
                <div>✅ Documentation</div>
              </CardContent>
            </Card>
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Component Visibility</AlertTitle>
            <AlertDescription>
              These components show/hide based on your current roles
            </AlertDescription>
          </Alert>

          {/* Conditional UI Examples */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Management Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <PermissionGuard 
                  check={p => p.canViewReports('financial') || p.canAccessDashboard('admin')}
                  fallback={<p className="text-muted-foreground">Not available for your role</p>}
                >
                  <div className="space-y-2">
                    <button className="w-full text-left p-2 hover:bg-accent rounded">
                      📊 Analytics Dashboard
                    </button>
                    <button className="w-full text-left p-2 hover:bg-accent rounded">
                      👥 Team Performance
                    </button>
                    <button className="w-full text-left p-2 hover:bg-accent rounded">
                      📈 Financial Reports
                    </button>
                  </div>
                </PermissionGuard>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <PermissionGuard 
                  action="read" 
                  subject="Client"
                  fallback={<p className="text-muted-foreground">Not available for your role</p>}
                >
                  <div className="space-y-2">
                    <button className="w-full text-left p-2 hover:bg-accent rounded">
                      👤 Client Records
                    </button>
                    <button className="w-full text-left p-2 hover:bg-accent rounded">
                      📝 Case Notes
                    </button>
                    <button className="w-full text-left p-2 hover:bg-accent rounded">
                      🔄 Referrals
                    </button>
                  </div>
                </PermissionGuard>
              </CardContent>
            </Card>
          </div>

          {/* Hide from specific roles */}
          <PermissionGuard 
            check={p => p.canCreate('Client') || p.canUpdate('Client')}
            showError
            errorMessage="This section requires active operational permissions"
          >
            <Card>
              <CardHeader>
                <CardTitle>Restricted Section</CardTitle>
                <CardDescription>Hidden from Read-Only and Restricted Users</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This content is only visible to active operational roles.</p>
              </CardContent>
            </Card>
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Matrix</CardTitle>
              <CardDescription>
                Feature access by role in the MTK Care system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Feature</th>
                      {getAvailableRoleNames().map(role => (
                        <th key={role} className="text-center p-2 text-xs">
                          {role.length > 10 ? role.substring(0, 8) + '...' : role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        feature: 'User Management',
                        permissions: { 'Superuser': true, 'Administrator': true } as Record<string, boolean>
                      },
                      {
                        feature: 'View All Clients',
                        permissions: { 'Superuser': true, 'Administrator': true, 'Manager': true, 'Supervisor': true, 'ReadOnlyUser': true } as Record<string, boolean>
                      },
                      {
                        feature: 'Edit Clients',
                        permissions: { 'Superuser': true, 'Administrator': true, 'Supervisor': true, 'Practitioner': true, 'Staff': true } as Record<string, boolean>
                      },
                      {
                        feature: 'Financial Reports',
                        permissions: { 'Superuser': true, 'Administrator': true, 'Manager': true } as Record<string, boolean>
                      },
                      {
                        feature: 'System Config',
                        permissions: { 'Superuser': true, 'Administrator': true } as Record<string, boolean>
                      }
                    ].map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{row.feature}</td>
                        {getAvailableRoleNames().map(role => (
                          <td key={role} className="text-center p-2">
                            {row.permissions[role] ? '✅' : '❌'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <p>Dynamic permissions matrix based on database-driven roles.</p>
                <p>Roles are fetched from the API and permissions are defined programmatically.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Developer Notes */}
      {isAdmin && (
        <Alert>
          <Star className="h-4 w-4" />
          <AlertTitle>Developer Note</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>As an Administrator/Superuser, you can test all role views using the role switcher in the header.</p>
            <p className="font-mono text-xs">
              Usage: useRoles(), useHasRole(), RoleGuard component
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}