'use client';
import { useAuthenticationStore } from '@/store/authentication.store';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthenticationStore((state) => state.currentUser);
  const isValid = useAuthenticationStore((state) => state.isSessionValid());
  const hydrated = useAuthenticationStore((state) => state.hydrated);

  // Render nothing until hydrated to avoid flicker
  // if (!hydrated) return null;
  // if valid and user exists, render children
  // true redirect to dashboard or main app area
  // Don't redirect until store is hydrated
  useEffect(() => {
    if (hydrated && (isValid || user)) {
      redirect('/dashboard'); // client-side redirect
    }
  }, [hydrated, isValid, user, redirect]);

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <main className="w-full max-w-md">
        <div className="border border-black/10 rounded-lg p-6">{children}</div>
      </main>
    </div>
  );
}
