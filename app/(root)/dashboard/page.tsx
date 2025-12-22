'use client';
import { fetchUserDetails } from '@/services';
// ==================================
// dashboard
// ==================================
/**
 *
 * Dashboard Page
 * ---------------------------------
 * this page agent gets to see the conversations and
 * onclick goes to chat page has to reauthenticate to as an agent
 */

import { useAuthenticationStore } from '@/store/authentication.store';
import type { UserTypes } from '@/types';
import { useState } from 'react';

export default function DashboardPage() {
  const { currentUser } = useAuthenticationStore();
  const [userDetails, setUserDetails] = useState<UserTypes.User | null>(null);

  async function fetchUserDetail() {
    // Placeholder for fetching user details logic
    const fetchedDetails = await fetchUserDetails();
    setUserDetails(fetchedDetails);
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Hello, {currentUser?.name}!</p>
      <p>Welcome to your dashboard!</p>
      <button onClick={fetchUserDetail} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        Load User Details
      </button>
      {userDetails && (
        <div className="mt-4 p-4 border border-gray-300 rounded">
          <h2 className="text-xl font-semibold mb-2">User Details</h2>
          <p>
            <strong>Email:</strong> {userDetails.email}
          </p>
          <p>
            <strong>Role:</strong> {userDetails.role}
          </p>
          {/* Add more user details as needed */}
        </div>
      )}
    </div>
  );
}
