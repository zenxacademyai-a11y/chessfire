import type { PieceType } from '@/utils/chessLogic';

class SoundGenerator {
  private ctx: AudioContext | null = null;

  private getCtx() {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  // Helper: create noise buffer
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
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
    noise.start(ctx.currentTime + delay);
  }

  // Helper: play a tone
  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, delay = 0, freqEnd?: number) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + delay + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  // ============ PIECE-SPECIFIC MOVE SOUNDS ============

  // ♞ Knight / Horse — galloping hooves + whinny
  playKnightMove() {
    const ctx = this.getCtx();
    // Galloping hooves (4 quick percussive hits)
    for (let i = 0; i < 4; i++) {
      const delay = i * 0.08;
      this.createNoise(0.05, 0.2 + (i % 2) * 0.1, delay);
      this.playTone(150 + (i % 2) * 80, 'triangle', 0.04, 0.15, delay);
    }
    // Whinny — rising then falling tone
    this.playTone(400, 'sawtooth', 0.15, 0.12, 0.35, 900);
    this.playTone(800, 'sawtooth', 0.2, 0.1, 0.5, 350);
    // Landing thud
    this.createNoise(0.1, 0.25, 0.7);
    this.playTone(80, 'sine', 0.1, 0.2, 0.7, 40);
  }

  // ♜ Rook / Castle — heavy stone grinding/rolling
  playRookMove() {
    // Low rumbling grind
    this.playTone(60, 'sawtooth', 0.4, 0.15, 0, 50);
    this.playTone(90, 'square', 0.35, 0.08, 0.05, 70);
    // Stone scraping noise
    this.createNoise(0.35, 0.12, 0);
    // Heavy thud on landing
    this.playTone(50, 'sine', 0.15, 0.25, 0.35, 30);
    this.createNoise(0.08, 0.2, 0.35);
  }

  // ♝ Bishop — mystical/magical chime
  playBishopMove() {
    // Ethereal ascending chimes
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sine', 0.3, 0.12 - i * 0.02, i * 0.1);
      this.playTone(freq * 1.005, 'sine', 0.3, 0.08 - i * 0.01, i * 0.1); // slight detune for shimmer
    });
    // Soft whoosh
    this.createNoise(0.2, 0.05, 0.1);
  }

  // ♛ Queen — royal fanfare glide
  playQueenMove() {
    // Majestic rising chord
    this.playTone(262, 'sine', 0.4, 0.1, 0); // C4
    this.playTone(330, 'sine', 0.4, 0.1, 0.05); // E4
    this.playTone(392, 'sine', 0.4, 0.1, 0.1); // G4
    // Shimmering high tone
    this.playTone(1047, 'sine', 0.5, 0.06, 0.15, 1200);
    this.playTone(1050, 'sine', 0.5, 0.05, 0.15, 1205); // detune shimmer
    // Soft whoosh for teleport/glide
    this.createNoise(0.15, 0.06, 0.2);
    // Elegant landing
    this.playTone(523, 'sine', 0.2, 0.08, 0.45);
  }

  // ♚ King — slow regal footsteps + deep authority
  playKingMove() {
    // Deep authoritative tone
    this.playTone(110, 'sine', 0.3, 0.15, 0);
    this.playTone(165, 'sine', 0.25, 0.1, 0.05);
    // Slow footsteps (2 deliberate steps)
    this.createNoise(0.06, 0.15, 0.15);
    this.playTone(100, 'triangle', 0.05, 0.12, 0.15);
    this.createNoise(0.06, 0.15, 0.35);
    this.playTone(100, 'triangle', 0.05, 0.12, 0.35);
    // Royal settle
    this.playTone(130, 'sine', 0.2, 0.08, 0.45);
  }

  // ♟ Pawn — light soldier march footstep
  playPawnMove() {
    // Quick light footstep
    this.createNoise(0.04, 0.12, 0);
    this.playTone(300, 'triangle', 0.06, 0.1, 0);
    // Second step
    this.createNoise(0.04, 0.1, 0.1);
    this.playTone(320, 'triangle', 0.05, 0.08, 0.1);
    // Soft place-down
    this.playTone(250, 'sine', 0.08, 0.06, 0.18, 200);
  }

  // ============ PIECE-SPECIFIC CAPTURE SOUNDS ============

  // Knight capture — charge + impact
  playKnightCapture() {
    this.playKnightMove();
    // Sword clash
    this.playTone(2000, 'sawtooth', 0.08, 0.2, 0.6);
    this.playTone(3000, 'square', 0.05, 0.15, 0.62);
    this.createNoise(0.2, 0.25, 0.6);
    this.playTone(100, 'sine', 0.15, 0.2, 0.7, 40);
  }

  // Rook capture — crushing blow
  playRookCapture() {
    this.playRookMove();
    // Heavy crush
    this.createNoise(0.3, 0.3, 0.35);
    this.playTone(40, 'sine', 0.3, 0.3, 0.35, 20);
    this.playTone(80, 'sawtooth', 0.15, 0.15, 0.4, 30);
  }

  // Bishop capture — magical zap
  playBishopCapture() {
    this.playBishopMove();
    // Magic zap
    this.playTone(1500, 'sawtooth', 0.1, 0.2, 0.35, 200);
    this.playTone(800, 'square', 0.08, 0.15, 0.38, 100);
    this.createNoise(0.12, 0.15, 0.35);
  }

  // Queen capture — royal strike
  playQueenCapture() {
    this.playQueenMove();
    // Powerful strike chord
    this.playTone(200, 'sawtooth', 0.2, 0.2, 0.5);
    this.playTone(400, 'sawtooth', 0.2, 0.15, 0.5);
    this.playTone(600, 'sawtooth', 0.15, 0.1, 0.5);
    this.createNoise(0.25, 0.2, 0.5);
    this.playTone(60, 'sine', 0.2, 0.2, 0.6, 30);
  }

  // King capture — rare but dramatic
  playKingCapture() {
    this.playKingMove();
    this.playTone(150, 'sawtooth', 0.3, 0.2, 0.4);
    this.createNoise(0.2, 0.2, 0.45);
  }

  // Pawn capture — soldier attack
  playPawnCapture() {
    // Quick aggressive lunge
    this.playTone(400, 'sawtooth', 0.08, 0.15, 0);
    this.playTone(500, 'sawtooth', 0.06, 0.12, 0.05);
    // Sword/spear hit
    this.playTone(1200, 'square', 0.04, 0.2, 0.12);
    this.createNoise(0.15, 0.2, 0.12);
    // Body hit thud
    this.playTone(80, 'sine', 0.1, 0.15, 0.18, 40);
  }

  // ============ GENERAL SOUNDS ============

  // Generic move (coin-like place sound)
  playMove() {
    const ctx = this.getCtx();
    // Coin place — bright metallic tap
    this.playTone(1200, 'sine', 0.06, 0.2, 0, 800);
    this.playTone(2400, 'sine', 0.04, 0.08, 0, 1600);
    // Soft ring
    this.playTone(1000, 'sine', 0.15, 0.06, 0.05);
  }

  // Piece-aware move
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

  // Piece-aware capture
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
    // Coin pick-up click
    this.playTone(900, 'sine', 0.06, 0.12, 0);
    this.playTone(1350, 'sine', 0.08, 0.1, 0.04);
  }

  playCheck() {
    // Alarming two-tone with metallic ring
    this.playTone(880, 'square', 0.12, 0.2, 0);
    this.playTone(1100, 'square', 0.12, 0.2, 0.15);
    this.playTone(880, 'sine', 0.2, 0.08, 0);
    this.playTone(1100, 'sine', 0.2, 0.08, 0.15);
  }

  playCheckmate() {
    // Dramatic descending fanfare
    const notes = [1200, 1000, 800, 600, 400];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sawtooth', 0.3, 0.25, i * 0.15);
      this.playTone(freq * 0.5, 'sine', 0.3, 0.1, i * 0.15);
    });
    // Final crash
    this.createNoise(0.5, 0.15, 0.6);
    // Victory chord
    this.playTone(262, 'sine', 0.8, 0.1, 0.9);
    this.playTone(330, 'sine', 0.8, 0.1, 0.9);
    this.playTone(392, 'sine', 0.8, 0.1, 0.9);
  }
}

const soundGen = new SoundGenerator();

export function useSound() {
  return {
    playMove: () => soundGen.playMove(),
    playCapture: () => soundGen.playCapture(),
    playSelect: () => soundGen.playSelect(),
    playCheck: () => soundGen.playCheck(),
    playCheckmate: () => soundGen.playCheckmate(),
    playPieceMove: (type: PieceType) => soundGen.playPieceMove(type),
    playPieceCapture: (type: PieceType) => soundGen.playPieceCapture(type),
  };
}
