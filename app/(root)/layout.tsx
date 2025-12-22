'use client';
import { useAuthenticationStore } from '@/store/authentication.store';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthenticationStore((state) => state.currentUser);
  const isValid = useAuthenticationStore((state) => state.isSessionValid());
  const hydrated = useAuthenticationStore((state) => state.hydrated);

  // Don't redirect until store is hydrated
  useEffect(() => {
    if (hydrated && (!isValid || !user)) {
      redirect('/login'); // client-side redirect
    }
  }, [hydrated, isValid, user, redirect]);
  // Render nothing until hydrated to avoid flicker
  if (!hydrated) return null;

  if (!isValid || !user) return null; // or a loading skeleton

  return (
    <div className="min-h-screen bg-gray-50 flex p-6">
      <main className="w-full max-w-4xl bg-white border border-gray-200 rounded-lg shadow-md p-8">
        {children}
      </main>
    </div>
  );
}
