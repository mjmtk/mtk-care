// app/dashboard/page.tsx
'use client';

import { useSession, signOut } from 'next-auth/react'; // Added signOut
import { useState } from 'react'; // Added useState
import apiClient from '@/lib/apiClient'; // Import the apiClient

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    setProfileData(null);
    setApiError(null);
    if (session) {
      try {
        const data = await apiClient<UserProfileData>('/profile');
        setProfileData(data);
      } catch (error: any) {
        console.error('API call to /profile failed:', error);
        setApiError(`API Error fetching profile: ${error.message || 'Failed to fetch'}`);
      }
    }
  };

  if (status === 'loading') {
    return <p>Loading session...</p>;
  }

  if (!session) {
    return <p>Access Denied. Please sign in.</p>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user?.name || session.user?.email}!</p>
      <p>This is a protected page.</p>
      <pre style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '5px' }}>
        {JSON.stringify(session, null, 2)}
      </pre>
      <button onClick={() => signOut()}>Sign out</button> {/* Added Sign out button */}

      <hr style={{ margin: '20px 0' }} />
      <h2>Test Backend API Call to /api/profile</h2>
      <button 
        onClick={fetchUserProfile} 
        disabled={!session || status === 'loading'}
        style={{ padding: '10px 15px', marginRight: '10px' }}
      >
        Fetch User Profile
      </button>
      {profileData && (
        <div style={{ marginTop: '15px' }}>
          <h3 style={{ color: 'green' }}>Profile Data:</h3>
          <pre style={{ background: '#e6ffe6', padding: '1rem', borderRadius: '5px' }}>
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>
      )}
      {apiError && <p style={{ color: 'red', marginTop: '15px' }}>{apiError}</p>}
    </div>
  );
}
