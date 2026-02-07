'use client';
import { Button } from '@/components/ui/button';

import { AgentAuthService } from '@/services';
import { useAgentAuthenticationStore } from '@/store/agent-authentication.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// ==================================
// agent layout
// ==================================

export default function AgentRootLayout({ children }: { children: React.ReactNode }) {
  const { isTokenValid, token } = useAgentAuthenticationStore();

  if (!isTokenValid()) {
    return (
      <section className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        <main className="w-full max-w-md">
          <div className="border border-black/10 rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2">Agent Access</h1>
            <p className="text-sm mb-4">Provide your agent details to continue.</p>
            <AgentLoginForm />
          </div>
        </main>
      </section>
    );
  }
  return <>{children}</>;
}

const agentLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type AgentLoginData = z.infer<typeof agentLoginSchema>;

function AgentLoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AgentLoginData>({
    resolver: zodResolver(agentLoginSchema),
  });

  const { loginAgentDetails } = AgentAuthService;
  const { setAgentAuthenticatedSession } = useAgentAuthenticationStore();
  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(data: AgentLoginData) {
    setServerError(null);
    try {
      const result = await loginAgentDetails(data);
      if (result) {
        setAgentAuthenticatedSession({ user: result.user, token: result.token });
        toast.success('Welcome, agent');
      } else {
        setServerError('Failed to submit agent information.');
        toast.error('Failed to submit agent information.');
      }
    } catch (e: any) {
      const msg = e?.message ?? 'An unexpected error occurred';
      setServerError(msg);
      toast.error(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          autoComplete="email"
          className="w-full rounded-md border border-black/20 bg-white p-2 outline-none focus:border-black"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-black/70">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          className="w-full rounded-md border border-black/20 bg-white p-2 outline-none focus:border-black"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-black/70">{errors.name.message}</p>}
      </div>
      {serverError && <p className="text-xs text-red-600">{serverError}</p>}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-black text-white hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? 'Submitting...' : 'Continue'}
      </Button>
    </form>
  );
}
