import { create } from 'zustand';
import type { PieceType } from '@/utils/chessLogic';

// Volume store
interface SoundState {
  volume: number;
  muted: boolean;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

export const useSoundStore = create<SoundState>((set) => ({
  volume: 0.7,
  muted: true,
  setVolume: (v) => set({ volume: v }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}));

class SoundGenerator {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private getMaster() {
    this.getCtx();
    return this.masterGain!;
  }

  setVolume(v: number) {
    const master = this.getMaster();
    master.gain.setValueAtTime(v, this.getCtx().currentTime);
  }

  private createNoise(duration: number, volume: number, delay = 0) {
    const ctx = this.getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    const noise = ctx.createBufferSource();
    const gain = ctx.createGain();
    noise.buffer = buffer;
    noise.connect(gain);
    gain.connect(this.getMaster());
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
    noise.start(ctx.currentTime + delay);
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, delay = 0, freqEnd?: number) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.connect(gain);
    gain.connect(this.getMaster());
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + delay + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  // ============ PIECE MOVE SOUNDS ============
  playKnightMove() {
    for (let i = 0; i < 4; i++) {
      const delay = i * 0.08;
      this.createNoise(0.05, 0.2 + (i % 2) * 0.1, delay);
      this.playTone(150 + (i % 2) * 80, 'triangle', 0.04, 0.15, delay);
    }
    this.playTone(400, 'sawtooth', 0.15, 0.12, 0.35, 900);
    this.playTone(800, 'sawtooth', 0.2, 0.1, 0.5, 350);
    this.createNoise(0.1, 0.25, 0.7);
    this.playTone(80, 'sine', 0.1, 0.2, 0.7, 40);
  }

  playRookMove() {
    this.playTone(60, 'sawtooth', 0.4, 0.15, 0, 50);
    this.playTone(90, 'square', 0.35, 0.08, 0.05, 70);
    this.createNoise(0.35, 0.12, 0);
    this.playTone(50, 'sine', 0.15, 0.25, 0.35, 30);
    this.createNoise(0.08, 0.2, 0.35);
  }

  playBishopMove() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sine', 0.3, 0.12 - i * 0.02, i * 0.1);
      this.playTone(freq * 1.005, 'sine', 0.3, 0.08 - i * 0.01, i * 0.1);
    });
    this.createNoise(0.2, 0.05, 0.1);
  }

  playQueenMove() {
    this.playTone(262, 'sine', 0.4, 0.1, 0);
    this.playTone(330, 'sine', 0.4, 0.1, 0.05);
    this.playTone(392, 'sine', 0.4, 0.1, 0.1);
    this.playTone(1047, 'sine', 0.5, 0.06, 0.15, 1200);
    this.playTone(1050, 'sine', 0.5, 0.05, 0.15, 1205);
    this.createNoise(0.15, 0.06, 0.2);
    this.playTone(523, 'sine', 0.2, 0.08, 0.45);
  }

  playKingMove() {
    this.playTone(110, 'sine', 0.3, 0.15, 0);
    this.playTone(165, 'sine', 0.25, 0.1, 0.05);
    this.createNoise(0.06, 0.15, 0.15);
    this.playTone(100, 'triangle', 0.05, 0.12, 0.15);
    this.createNoise(0.06, 0.15, 0.35);
    this.playTone(100, 'triangle', 0.05, 0.12, 0.35);
    this.playTone(130, 'sine', 0.2, 0.08, 0.45);
  }

  playPawnMove() {
    this.createNoise(0.04, 0.12, 0);
    this.playTone(300, 'triangle', 0.06, 0.1, 0);
    this.createNoise(0.04, 0.1, 0.1);
    this.playTone(320, 'triangle', 0.05, 0.08, 0.1);
    this.playTone(250, 'sine', 0.08, 0.06, 0.18, 200);
  }

  // ============ PIECE CAPTURE SOUNDS ============
  playKnightCapture() {
    this.playKnightMove();
    this.playTone(2000, 'sawtooth', 0.08, 0.2, 0.6);
    this.playTone(3000, 'square', 0.05, 0.15, 0.62);
    this.createNoise(0.2, 0.25, 0.6);
    this.playTone(100, 'sine', 0.15, 0.2, 0.7, 40);
  }

  playRookCapture() {
    this.playRookMove();
    this.createNoise(0.3, 0.3, 0.35);
    this.playTone(40, 'sine', 0.3, 0.3, 0.35, 20);
    this.playTone(80, 'sawtooth', 0.15, 0.15, 0.4, 30);
  }

  playBishopCapture() {
    this.playBishopMove();
    this.playTone(1500, 'sawtooth', 0.1, 0.2, 0.35, 200);
    this.playTone(800, 'square', 0.08, 0.15, 0.38, 100);
    this.createNoise(0.12, 0.15, 0.35);
  }

  playQueenCapture() {
    this.playQueenMove();
    this.playTone(200, 'sawtooth', 0.2, 0.2, 0.5);
    this.playTone(400, 'sawtooth', 0.2, 0.15, 0.5);
    this.playTone(600, 'sawtooth', 0.15, 0.1, 0.5);
    this.createNoise(0.25, 0.2, 0.5);
    this.playTone(60, 'sine', 0.2, 0.2, 0.6, 30);
  }

  playKingCapture() {
    this.playKingMove();
    this.playTone(150, 'sawtooth', 0.3, 0.2, 0.4);
    this.createNoise(0.2, 0.2, 0.45);
  }

  playPawnCapture() {
    this.playTone(400, 'sawtooth', 0.08, 0.15, 0);
    this.playTone(500, 'sawtooth', 0.06, 0.12, 0.05);
    this.playTone(1200, 'square', 0.04, 0.2, 0.12);
    this.createNoise(0.15, 0.2, 0.12);
    this.playTone(80, 'sine', 0.1, 0.15, 0.18, 40);
  }

  // ============ GENERAL SOUNDS ============
  playMove() {
    this.playTone(1200, 'sine', 0.06, 0.2, 0, 800);
    this.playTone(2400, 'sine', 0.04, 0.08, 0, 1600);
    this.playTone(1000, 'sine', 0.15, 0.06, 0.05);
  }

  playPieceMove(type: PieceType) {
    switch (type) {
      case 'knight': this.playKnightMove(); break;
      case 'rook': this.playRookMove(); break;
      case 'bishop': this.playBishopMove(); break;
      case 'queen': this.playQueenMove(); break;
      case 'king': this.playKingMove(); break;
      case 'pawn': this.playPawnMove(); break;
      default: this.playMove();
    }
  }

  playPieceCapture(type: PieceType) {
    switch (type) {
      case 'knight': this.playKnightCapture(); break;
      case 'rook': this.playRookCapture(); break;
      case 'bishop': this.playBishopCapture(); break;
      case 'queen': this.playQueenCapture(); break;
      case 'king': this.playKingCapture(); break;
      case 'pawn': this.playPawnCapture(); break;
      default: this.playCapture();
    }
  }

  playCapture() {
    this.playTone(200, 'sawtooth', 0.3, 0.4, 0, 50);
    this.createNoise(0.2, 0.2, 0);
  }

  playSelect() {
    this.playTone(900, 'sine', 0.06, 0.12, 0);
    this.playTone(1350, 'sine', 0.08, 0.1, 0.04);
  }

  playCheck() {
    this.playTone(880, 'square', 0.12, 0.2, 0);
    this.playTone(1100, 'square', 0.12, 0.2, 0.15);
    this.playTone(880, 'sine', 0.2, 0.08, 0);
    this.playTone(1100, 'sine', 0.2, 0.08, 0.15);
  }

  playCheckmate() {
    const notes = [1200, 1000, 800, 600, 400];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sawtooth', 0.3, 0.25, i * 0.15);
      this.playTone(freq * 0.5, 'sine', 0.3, 0.1, i * 0.15);
    });
    this.createNoise(0.5, 0.15, 0.6);
    this.playTone(262, 'sine', 0.8, 0.1, 0.9);
    this.playTone(330, 'sine', 0.8, 0.1, 0.9);
    this.playTone(392, 'sine', 0.8, 0.1, 0.9);
  }

  // ============ WIN/LOSE SOUNDS ============
  playVictory() {
    // Triumphant ascending fanfare
    const notes = [262, 330, 392, 523, 659, 784];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sine', 0.5, 0.15, i * 0.12);
      this.playTone(freq * 1.5, 'sine', 0.4, 0.08, i * 0.12 + 0.05);
    });
    // Triumphant chord
    this.playTone(523, 'sine', 1.2, 0.12, 0.8);
    this.playTone(659, 'sine', 1.2, 0.12, 0.8);
    this.playTone(784, 'sine', 1.2, 0.12, 0.8);
    // Sparkle
    for (let i = 0; i < 8; i++) {
      this.playTone(1500 + Math.random() * 2000, 'sine', 0.1, 0.06, 0.9 + i * 0.08);
    }
  }

  playDefeat() {
    // Sad descending tones
    const notes = [400, 350, 300, 250, 200];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sine', 0.4, 0.15, i * 0.2);
      this.playTone(freq * 0.75, 'sine', 0.4, 0.08, i * 0.2);
    });
    // Low rumble
    this.playTone(60, 'sawtooth', 0.8, 0.1, 0.8, 30);
    this.createNoise(0.6, 0.08, 0.8);
  }
}

const soundGen = new SoundGenerator();

export function useSound() {
  const { volume, muted } = useSoundStore();
  
  // Update master volume
  soundGen.setVolume(muted ? 0 : volume);

  return {
    playMove: () => soundGen.playMove(),
    playCapture: () => soundGen.playCapture(),
    playSelect: () => soundGen.playSelect(),
    playCheck: () => soundGen.playCheck(),
    playCheckmate: () => soundGen.playCheckmate(),
    playPieceMove: (type: PieceType) => soundGen.playPieceMove(type),
    playPieceCapture: (type: PieceType) => soundGen.playPieceCapture(type),
    playVictory: () => soundGen.playVictory(),
    playDefeat: () => soundGen.playDefeat(),
  };
}
