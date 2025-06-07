"use client"

import { useEffect, useState } from 'react'
import { Plus, UserPlus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersDataTable } from './data-table'
import { columns } from './columns'
import { User, userListSchema } from '@/types/users'
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass'
import { usersApi } from '@/services/apiService'

// Function to fetch users from the API
async function fetchUsers(accessToken: string | null): Promise<User[]> {
  try {
    if (!accessToken) {
      throw new Error('No access token available')
    }

    // Use the proper API service instead of direct fetch
    const data = await usersApi.listUsers(accessToken)
    
    // Validate the data against our schema
    const validatedUsers = userListSchema.parse(data)
    return validatedUsers
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

// Helper function to check if user has admin access
function hasAdminAccess(userRoles: string[] | undefined): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some(role => ['admin', 'superuser', 'Superuser', 'Manager'].includes(role));
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session, status, isAuthBypass } = useAuthBypassSession()
  const accessToken = useAccessToken()

  // Debug: Log auth state
  console.log('Users page auth state:', {
    status,
    isAuthBypass,
    hasSession: !!session,
    hasAccessToken: !!accessToken,
    accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
    userRoles: session?.user?.roles
  });

  // Check if user has admin access
  const userRoles = session?.user?.roles as string[] | undefined
  const hasAccess = hasAdminAccess(userRoles)

  useEffect(() => {
    // Only load users if user has access and we have required auth data
    if (!hasAccess && status !== 'loading') return
    if (status === 'loading') return // Wait for auth to complete
    if (!accessToken) {
      console.log('Waiting for access token...');
      return // Wait for access token
    }

    const loadUsers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const fetchedUsers = await fetchUsers(accessToken)
        setUsers(fetchedUsers)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching users')
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [hasAccess, status, accessToken])

  // Show access denied if user doesn't have permission
  if (status !== 'loading' && !hasAccess) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have permission to access user management. This page is restricted to administrators only.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>Manage your users and their roles here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading users...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>Manage your users and their roles here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <span className="font-medium">Error:</span> {error}
            </div>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User List</h2>
          <p className="text-muted-foreground">
            Manage your users and their roles here.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <UsersDataTable data={users} columns={columns} />
      </div>
    </div>
  )
}