'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationHooks } from '@/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { ConversationTypes } from '@/types';

export default function ConversationChat() {
  const { conversations, errorMessage, isLoading } = ConversationHooks.useConversations();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedId(conversationId);
    router.push(`/agent/chat?id=${conversationId}`);
  };

  const conversationCount = conversations?.length ?? 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 pb-8 border-b border-slate-200">
          <h1 className="text-3xl font-light tracking-tight text-slate-900">Conversations</h1>
          <p className="mt-2 text-sm text-slate-600">
            {isLoading
              ? '—'
              : `${conversationCount} conversation${conversationCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-slate-200 rounded-sm p-4 space-y-2">
                <Skeleton className="h-4 w-32 bg-slate-100" />
                <Skeleton className="h-3 w-48 bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="border border-slate-300 bg-slate-50 rounded-sm p-6 text-sm text-slate-700">
            {errorMessage}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && conversationCount === 0 && (
          <div className="border border-dashed border-slate-300 rounded-sm p-12 text-center">
            <p className="text-sm text-slate-500">No conversations yet</p>
          </div>
        )}

        {/* Conversations List */}
        {!isLoading && conversations && conversations.length > 0 && (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <div
                key={conversation.conversationId}
                className="border border-slate-200 rounded-sm p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{conversation.visitorId}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(conversation.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={conversation.status} />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectConversation(conversation.conversationId)}
                  className="w-full text-slate-900 border-slate-300 hover:bg-slate-100"
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ConversationTypes.ConversationStatus }) {
  const statusStyles: Record<ConversationTypes.ConversationStatus, string> = {
    open: 'bg-slate-100 text-slate-700',
    pending: 'bg-slate-200 text-slate-800',
    closed: 'bg-slate-100 text-slate-600',
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-sm whitespace-nowrap ${statusStyles[status] || statusStyles.closed}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
