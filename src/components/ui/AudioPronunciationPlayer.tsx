'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Square, Sparkles, Music, Info } from 'lucide-react';
import { CulturalItem } from '@/lib/culturalHeritage';

interface AudioPronunciationPlayerProps {
  item: {
    name: string;
    nativeScript?: string;
    phonetics: string;
    syllables: string[];
    englishMeaning?: string;
    tibetanFrequencyHz?: number;
    audioGuideNote?: string;
  };
  variant?: 'compact' | 'card' | 'inline';
  className?: string;
}

export default function AudioPronunciationPlayer({
  item,
  variant = 'compact',
  className = '',
}: AudioPronunciationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSyllable, setActiveSyllable] = useState<number>(-1);
  const [audioError, setAudioError] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeOscsRef = useRef<OscillatorNode[]>([]);
  const syllableTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Cache available speech synthesis voices (handles async voiceschanged)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const stopAudio = () => {
    setIsPlaying(false);
    setActiveSyllable(-1);
    if (syllableTimerRef.current) clearTimeout(syllableTimerRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (masterGainRef.current && audioContextRef.current) {
      try {
        masterGainRef.current.gain.setValueAtTime(0.0001, audioContextRef.current.currentTime);
      } catch {}
    }
    activeOscsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    activeOscsRef.current = [];
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  /**
   * Synthesize Tibetan singing bowl / ceremonial temple chime harmonic tone
   * using native browser Web Audio API oscillator synthesis.
   */
  const playSingingBowlChime = (freqHz: number = 432) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        setAudioError(true);
        return;
      }

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const duration = 2.4;

      // Master output gain
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.28, now + 0.08); // Sharp gentle bell attack
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Long lingering decay

      // Fundamental harmonic tone
      const oscFundamental = ctx.createOscillator();
      oscFundamental.type = 'sine';
      oscFundamental.frequency.setValueAtTime(freqHz, now);
      oscFundamental.connect(masterGain);

      // Resonant singing bowl overtone (2.02x harmonic overtone with shimmer)
      const oscOvertone = ctx.createOscillator();
      oscOvertone.type = 'sine';
      oscOvertone.frequency.setValueAtTime(freqHz * 2.02, now);
      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.12, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + (duration * 0.8));
      oscOvertone.connect(overtoneGain);
      overtoneGain.connect(masterGain);

      masterGainRef.current = masterGain;
      activeOscsRef.current = [oscFundamental, oscOvertone];

      oscFundamental.start(now);
      oscOvertone.start(now);
      oscFundamental.stop(now + duration);
      oscOvertone.stop(now + duration);
    } catch (e) {
      console.warn('Web Audio synthesis unavailable:', e);
      setAudioError(true);
    }
  };

  /**
   * Speak Tibetan syllables using SpeechSynthesis with calibrated cadence.
   */
  const playPhoneticsSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAudioError(true);
      return;
    }
    window.speechSynthesis.cancel();

    const spokenText = item.syllables && item.syllables.length > 0
      ? item.syllables.join(' ')
      : item.phonetics;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.8; // Deliberate syllable cadence
    utterance.pitch = 0.95; // Grounded resonant pitch

    // Try finding an appropriate voice if available
    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('ne') || v.lang.startsWith('hi') || v.lang.startsWith('bo')
    ) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      // Speech finished
    };

    utterance.onerror = () => {
      setAudioError(true);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    // Start playback
    setIsPlaying(true);
    setActiveSyllable(0);
    setAudioError(false);

    // 1. Play synthesized Tibetan singing bowl chime
    playSingingBowlChime(item.tibetanFrequencyHz || 432);

    // 2. Play vocalized speech utterance
    playPhoneticsSpeech();

    // 3. Step through syllables visually
    const totalSyllables = item.syllables?.length || 1;
    const intervalMs = 600; // Time per syllable

    let currentIdx = 0;
    const advanceSyllable = () => {
      currentIdx++;
      if (currentIdx < totalSyllables) {
        setActiveSyllable(currentIdx);
        syllableTimerRef.current = setTimeout(advanceSyllable, intervalMs);
      } else {
        // Complete playback cycle
        syllableTimerRef.current = setTimeout(() => {
          stopAudio();
        }, 800);
      }
    };

    syllableTimerRef.current = setTimeout(advanceSyllable, intervalMs);
  };

  // Compact variant (inline button + phonetic badge)
  if (variant === 'compact') {
    return (
      <div
        data-slot="base"
        className={`inline-flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-[#B68D40]/30 backdrop-blur-md ${className}`}
      >
        <button
          type="button"
          onClick={handlePlayToggle}
          data-slot="trigger"
          data-pressed={isPlaying}
          aria-label={`Listen native pronunciation for ${item.name}`}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
            isPlaying
              ? 'bg-[#B68D40] text-black shadow-md shadow-[#B68D40]/30 animate-pulse'
              : 'bg-slate-800 text-[#E2C085] hover:bg-slate-700 hover:text-white'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span>Playing</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#B68D40]" />
              <span>Listen</span>
            </>
          )}
        </button>

        {/* Syllable Breakdown */}
        <div data-slot="content" className="flex items-center gap-1 text-xs">
          {item.syllables && item.syllables.length > 0 ? (
            item.syllables.map((syl, i) => (
              <span
                key={i}
                className={`px-1.5 py-0.5 rounded font-mono transition-all duration-200 text-[11px] ${
                  isPlaying && activeSyllable === i
                    ? 'bg-[#B68D40] text-black font-extrabold scale-110 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border border-slate-800'
                }`}
              >
                {syl}
              </span>
            ))
          ) : (
            <span className="font-mono text-slate-300 text-[11px]">{item.phonetics}</span>
          )}
        </div>

        {/* Dynamic Pulse Visualizer */}
        {isPlaying && (
          <div className="flex items-end gap-0.5 h-3.5 px-1">
            <span className="w-1 bg-[#B68D40] rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
            <span className="w-1 bg-[#E2C085] rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
            <span className="w-1 bg-[#B68D40] rounded-full animate-bounce h-3.5" />
          </div>
        )}
      </div>
    );
  }

  // Card variant (rich showcase with Tibetan script & meaning)
  return (
    <div
      data-slot="base"
      className={`p-4 rounded-2xl bg-slate-900/90 border border-[#B68D40]/30 backdrop-blur-xl shadow-xl space-y-3 ${className}`}
    >
      <div data-slot="header" className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-extrabold text-white tracking-tight">{item.name}</h4>
            {item.nativeScript && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30 font-medium">
                {item.nativeScript}
              </span>
            )}
          </div>
          {item.englishMeaning && (
            <p className="text-xs text-[#E2C085] font-medium mt-0.5">
              “{item.englishMeaning}”
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handlePlayToggle}
          data-slot="trigger"
          data-pressed={isPlaying}
          aria-label={`Play native Sherpa pronunciation for ${item.name}`}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
            isPlaying
              ? 'bg-[#B68D40] text-black shadow-lg shadow-[#B68D40]/40'
              : 'bg-slate-800 hover:bg-slate-700 text-[#E2C085] border border-slate-700'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-[#B68D40]" />
              <span>Pronounce</span>
            </>
          )}
        </button>
      </div>

      {/* Syllables Bar */}
      <div data-slot="body" className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          Native Syllable Cadence
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {item.syllables && item.syllables.length > 0 ? (
            item.syllables.map((syl, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-200 border ${
                  isPlaying && activeSyllable === i
                    ? 'bg-[#B68D40] text-black border-[#E2C085] scale-105 shadow-md shadow-[#B68D40]/30'
                    : 'bg-slate-950 text-slate-200 border-slate-800'
                }`}
              >
                {syl}
              </span>
            ))
          ) : (
            <span className="font-mono text-xs text-white">{item.phonetics}</span>
          )}

          {/* Harmonic Resonance Indicator */}
          {item.tibetanFrequencyHz && (
            <span className="text-[10px] text-slate-500 font-mono ml-auto flex items-center gap-1">
              <Music className="w-3 h-3 text-[#B68D40]" />
              {item.tibetanFrequencyHz} Hz Tone
            </span>
          )}
        </div>
      </div>

      {/* Audio guide or lore note */}
      {item.audioGuideNote && (
        <p data-slot="footer" className="text-[11px] text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
          <span className="text-slate-400 font-medium">Guide: </span>
          {item.audioGuideNote}
        </p>
      )}

      {audioError && (
        <p className="text-[10px] text-amber-400/90 italic flex items-center gap-1 pt-0.5">
          <Info className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Speech engine offline on this device; follow the phonetic cadence above.</span>
        </p>
      )}
    </div>
  );
}
