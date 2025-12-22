'use client';
import {
  fetchUserDetails,
  login,
  refreshToken,
} from '@/services';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { useAuthStore } from '@/store/auth.store';
import type { LoginResponse } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-provider';

const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
  password: z
    .string()
    .min(
      6,
      'Password must be at least 6 characters',
    ),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  //   const setSession = useAuthStore(
  //     (s) => s.setSession,
  //   );

  async function onSubmit(data: LoginData) {
    try {
      const res = await login(data);
      if (res.success) {
        toast.success('Login successful!');
      } else if (!res.success) {
        toast.error('Login failed');
      }
    } catch (e: any) {
      const message =
        e?.message ?? 'Login failed';
      toast.error(message);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-black mb-4">
        Sign in
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-black"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md border border-black/20 bg-white text-black p-2 outline-none focus:border-black"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-black/70">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-black"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-md border border-black/20 bg-white text-black p-2 outline-none focus:border-black"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-black/70">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-black text-white py-2 font-medium hover:opacity-90 disabled:opacity-60"
        >
          Login
        </button>
      </form>
    </>
  );
}
