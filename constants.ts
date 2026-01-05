
// --- MANUAL CONFIGURATION ---
export const GAME_CONFIG = {
  REQUIRED_PLAYERS: 2, // Set the number of players required to start
  MOVEMENT_SPEED: 4.5,    // Increased slightly for better flow and wider jumps
  SAFE_ZONE_DURATION: 3, // Seconds at start with no obstacles (New Feature)
  MAX_LIVES: 2,          // Total lives per run (New Feature)
};

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 400;

// Replace the URL below with your actual Render.com URL after deployment
// e.g., 'https://your-app-name.onrender.com'
export const BACKEND_URL = 'https://dka-be.onrender.com'; // 请替换为你自己的 Render URL

export const PHYSICS = {
  // To increase horizontal jump distance: Decrease GRAVITY or Increase MOVEMENT_SPEED/JUMP_FORCE
  // Adjusted for wider jump arc as requested
  GRAVITY: 0.5,         
  JUMP_FORCE: -11,      
  INITIAL_SPEED: GAME_CONFIG.MOVEMENT_SPEED, 
  GroundLevel: 320,
};

export const PLAYER_SIZE = {
  width: 30,
  height: 30,
};
S
export const OBSTACLE_SIZE = {
  width: 30,
  height: 40,
};

export const DURATION_SECONDS = 30;

// --- SPAWN CONFIGURATION (New Feature: Configurable obstacles/coins) ---
export const SPAWN_CONFIG = {
  // Probability (0.0 - 1.0)
  PIT_PROBABILITY: 0.0,       // DEPRECATED in logic: Logic now ties pit chance to OBSTACLE_PROBABILITY
  OBSTACLE_PROBABILITY: 0.5,  // Global hazard chance. If hit: 50% Pit, 50% Obstacles.
  SPECIAL_COIN_CHANCE: 0.5,   // Chance of a coin being special (quiz)
  
  // Quantities
  MIN_COINS_PER_PLATFORM: 1,
  MAX_COINS_PER_PLATFORM: 2,
  
  MIN_OBSTACLES_PER_PLATFORM: 1, // New: Min obstacles if probability hits
  MAX_OBSTACLES_PER_PLATFORM: 1, // New: Max obstacles per platform (Increase this for harder difficulty)
  
  // Dimensions
  MIN_PLATFORM_WIDTH: 300,
  MAX_PLATFORM_WIDTH: 800,
  PIT_GAP_MIN: 80,  // DEPRECATED: Now strictly OBSTACLE_SIZE.width * 3
  PIT_GAP_MAX: 140, // DEPRECATED
};

// --- VISUAL EFFECTS (New Feature) ---
export const VISUALS = {
  GHOST_INTERVAL: 5, // Frames between ghost creation
  PARTICLE_COUNT_JUMP: 8,
  PARTICLE_COUNT_COIN: 8,
  PARTICLE_COUNT_HIT: 20,
};

// Cyberpunk Colors
export const COLORS = {
  SKY_TOP: '#050510',    // Very dark blue/black
  SKY_BOTTOM: '#120024', // Dark purple gradient
  GRID_LINES: '#2a2a5a', // Faint grid
  GROUND: '#0a0a12',     // Dark block
  GROUND_NEON: '#00f3ff', // Cyan neon line for ground
  PLAYER: '#ff00ff',     // Magenta neon player
  PLAYER_GLOW: '#ff00ff',
  PLAYER_HIT: '#ffffff', // White flash when hit
  OBSTACLE: '#1a1a1a',   // Dark obstacle
  OBSTACLE_NEON: '#ff2a2a', // Red neon warning
  COIN: '#ffd700',       // Gold
  COIN_GLOW: '#ffff00',
  COIN_SPECIAL: '#00ff00', // Green matrix code for special
  COIN_SPECIAL_GLOW: '#00ff00',
};

// --- CONFIGURABLE TEXT STRINGS (New Feature) ---
export const GAME_TEXT = {
  TITLE: "AZ Digital 跑酷大师",
  SUBTITLE: "吃金币，答题，赢得奖励",
  BTN_SINGLE: "单机游玩",
  BTN_JOIN: "加入团队",
  LOBBY_CONNECTING: "CONNECTING TO SERVER...",
  LOBBY_ENTER_NAME: "ENTER YOUR NAME",
  BTN_ENTER_WAITING: "ENTER WAITING ROOM",
  BTN_BACK: "Back to Menu",
  WAITING_TITLE: "TEAM LOBBY",
  WAITING_STATUS: "WAITING FOR OTHERS...",
  BTN_READY: "I AM READY",
  BTN_CANCEL: "CANCEL READY",
  BTN_ABORT: "ABORT MISSION",
  HINT_JUMP: "点击屏幕跳跃", // Chinese prompt as requested
  GAME_OVER: "SYSTEM FAILURE",
  VICTORY: "MISSION COMPLETE",
  BTN_RETRY: "RETRY",
  BTN_MENU: "MENU",
  LEADERBOARD_TITLE: "MISSION RESULTS",
  MSG_SYNC: "SYNCING WITH SERVER...",
  MSG_WAIT_OTHERS: "Waiting for other runners...",
  MSG_LIVES_LEFT: "SHIELD ACTIVE",
  MSG_CRITICAL: "CRITICAL DAMAGE"
};
