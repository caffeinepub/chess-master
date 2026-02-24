import { useRef, useState, useCallback, useEffect } from 'react';

export function useBackgroundMusic() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const noteIndexRef = useRef<number>(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const masterGainRef = useRef<GainNode | null>(null);

  const NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C major pentatonic
  const TEMPO = 0.5;

  const scheduleNote = useCallback((freq: number, time: number) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGainRef.current);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + TEMPO * 0.9);
    osc.start(time);
    osc.stop(time + TEMPO);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const freq = NOTES[noteIndexRef.current % NOTES.length];
      scheduleNote(freq, nextNoteTimeRef.current);
      noteIndexRef.current = (noteIndexRef.current + 1) % NOTES.length;
      nextNoteTimeRef.current += TEMPO;
    }
    schedulerRef.current = window.setTimeout(scheduler, 25);
  }, [scheduleNote]);

  const startMusic = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      if (!masterGainRef.current) {
        masterGainRef.current = ctx.createGain();
        masterGainRef.current.connect(ctx.destination);
      }
      masterGainRef.current.gain.value = isMuted ? 0 : 0.5;
      nextNoteTimeRef.current = ctx.currentTime;
      setIsPlaying(true);
      scheduler();
    } catch (e) {
      // Silently fail
    }
  }, [isMuted, scheduler]);

  const stopMusic = useCallback(() => {
    if (schedulerRef.current) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = newMuted ? 0 : 0.5;
      }
      return newMuted;
    });
  }, []);

  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, [stopMusic]);

  return { startMusic, stopMusic, toggleMute, isMuted, isPlaying };
}
