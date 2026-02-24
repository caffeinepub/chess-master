import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { User } from 'lucide-react';

export default function PlayerIdentity() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();

  if (!identity) return null;

  const displayName = profile?.name ||
    identity.getPrincipal().toString().substring(0, 8) + '…';

  return (
    <div className="flex items-center gap-1.5 text-chess-panel-fg shrink-0">
      <User size={14} className="text-chess-accent shrink-0" />
      <span className="text-sm font-medium truncate max-w-[120px]">{displayName}</span>
    </div>
  );
}
