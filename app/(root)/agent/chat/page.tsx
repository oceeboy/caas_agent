'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function AgentSlugPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = params.slug;
  const content = useMemo(() => {
    return searchParams.get('id') ?? '';
  }, [searchParams]);

  if (!content) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-600 text-sm">No content found</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-900 hover:text-slate-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="space-y-2">
          <p className="text-xs tracking-widest text-slate-500 uppercase font-semibold">
            Agent: {slug}
          </p>
          <h1 className="text-4xl font-light text-slate-900 tracking-tight">{content}</h1>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-slate-600 text-sm leading-relaxed">
            Content loaded from query parameter.
          </p>
        </div>
      </div>
    </div>
  );
}
