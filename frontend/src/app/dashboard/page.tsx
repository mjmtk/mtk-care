// app/dashboard/page.tsx
// This is now a Server Component

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
// SignOutButton is used in layout or other components
// Note: apiClient as-is cannot be used in Server Components due to getSession from 'next-auth/react'
// We will fetch directly or adapt apiClient later if needed for server-side use.

// Define an interface for the expected profile data
interface UserProfileData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  // Add other fields if you expect them from your urls.py:
  permissions?: string[];
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined?: string; // Assuming date strings
  last_login?: string;  // Assuming date strings
}

async function getProfileData(accessToken: string): Promise<UserProfileData | null> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000/api";
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error fetching profile (server-side):', response.status, errorData);
      // In a real app, you might throw an error to be caught by an error boundary
      return null;
    }
    if (response.status === 204) return null;
    return response.json();
  } catch (error: unknown) {
    console.error('Error in getProfileData (server-side):', error instanceof Error ? error.message : 'An unknown error occurred');
    return null;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Please sign in to access the dashboard</p>
      </div>
    );
  }

  const profileData = await getProfileData(session.accessToken as string);
  
  // Get user's first name, last name, and role from profile data or session
  const firstName = profileData?.first_name || session.user?.name?.split(' ')[0] || '';
  const lastName = profileData?.last_name || session.user?.name?.split(' ').slice(1).join(' ') || '';
  const userRole = profileData?.roles?.[0] || 'User';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {firstName} {lastName}
          </h1>
          <div className="mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {userRole}
            </span>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Placeholder for role-based quick actions */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Your Profile</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                View and update your profile information
              </p>
            </div>
            
            {userRole.toLowerCase().includes('admin') && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Admin Panel</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Access administrative functions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Debug section - can be removed in production */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <details className="text-sm text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer">Session Details</summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-60">
            {JSON.stringify(session, null, 2)}
          </pre>
        </details>
        {profileData && (
          <details className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <summary className="cursor-pointer">Profile Data</summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-60">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
