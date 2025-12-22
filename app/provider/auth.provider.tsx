'use client';
import { useAuthenticationStore } from '@/store/authentication.store';

export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthenticationStore((state) => state.hydrated);

  if (!hydrated) return null; // or loading spinner
  return <>{children}</>;
}
