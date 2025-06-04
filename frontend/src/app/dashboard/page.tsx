// app/dashboard/page.tsx
// This is now a Server Component

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { usersApi } from '@/services/apiService';
import type { components } from '@/types/api';
import { ErrorBoundary } from '@/components/error-boundary';
import { LoadingSpinner, LoadingSkeleton } from '@/components/loading';

// Use the generated UserOut type for profile data
type UserProfileData = components['schemas']['UserOut'];

async function getProfileData(accessToken: string): Promise<UserProfileData> {
  try {
    const data = await usersApi.getCurrentUserProfile(accessToken);
    if (!data) {
      throw new Error('No profile data returned');
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch profile data:', error);
    throw error; // Re-throw to be caught by the error boundary
  }
}

// Profile section component
function ProfileSection({ profileData }: { profileData: UserProfileData }) {
  const fullName = [profileData.first_name, profileData.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'User';

  const userRole = profileData.roles?.reduce((highestRole, currentRole) => {
    return (currentRole.level > (highestRole?.level ?? -1)) ? currentRole : highestRole;
  }, undefined as components['schemas']['RoleOut'] | undefined);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-300">
            {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {fullName}
            </h1>
            <div className="mt-1 space-y-1">
              {userRole && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {userRole.name}
                </span>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ID: {profileData.id}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Email</dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white truncate">{profileData.email}</dd>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Status</dt>
          <dd className="mt-1">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${profileData.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              {profileData.is_active ? 'Active' : 'Inactive'}
            </span>
          </dd>
        </div>
        {profileData.profile?.employee_id && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Employee ID</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{profileData.profile.employee_id}</dd>
          </div>
        )}
        {profileData.profile?.title && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Title</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{profileData.profile.title}</dd>
          </div>
        )}
      </div>
    </div>
  );
}

// Quick actions component
function QuickActions({ userRole }: { userRole: components['schemas']['RoleOut'] | undefined }) {
  const isAdmin = userRole?.name.toLowerCase().includes('admin');
  
  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <h3 className="font-medium text-gray-900 dark:text-white">Your Profile</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and update your profile information
          </p>
        </div>
        
        {isAdmin && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <h3 className="font-medium text-gray-900 dark:text-white">Admin Panel</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Access administrative functions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorBoundary>
          <p className="text-red-500">Please sign in to access the dashboard</p>
        </ErrorBoundary>
      </div>
    );
  }

  try {
    const profileData = await getProfileData(session.accessToken);
    const userRole = profileData.roles?.reduce((highestRole, currentRole) => {
      return (currentRole.level > (highestRole?.level ?? -1)) ? currentRole : highestRole;
    }, undefined as components['schemas']['RoleOut'] | undefined);

    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          <ProfileSection profileData={profileData} />
          <QuickActions userRole={userRole} />
          
          {/* Debug section - can be removed in production */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <details className="text-sm text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer">Session Details</summary>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-60">
                {JSON.stringify(session, null, 2)}
              </pre>
            </details>
            <details className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer">Profile Data</summary>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-60">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            </details>
          </div>
        </ErrorBoundary>
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
            <h2 className="text-lg font-medium text-red-800 dark:text-red-200">Error Loading Dashboard</h2>
            <p className="mt-2 text-red-700 dark:text-red-300">
              We couldn't load your dashboard. Please try refreshing the page or contact support if the problem persists.
            </p>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </ErrorBoundary>
      </div>
    );
  }
}
