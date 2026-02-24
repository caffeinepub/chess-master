import { useRef, useState, useCallback, useEffect } from 'react';

// A gentle ambient chess melody — C major pentatonic arpeggio pattern
// Notes: C4=261.63, E4=329.63, G4=392, A4=440, C5=523.25, E5=659.25, G5=783.99
const MELODY_NOTES = [
  261.63, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63,
  261.63, 329.63, 392.0, 523.25, 659.25, 523.25, 392.0, 329.63,
  261.63, 392.0, 523.25, 659.25, 783.99, 659.25, 523.25, 392.0,
  329.63, 440.0, 523.25, 440.0, 392.0, 329.63, 261.63, 261.63,
];

const NOTE_DURATION = 0.55; // seconds per note
const MELODY_VOLUME = 0.06;

export function useBackgroundMusic() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const schedulerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const noteIndexRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const masterGainRef = useRef<GainNode | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isMutedRef = useRef(false);

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      // Master gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(MELODY_VOLUME, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;
    }
    return audioCtxRef.current;
  }, []);

  const scheduleNote = useCallback((ctx: AudioContext, freq: number, time: number) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.connect(noteGain);
    noteGain.connect(masterGainRef.current!);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Soft attack and release envelope
    noteGain.gain.setValueAtTime(0, time);
    noteGain.gain.linearRampToValueAtTime(1.0, time + 0.08);
    noteGain.gain.setValueAtTime(1.0, time + NOTE_DURATION * 0.6);
    noteGain.gain.linearRampToValueAtTime(0, time + NOTE_DURATION * 0.95);

    osc.start(time);
    osc.stop(time + NOTE_DURATION);
  }, []);

  const scheduler = useCallback(() => {
    if (!isPlayingRef.current) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const scheduleAhead = 0.3; // seconds to schedule ahead
    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAhead) {
      const noteIdx = noteIndexRef.current % MELODY_NOTES.length;
      const freq = MELODY_NOTES[noteIdx];
      scheduleNote(ctx, freq, nextNoteTimeRef.current);
      nextNoteTimeRef.current += NOTE_DURATION;
      noteIndexRef.current++;
    }

    schedulerTimerRef.current = setTimeout(scheduler, 100);
  }, [scheduleNote]);

  const startMusic = useCallback(() => {
    if (isPlayingRef.current) return;
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      isPlayingRef.current = true;
      setIsPlaying(true);
      nextNoteTimeRef.current = ctx.currentTime + 0.1;
      noteIndexRef.current = 0;

      // Apply mute state
      if (masterGainRef.current) {
        masterGainRef.current.gain.setValueAtTime(
          isMutedRef.current ? 0 : MELODY_VOLUME,
          ctx.currentTime
        );
      }

      scheduler();
    } catch (e) {
      // Silently ignore
    }
  }, [getAudioContext, scheduler]);

  const stopMusic = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (schedulerTimerRef.current !== null) {
      clearTimeout(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    // Reset note position for next start
    noteIndexRef.current = 0;
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !isMutedRef.current;
    isMutedRef.current = newMuted;
    setIsMuted(newMuted);

    if (masterGainRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      masterGainRef.current.gain.setValueAtTime(
        newMuted ? 0 : MELODY_VOLUME,
        ctx.currentTime
      );
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (schedulerTimerRef.current !== null) {
        clearTimeout(schedulerTimerRef.current);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return { startMusic, stopMusic, toggleMute, isMuted, isPlaying };
}
