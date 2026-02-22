'use client';

import { Button } from '@/components/ui/button';
import { UserHooks } from '@/hooks';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, isLoading, errorMessage, isError } = UserHooks.useUserInfo();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{errorMessage || 'Failed to load user data'}</p>
          <Button variant="outline" onClick={() => router.refresh()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {user.name}!</h1>
          <p className="text-slate-600 mb-6">You're all set. Explore your dashboard below.</p>

          <div className="space-y-4">
            <Button onClick={() => router.push('/agent')} className="w-full sm:w-auto" size="lg">
              Go to Agent Section
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
