import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Shield, Lock, User, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(data.username, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.03),transparent_70%)]" />
      <div className="absolute inset-0 hexagon-pattern opacity-20" />

      {/* Scan lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

      <div className="relative w-full max-w-md mx-4">
        {/* Card */}
        <div className="border border-cyan-500/30 rounded-lg bg-cyber-dark/90 backdrop-blur-md p-8">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-500/50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-500/50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-500/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-500/50" />

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-lg bg-cyan-500/10 border border-cyan-500/50 flex items-center justify-center">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            </div>
            <h1 className="font-orbitron text-3xl font-bold text-cyan-400 tracking-wider">
              PRE<span className="text-white">CRIME</span>
            </h1>
            <p className="text-xs text-cyan-400/60 tracking-[0.3em] uppercase mt-1">
              Threat Intelligence System
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-6" />

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs text-cyan-400/60 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3 h-3" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Enter username"
                {...register('username')}
                className="h-10 bg-cyber-dark border-cyan-500/30 text-cyan-400 placeholder:text-cyan-400/30 focus:border-cyan-400 focus:ring-cyan-400/20"
              />
              {errors.username && (
                <p className="text-[10px] text-red-400">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-cyan-400/60 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                {...register('password')}
                className="h-10 bg-cyber-dark border-cyan-500/30 text-cyan-400 placeholder:text-cyan-400/30 focus:border-cyan-400 focus:ring-cyan-400/20"
              />
              {errors.password && (
                <p className="text-[10px] text-red-400">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded border border-red-500/30 bg-red-500/5">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 hover:text-cyan-300 font-orbitron tracking-wider disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[10px] text-cyan-400/30 tracking-wider uppercase">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
