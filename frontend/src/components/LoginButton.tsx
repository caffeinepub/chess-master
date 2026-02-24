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
      } catch (error: any) {
        if (error?.message === 'User is already authenticated') {
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
      className={`
        flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors
        min-w-[44px] min-h-[44px] shrink-0
        ${isAuthenticated
          ? 'bg-chess-hover text-chess-panel-fg hover:bg-chess-border'
          : 'bg-chess-accent text-chess-accent-fg hover:opacity-90'
        }
        disabled:opacity-50
      `}
    >
      {isLoggingIn ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isAuthenticated ? (
        <LogOut size={16} />
      ) : (
        <LogIn size={16} />
      )}
      <span className="hidden sm:inline">
        {isLoggingIn ? 'Logging in…' : isAuthenticated ? 'Logout' : 'Login'}
      </span>
    </button>
  );
}
