'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AgentHooks } from '@/hooks';
import { agentRegisterSchema, type AgentRegisterData } from '@/schemas';
import { AgentAuthService } from '@/services';
import { useAgentAuthenticationStore } from '@/store/agent-authentication.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
      <section className="min-h-screen bg-white text-black flex items-center justify-center p-4">
        <main className="w-full max-w-lg">
          <div className="space-y-12">
            {/* Header */}
            <div className="space-y-3">
              <h1 className="text-4xl font-light tracking-tight">Agent Access</h1>
              <p className="text-base font-light text-neutral-600">
                Select an agent profile to continue
              </p>
            </div>

            <AgentSession />
          </div>
        </main>
      </section>
    );
  }
  return <>{children}</>;
}

function AgentSession({}: {}) {
  const {
    agents,
    errorMessage: agentErrorMessage,
    isLoading: isAgentLoading,
  } = AgentHooks.useAgents();

  const { setAgentAuthenticatedSession } = useAgentAuthenticationStore();
  const { startSession, isLoading } = AgentHooks.useStartAgentSession();
  const [registerAgent, setRegisterAgent] = useState<boolean>(false);
  const [joiningAgentId, setJoiningAgentId] = useState<string | null>(null);

  const handleJoin = (agentId: string) => {
    setJoiningAgentId(agentId);

    const payload: { agentId: string } = {
      agentId,
    };

    startSession(payload, {
      onSuccess: (data) => {
        setAgentAuthenticatedSession({ user: data.agent, token: data.token });
        toast.success(`${data.message}`);
      },
    });
  };

  function handleRegister() {
    setRegisterAgent(true);
  }

  return (
    <div className="space-y-8">
      {/* Agent List */}
      <div className="space-y-4">
        {isAgentLoading && <p className="text-sm font-light text-neutral-500">Loading agents...</p>}

        {agentErrorMessage && <p className="text-sm font-light text-black">{agentErrorMessage}</p>}

        {!isAgentLoading && !agentErrorMessage && (
          <ul className="space-y-2">
            {agents?.map((agent) => (
              <li key={agent.agentId}>
                <button
                  className="w-full group relative overflow-hidden border-b border-neutral-200 hover:border-black transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading && joiningAgentId === agent.agentId}
                  onClick={() => handleJoin(agent.agentId)}
                >
                  <div className="flex items-center justify-between py-5">
                    <div className="flex flex-col items-start space-y-1">
                      <span className="text-base font-light tracking-wide">{agent.agentName}</span>
                      <span className="text-sm font-light text-neutral-500">
                        {agent.agentEmail}
                      </span>
                    </div>

                    {joiningAgentId === agent.agentId && isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                    ) : (
                      <span className="text-xs font-light text-neutral-400 group-hover:text-black transition-colors duration-200">
                        →
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Register Button */}
      <div className="pt-4">
        <button
          onClick={handleRegister}
          className="w-full py-4 text-sm font-light tracking-widest uppercase border border-black hover:bg-black hover:text-white transition-all duration-200"
        >
          Register new agent
        </button>
      </div>

      {registerAgent && (
        <RegisterAgentModal isOpen={registerAgent} onClose={() => setRegisterAgent(false)} />
      )}
    </div>
  );
}

function RegisterAgentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AgentRegisterData>({
    resolver: zodResolver(agentRegisterSchema),
  });

  const { registerAgent } = AgentHooks.useRegisterAgent();

  function onSubmit(data: AgentRegisterData) {
    registerAgent(data, {
      onSuccess: () => {
        toast.success('Agent registered successfully!');
        reset();
        onClose();
      },
      onError: (error: any) => {
        const message = error?.message ?? 'Failed to register agent.';
        toast.error(message);
      },
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-black p-0">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-light tracking-tight">Register Agent</DialogTitle>
            <DialogDescription className="text-sm font-light text-neutral-600">
              Add a new agent to your organization
            </DialogDescription>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Agent Name Field */}
            <div className="space-y-2">
              <label className="block text-xs font-light tracking-wider uppercase text-neutral-500">
                Agent name
              </label>
              <input
                {...register('agentName')}
                placeholder="Jude Lewis"
                className="w-full border-b border-neutral-300 bg-transparent px-0 py-3 text-base font-light placeholder:text-neutral-400 focus:border-black focus:outline-none transition-colors"
              />
              {errors.agentName && (
                <p className="text-xs font-light text-black mt-1">{errors.agentName.message}</p>
              )}
            </div>

            {/* Agent Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-light tracking-wider uppercase text-neutral-500">
                Agent email
              </label>
              <input
                {...register('agentEmail')}
                type="email"
                placeholder="jude@company.com"
                className="w-full border-b border-neutral-300 bg-transparent px-0 py-3 text-base font-light placeholder:text-neutral-400 focus:border-black focus:outline-none transition-colors"
              />
              {errors.agentEmail && (
                <p className="text-xs font-light text-black mt-1">{errors.agentEmail.message}</p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 text-sm font-light tracking-widest uppercase border border-neutral-300 hover:border-black transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 text-sm font-light tracking-widest uppercase bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
