'use client';
import { UserHooks } from '@/hooks';
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

  const { user } = UserHooks.useUserInfo();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Hello, {currentUser?.name}!</p>
      <p>Welcome to your dashboard!</p>

      {user && (
        <div className="mt-4 p-4 border border-gray-300 rounded">
          <h2 className="text-xl font-semibold mb-2">User Details</h2>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          {/* Add more user details as needed */}
        </div>
      )}
    </div>
  );
}
