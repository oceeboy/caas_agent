'use client';
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

export default function DashboardPage() {
  const { currentUser } = useAuthenticationStore();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Hello, {currentUser?.name}!</p>
      <p>Welcome to your dashboard!</p>
    </div>
  );
}
