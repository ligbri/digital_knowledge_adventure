
export enum GameStatus {
  IDLE = 'IDLE',
  LOBBY = 'LOBBY',
  WAITING_ROOM = 'WAITING_ROOM',
  PLAYING = 'PLAYING',
  QUIZ = 'QUIZ',
  GAME_OVER = 'GAME_OVER', // Individual failure
  WAITING_RESULTS = 'WAITING_RESULTS', // Finished/Died, waiting for others
  LEADERBOARD = 'LEADERBOARD',
  VICTORY = 'VICTORY' // Used for Single Player only
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Entity {
  vy: number; // Vertical velocity
  isJumping: boolean;
  color: string;
  lives: number;
  invulnerableUntil: number; // Timestamp for invincibility end
}

export interface Platform extends Entity {
  id: number;
}

export interface Obstacle extends Entity {
  id: number;
  type: 'CRATE' | 'SPIKE';
}

export interface Coin extends Entity {
  id: number;
  collected: boolean;
  oscillationOffset: number;
  type: 'NORMAL' | 'SPECIAL';
}

export interface MultiPlayer {
  id: string;
  name: string;
  isReady: boolean;
  score: number;
  status: 'ALIVE' | 'DEAD' | 'FINISHED';
}

export interface GameState {
  status: GameStatus;
  score: number;
  timeLeft: number;
  speed: number;
}

// Visual Effects
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0 to 1
  color: string;
  size: number;
}

export interface Ghost {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  color: string;
}
