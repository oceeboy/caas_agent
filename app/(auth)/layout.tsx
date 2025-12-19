export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <main className="w-full max-w-md">
        <div className="border border-black/10 rounded-lg p-6">
          {children}
        </div>
      </main>
    </div>
  );
}