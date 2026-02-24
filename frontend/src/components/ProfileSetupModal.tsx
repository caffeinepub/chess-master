import React, { useState } from 'react';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { User } from 'lucide-react';

interface ProfileSetupModalProps {
  onComplete: () => void;
}

export default function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError('Name must be 2–30 characters.');
      return;
    }
    if (!actor) return;
    setSaving(true);
    setError('');
    try {
      await actor.saveCallerUserProfile({ name: trimmed });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      onComplete();
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-chess-panel text-chess-panel-fg rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col gap-4"
        style={{ width: 'calc(100vw - 32px)', maxWidth: '360px' }}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-chess-accent/20 flex items-center justify-center">
            <User size={24} className="text-chess-accent" />
          </div>
          <h2 className="text-xl font-bold font-display">Welcome!</h2>
          <p className="text-sm text-chess-muted text-center">Choose a display name to get started.</p>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your display name"
            className="min-h-[44px] px-3 py-2 bg-chess-bg border border-chess-border rounded-lg text-chess-panel-fg placeholder:text-chess-muted focus:outline-none focus:border-chess-accent"
            style={{ fontSize: '16px' }}
            maxLength={30}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || name.trim().length < 2}
          className="min-h-[44px] bg-chess-accent text-chess-accent-fg rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
          ) : 'Save Name'}
        </button>
      </div>
    </div>
  );
}
