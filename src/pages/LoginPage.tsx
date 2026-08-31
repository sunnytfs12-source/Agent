import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { FloatingBalls } from '../components/ui/FloatingBalls';

export const LoginPage: React.FC = () => {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = () => { setEmail('admin@mscit.dev'); setPassword('Admin@1234'); setError(null); };

  return (
    /* ── Full-screen purple background ── */
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#3b0764] p-4 selection:bg-violet-400 selection:text-white">

      {/* Animated floating white balls */}
      <FloatingBalls />

      {/* Subtle radial glow in centre */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.25)_0%,transparent_70%)]" />

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xs"
      >
        <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">

          {/* Logo + heading */}
          <div className="mb-5 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-purple-400 shadow-lg shadow-violet-700/40">
              <i className="bi bi-check2-circle text-xl text-white" />
            </div>
            <h1 className="mt-3 text-lg font-bold tracking-tight text-white">Welcome back</h1>
            <p className="mt-0.5 text-xs text-white/50">
              Sign in to your <span className="font-semibold text-violet-300">MSCIT Todo</span> workspace
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
            >
              <i className="bi bi-exclamation-triangle-fill shrink-0 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/50">
                Email
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                  <i className="bi bi-envelope text-xs" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pr-3 pl-8 text-xs text-white placeholder-white/25 outline-none transition focus:border-violet-500 focus:bg-white/10 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/50">
                Password
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                  <i className="bi bi-lock text-xs" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pr-8 pl-8 text-xs text-white placeholder-white/25 outline-none transition focus:border-violet-500 focus:bg-white/10 focus:ring-1 focus:ring-violet-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40 hover:text-white/70"
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''} text-xs`} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 py-2 text-xs font-semibold text-white shadow-md shadow-violet-700/40 transition hover:from-violet-500 hover:to-purple-400 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <i className="bi bi-arrow-right" />
                </>
              )}
            </button>
          </form>

          {/* Demo shortcut */}
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 text-center text-[10px] text-white/40">Quick demo access</p>
            <button
              type="button"
              onClick={fillDemo}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 py-1.5 text-[11px] font-medium text-violet-300 transition hover:bg-violet-500/20"
            >
              <i className="bi bi-shield-lock text-violet-400" />
              <span>Fill Superadmin Credentials</span>
            </button>
          </div>

          {/* Link to register */}
          <p className="mt-4 text-center text-[11px] text-white/40">
            No account?{' '}
            <Link to="/register" className="font-semibold text-violet-300 hover:text-violet-200">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
