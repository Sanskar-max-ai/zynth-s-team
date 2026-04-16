import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, ArrowRight, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002';

const Auth = ({ onAuthSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // OAuth2 login expects form data
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        onAuthSuccess(response.data.access_token);
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/auth/register`, { email, password });
        if (response.data.access_token) {
          onAuthSuccess(response.data.access_token);
        } else {
          setIsLogin(true);
          setError('Account created! Please log in.');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel max-w-md w-full p-8 rounded-3xl border border-primary/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -z-10" />
        
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 p-2 rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 mb-8 pt-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter">
              {isLogin ? 'WELCOME BACK' : 'JOIN THE RED TEAM'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin ? 'Access your private security command center' : 'Start fuzzing your AI agents today'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-primary/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-primary/50 outline-none transition-all"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium border ${
                  error.includes('created') 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-primary text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 gap-2 glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-primary font-bold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
