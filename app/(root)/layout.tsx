'use client';
import { AgentRootLayout } from '@/components/layout';
import { useAuthenticationStore } from '@/store/authentication.store';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthenticationStore((state) => state.currentUser);
  const isValid = useAuthenticationStore((state) => state.isSessionValid());
  const hydrated = useAuthenticationStore((state) => state.hydrated);
  const router: AppRouterInstance = useRouter();
  // Don't redirect until store is hydrated
  useEffect(() => {
    if (hydrated && (!isValid || !user)) {
      router.replace('/login'); // client-side redirect
    }
  }, [hydrated, isValid, user, router]);
  // Render nothing until hydrated to avoid flicker
  if (!hydrated) return null;

  if (!isValid || !user) return null; // or a loading skeleton

  return (
    <AgentRootLayout>
      <div className="min-h-screen bg-gray-50 flex p-6">
        <main className="w-full max-w-4xl bg-white border border-gray-200 rounded-lg shadow-md p-8">
          {children}
        </main>
      </div>
    </AgentRootLayout>
  );
}
