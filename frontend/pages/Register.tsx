import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { GithubLoginButton } from '../components/GithubLoginButton';

interface RegisterProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export const Register: React.FC<RegisterProps> = ({ onAuthSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      // Auto-login after registration
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        onAuthSuccess(loginData.token, loginData.user);
        navigate('/dashboard');
      } else {
        setSuccess(true); // Fallback to manual login message
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSuccess = (token: string, user: any) => {
    onAuthSuccess(token, user);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface-dark p-8 rounded-[2.5rem] border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create an account</h1>
          <p className="text-slate-400">Join ArogyaMitra and start your journey</p>
        </div>

        {!success ? (
          <>
            <div className="flex flex-col gap-3 mb-8">
              <GoogleLoginButton onSuccess={handleOAuthSuccess} onError={setError} />
              <GithubLoginButton onSuccess={handleOAuthSuccess} onError={setError} />
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface-dark px-4 text-slate-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background-dark border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-primary/50 transition-colors text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background-dark border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-primary/50 transition-colors text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background-dark border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-sm outline-none focus:border-primary/50 transition-colors text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 text-center bg-red-400/10 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-background-dark font-bold py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center p-6 bg-green-500/10 border border-green-500/20 rounded-2xl mb-4">
            <User className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Registration Complete!</h3>
            <p className="text-sm text-green-400/90">Your account has been successfully created.</p>
            <Link to="/login" className="inline-block mt-6 text-primary font-semibold hover:underline">
              Go to login
            </Link>
          </div>
        )}

        {!success && (
          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        )}

        {/* Developer Credit */}
        <div className="mt-12 flex flex-col items-center justify-center gap-1 opacity-30">
          <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-slate-500">Developed & Crafted by</p>
          <p className="text-[10px] font-bold text-primary tracking-widest">PRINCE KORI</p>
        </div>
      </motion.div>
    </div>
  );
};
