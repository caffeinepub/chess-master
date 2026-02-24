import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading, isFetched } = useGetCallerUserProfile();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAuthenticated = !!identity;
  const showModal = isAuthenticated && !isLoading && isFetched && userProfile === null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!actor) return;
    setSaving(true);
    setError('');
    try {
      await actor.saveCallerUserProfile({ name: name.trim() });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    } catch (e) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={showModal}>
      <DialogContent className="bg-chess-dark border border-chess-gold/40 text-chess-cream max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-chess-gold font-playfair text-xl">Welcome, Chess Player!</DialogTitle>
          <DialogDescription className="text-chess-cream/70">
            Enter your display name to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name..."
            className="bg-chess-dark/80 border-chess-gold/30 text-chess-cream placeholder:text-chess-cream/40 focus:border-chess-gold"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            maxLength={30}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full bg-chess-gold text-chess-dark hover:bg-chess-gold/90 font-semibold"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {saving ? 'Saving...' : 'Save Name'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
