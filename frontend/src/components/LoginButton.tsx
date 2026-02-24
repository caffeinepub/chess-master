import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <button
      onClick={handleAuth}
      disabled={isLoggingIn}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
        isAuthenticated
          ? 'border-chess-gold/40 text-chess-gold/80 hover:bg-chess-gold/10 hover:text-chess-gold'
          : 'border-chess-gold bg-chess-gold/10 text-chess-gold hover:bg-chess-gold/20'
      } disabled:opacity-50`}
    >
      {isLoggingIn ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isAuthenticated ? (
        <LogOut size={14} />
      ) : (
        <LogIn size={14} />
      )}
      {isLoggingIn ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
    </button>
  );
}
