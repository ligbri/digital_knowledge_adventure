
// --- MANUAL CONFIGURATION ---
export const GAME_CONFIG = {
  REQUIRED_PLAYERS: 2, // Set the number of players required to start
  MOVEMENT_SPEED: 3,    // Set the speed of the game (higher is faster)
};

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 400;

// Replace the URL below with your actual Render.com URL after deployment
// e.g., 'https://your-app-name.onrender.com'
export const BACKEND_URL = 'https://dka-be.onrender.com'; // 请替换为你自己的 Render URL

export const PHYSICS = {
  GRAVITY: 0.6,
  JUMP_FORCE: -12,
  INITIAL_SPEED: GAME_CONFIG.MOVEMENT_SPEED, // Uses the manual config
  GroundLevel: 320,
};

export const PLAYER_SIZE = {
  width: 30,
  height: 30,
};

export const DURATION_SECONDS = 30;

// Cyberpunk Colors
export const COLORS = {
  SKY_TOP: '#050510',    // Very dark blue/black
  SKY_BOTTOM: '#120024', // Dark purple gradient
  GRID_LINES: '#2a2a5a', // Faint grid
  GROUND: '#0a0a12',     // Dark block
  GROUND_NEON: '#00f3ff', // Cyan neon line for ground
  PLAYER: '#ff00ff',     // Magenta neon player
  PLAYER_GLOW: '#ff00ff',
  OBSTACLE: '#1a1a1a',   // Dark obstacle
  OBSTACLE_NEON: '#ff2a2a', // Red neon warning
  COIN: '#ffd700',       // Gold
  COIN_GLOW: '#ffff00',
  COIN_SPECIAL: '#00ff00', // Green matrix code for special
  COIN_SPECIAL_GLOW: '#00ff00',
};
