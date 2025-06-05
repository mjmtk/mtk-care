'use client';

import { useState, useEffect } from 'react';
import { usersApi } from '@/services/apiService';
import type { components } from '@/types/api';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorDisplay } from '@/components/error-display';
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';


// Use the generated UserOut type for profile data
type UserProfileData = components['schemas']['UserOut'];

function useProfileData(accessToken: string | null) {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);
        const data = await usersApi.getCurrentUserProfile(accessToken!);
        if (!data) {
          throw new Error('No profile data returned');
        }
        setProfileData(data);
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [accessToken]);

  return { profileData, loading, error };
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

export default function DashboardPage() {
  const { data: session, status, isAuthBypass } = useAuthBypassSession();
  const accessToken = useAccessToken();
  const { profileData, loading, error } = useProfileData(accessToken);

  // Show loading while session or profile is loading
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!session || (!accessToken && !isAuthBypass)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorBoundary>
          <p className="text-red-500">Please sign in to access the dashboard</p>
        </ErrorBoundary>
      </div>
    );
  }

  // Handle profile loading error
  if (error) {
    console.error('Error loading dashboard:', error);
    let errorMessage = "We couldn't load your dashboard. Please try refreshing the page or contact support if the problem persists.";
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
      if (error.message.includes('Invalid URL') || (error instanceof TypeError && error.message.toLowerCase().includes('failed to parse url'))) {
        errorMessage = `API connection failed (Invalid URL: ${error.message}). Please ensure backend API URL is correctly configured for this environment.`;
      }
    }
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          <ErrorDisplay 
            title="Error Loading Dashboard"
            message={errorMessage}
          />
        </ErrorBoundary>
      </div>
    );
  }

  // Profile data not loaded yet
  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const userRole = profileData.roles?.reduce((highestRole, currentRole) => {
    return (currentRole.level > (highestRole?.level ?? -1)) ? currentRole : highestRole;
  }, undefined as components['schemas']['RoleOut'] | undefined);

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary>
        {/* Show bypass mode indicator */}
        {isAuthBypass && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  🚧 <strong>Auth Bypass Mode Active</strong> - You're logged in as a test user for development.
                </p>
              </div>
            </div>
          </div>
        )}
        
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
}
