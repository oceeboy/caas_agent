'use client';
import { UserHooks } from '@/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

export default function DashboardPage() {
  const { user } = UserHooks.useUserInfo();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Hello, {user?.name}!</p>
      <p>Welcome to your dashboard!</p>
      <AgentContentDashboard />
    </div>
  );
}

const agentLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

function AgentContentDashboard() {
  const { register, handleSubmit } = useForm<z.infer<typeof agentLoginSchema>>({
    resolver: zodResolver(agentLoginSchema),
  });

  const [agentSuccess, setAgentSuccess] = useState(false);
  function onSubmit(data: z.infer<typeof agentLoginSchema>) {
    console.log('Agent form submitted:', data);
    setAgentSuccess(true);
  }
  return (
    <>
      {!agentSuccess && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              {...register('name')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Submit
          </button>
        </form>
      )}
      {agentSuccess && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-md">
          <p className="text-green-800">Agent information submitted successfully!</p>
        </div>
      )}
    </>
  );
}
