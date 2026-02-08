'use client';

import { AgentHooks, ConversationHooks } from '@/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
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

  const handleJoin = (agentId: string) => {
    toast.success(`Joining conversation: ${conversationId} as agent: ${agentId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
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
                <Button variant="outline" onClick={() => handleJoin(agent.agentId)}>
                  {agent.agentName} ({agent.agentEmail})
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className=" gap-2 sm:gap-0">
          <Button variant="destructive" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
