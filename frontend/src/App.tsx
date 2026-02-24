import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useGetCallerUserProfile';
import ChessGame from './pages/ChessGame';
import LoginButton from './components/LoginButton';
import PlayerIdentity from './components/PlayerIdentity';
import ProfileSetupModal from './components/ProfileSetupModal';
import MobileAppNotice from './components/MobileAppNotice';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="min-h-screen bg-chess-bg text-chess-fg flex flex-col">
      {/* Header */}
      <header className="bg-chess-panel border-b border-chess-border px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img
            src="/assets/generated/chess-logo-mark.dim_256x256.png"
            alt="Chess Khelo Online"
            className="w-8 h-8 rounded-lg shrink-0"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-base leading-tight text-chess-panel-fg truncate">
              Chess Khelo Online
            </h1>
            <p className="text-[10px] text-chess-muted hidden sm:block">Play Chess Online</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && <PlayerIdentity />}
          <LoginButton />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {isInitializing ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-chess-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ChessGame />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-chess-panel border-t border-chess-border px-4 py-3 text-center text-xs text-chess-muted">
        <p>
          © {new Date().getFullYear()} Chess Khelo Online &nbsp;·&nbsp; Built with{' '}
          <span className="text-red-400">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'chess-khelo-online')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-chess-accent hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Profile setup modal */}
      {showProfileSetup && (
        <ProfileSetupModal onComplete={() => {}} />
      )}

      {/* Mobile notice */}
      <MobileAppNotice />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
