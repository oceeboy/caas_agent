import { AuthProvider } from '@/context/auth-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex p-6">
      <main className="w-full max-w-4xl bg-white border border-gray-200 rounded-lg shadow-md p-8">
        {children}
      </main>
    </div>
  );
}
