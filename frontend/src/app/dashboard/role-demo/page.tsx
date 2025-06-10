'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useRoles, useHasRole, useHasAnyRole } from '@/hooks/useRoles';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Shield, Users, Briefcase, UserCheck, BookOpen, Star } from 'lucide-react';
import { AppRoles } from '@/auth/auth-config';

export default function RoleDemoPage() {
  const currentRoles = useRoles();
  const isAdmin = useHasRole('Administrator');
  const isSupervisor = useHasRole('Supervisor');
  const isManager = useHasAnyRole(['Program Manager', 'Organisation Executive']);

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
          <RoleGuard allowedRoles={['Administrator']} showError>
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
          </RoleGuard>

          {/* Organisation Executive Features */}
          <RoleGuard allowedRoles={['Organisation Executive']}>
            <Card className="border-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Briefcase className="h-5 w-5" />
                  Organisation Executive Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>✅ Strategic Dashboards</div>
                <div>✅ Organisation-wide Reports</div>
                <div>✅ Budget Management</div>
                <div>✅ Program Oversight</div>
              </CardContent>
            </Card>
          </RoleGuard>

          {/* Program Manager Features */}
          <RoleGuard allowedRoles={['Program Manager']}>
            <Card className="border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Users className="h-5 w-5" />
                  Program Manager Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>✅ Program Configuration</div>
                <div>✅ Service Delivery Reports</div>
                <div>✅ Team Performance</div>
                <div>✅ Resource Allocation</div>
              </CardContent>
            </Card>
          </RoleGuard>

          {/* Supervisor Features */}
          <RoleGuard allowedRoles={['Supervisor']}>
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
          </RoleGuard>

          {/* Caseworker Features */}
          <RoleGuard allowedRoles={['Caseworker']}>
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Users className="h-5 w-5" />
                  Caseworker Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>✅ Client Management</div>
                <div>✅ Case Notes</div>
                <div>✅ Service Planning</div>
                <div>✅ Referral Creation</div>
              </CardContent>
            </Card>
          </RoleGuard>

          {/* Practice Lead Features */}
          <RoleGuard allowedRoles={['Practice Lead']}>
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <BookOpen className="h-5 w-5" />
                  Practice Lead Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>✅ Practice Guidelines</div>
                <div>✅ Training Materials</div>
                <div>✅ Quality Standards</div>
                <div>✅ Compliance Monitoring</div>
              </CardContent>
            </Card>
          </RoleGuard>
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
                <RoleGuard 
                  allowedRoles={['Administrator', 'Organisation Executive', 'Program Manager']}
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
                </RoleGuard>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <RoleGuard 
                  allowedRoles={['Caseworker', 'Supervisor', 'Practice Lead']}
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
                </RoleGuard>
              </CardContent>
            </Card>
          </div>

          {/* Hide from specific roles */}
          <RoleGuard deniedRoles={['Caseworker']} showError>
            <Card>
              <CardHeader>
                <CardTitle>Restricted Section</CardTitle>
                <CardDescription>Hidden from Caseworkers</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This content is only visible to supervisory and management roles.</p>
              </CardContent>
            </Card>
          </RoleGuard>
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
                      {Object.values(AppRoles).map(role => (
                        <th key={role} className="text-center p-2 text-xs">
                          {role.split(' ').map(word => word[0]).join('')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">User Management</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">❌</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">View All Clients</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">✅</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Edit Clients</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">✅</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Financial Reports</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">❌</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">System Config</td>
                      <td className="text-center p-2">✅</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">❌</td>
                      <td className="text-center p-2">❌</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <p>Legend: A = Administrator, OE = Organisation Executive, PM = Program Manager,</p>
                <p>S = Supervisor, C = Caseworker, PL = Practice Lead</p>
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