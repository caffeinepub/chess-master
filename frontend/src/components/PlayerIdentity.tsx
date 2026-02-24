import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { User } from 'lucide-react';

export default function PlayerIdentity() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();

  if (!identity) return null;

  const principal = identity.getPrincipal().toString();
  const shortPrincipal = `${principal.slice(0, 5)}…${principal.slice(-5)}`;
  const displayName = profile?.name || shortPrincipal;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-chess-dark/60 border border-chess-gold/20 text-sm">
      <User size={14} className="text-chess-gold/70" />
      <span className="text-chess-gold/90 font-medium">{displayName}</span>
    </div>
  );
}
