'use client';

import { AgentHooks, ConversationHooks } from '@/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ConversationTypes } from '@/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { agentRegisterSchema, type AgentRegisterData } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';

export default function ConversationsPage() {
  const { conversations, errorMessage, isLoading } = ConversationHooks.useConversations();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  function handleSelectConversation(conversationId: string) {
    setSelectedConversation(conversationId);
    // Here you would typically navigate to the conversation detail page or open a modal

    console.log('Selected conversation:', conversationId);
    setIsModalOpen(true);
  }
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
          <Badge variant="outline">{conversations?.length ?? 0} total</Badge>
        </header>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="space-y-4 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
        )}

        {!isLoading && errorMessage && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-6 text-sm text-destructive">{errorMessage}</CardContent>
          </Card>
        )}

        {!isLoading && conversations?.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No conversations yet.
            </CardContent>
          </Card>
        )}

        {!isLoading && conversations && conversations.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {conversations.map((conversation) => (
              <Card key={conversation.conversationId} className="transition hover:shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Conversation</CardTitle>
                  <StatusBadge status={conversation.status} />
                </CardHeader>

                <CardContent className="space-y-3 text-sm">
                  <div className="text-muted-foreground">
                    Visitor
                    <div className="truncate font-mono text-xs text-foreground">
                      {conversation.visitorId}
                    </div>
                  </div>

                  <div className="text-muted-foreground">
                    Created
                    <div className="text-foreground">
                      {new Date(conversation.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleSelectConversation(conversation.conversationId)}
                  >
                    View conversation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <ConversationDetailModal
        conversationId={selectedConversation ?? ''}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

function StatusBadge({ status }: { status: ConversationTypes.ConversationStatus }) {
  if (status === 'open') return <Badge className="bg-green-500/10 text-green-600">Open</Badge>;

  if (status === 'pending')
    return <Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;

  return <Badge className="bg-muted text-muted-foreground">{status}</Badge>;
}

function ConversationDetailModal({
  conversationId,
  isOpen,
  onClose,
}: {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isAgentModal, setIsAgentModal] = useState<boolean>(false);
  function handleJoin() {
    console.log('Joining conversation:', conversationId);
    setIsAgentModal(true);
    onClose();
  }

  function handleClose() {
    console.log('Closing conversation:', conversationId);
    onClose();
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conversation details</DialogTitle>
            <DialogDescription>
              Review this conversation before joining as an agent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs">
              {conversationId}
            </div>

            <p className="text-muted-foreground">
              By joining, you’ll be able to send and receive messages from the visitor in real time.
            </p>
          </div>

          <DialogFooter className=" gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button className="ml-2.5" onClick={handleJoin}>
              Join conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AgentJoinConversationModal
        conversationId={conversationId}
        isOpen={isAgentModal}
        onClose={() => setIsAgentModal(false)}
      />
    </>
  );
}

function AgentJoinConversationModal({
  conversationId,
  isOpen,
  onClose,
}: {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    agents,
    errorMessage: agentErrorMessage,
    isLoading: isAgentLoading,
  } = AgentHooks.useAgents();

  const { joinConversation, isJoining } = ConversationHooks.useJoinConversation();
  const [registerAgent, setRegisterAgent] = useState<boolean>(false);
  const [joiningAgentId, setJoiningAgentId] = useState<string | null>(null);

  const handleJoin = (agentId: string) => {
    setJoiningAgentId(agentId);

    const payload: { agentId: string; conversationId: string } = {
      agentId,
      conversationId,
    };

    joinConversation(payload, {
      onSuccess: (data) => {
        toast.success(data.message ?? 'Agent Joined Successfuly');
        setJoiningAgentId(null);
        onClose();
      },
      onError: (error: any) => {
        const message = error?.message ?? 'Failed to join conversation.';
        toast.error(message);
        setJoiningAgentId(null);
      },
    });
  };

  function handleRegister() {
    setRegisterAgent(true);
    // onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md ">
        <DialogHeader>
          <DialogTitle>Join as Agent</DialogTitle>
          <DialogDescription>Select an agent to join the conversation.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {isAgentLoading && <p>Loading agents...</p>}
          {agentErrorMessage && <p className="text-red-500">{agentErrorMessage}</p>}
          <ul>
            {agents?.map((agent) => (
              <li key={agent.agentId}>
                <Button
                  variant="outline"
                  disabled={isJoining && joiningAgentId === agent.agentId}
                  onClick={() => handleJoin(agent.agentId)}
                >
                  <span className="flex items-center gap-2">
                    <span>
                      {agent.agentName} ({agent.agentEmail})
                    </span>
                    {joiningAgentId === agent.agentId && isJoining && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className=" gap-2 sm:gap-0">
          <Button variant="destructive" onClick={onClose}>
            Cancel
          </Button>
          <Button className="ml-2.5" onClick={handleRegister}>
            Add Agent
          </Button>
        </DialogFooter>
        {registerAgent && (
          <RegisterAgentModal isOpen={registerAgent} onClose={() => setRegisterAgent(false)} />
        )}
      </DialogContent>
    </Dialog>
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
      <DialogContent className="sm:max-w-md ">
        <DialogHeader>
          <DialogTitle>Register new Agent</DialogTitle>
          <DialogDescription>
            Add a new agent to your organization. This agent will be able to join conversations.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 space-y-4 animate-in fade-in-50 slide-in-from-bottom-3 duration-300"
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Agent name</label>
            <input
              {...register('agentName')}
              placeholder="e.g. Jude Lewis"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.agentName && (
              <p className="text-xs text-destructive">{errors.agentName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Agent email</label>
            <input
              {...register('agentEmail')}
              type="email"
              placeholder="jude@company.com"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.agentEmail && (
              <p className="text-xs text-destructive">{errors.agentEmail.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering…' : 'Register agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
