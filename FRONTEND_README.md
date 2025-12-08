# DKA - Frontend Documentation

## 📖 Overview
The frontend is built with **React** and **TypeScript**. It uses **HTML5 Canvas** for high-performance rendering (60 FPS) and **Tailwind CSS** for the UI overlays (Lobby, HUD, Quiz Modal).

## 🗂 File Structure & Functionality

### 1. Core Logic
*   **`components/RunnerGame.tsx`**: The heart of the application.
    *   **Rendering**: Uses `requestAnimationFrame` to draw the player, platforms, and neon effects on the `<canvas>`.
    *   **Physics**: Handles gravity (`vy`), collision detection (AABB), and scrolling speed.
    *   **Game Loop**: Manages states (`IDLE`, `PLAYING`, `QUIZ`, `GAME_OVER`, `MULTIPLAYER`).
    *   **Audio**: Uses `AudioContext` to synthesize sound effects (jumps, coins) without external assets.

*   **`App.tsx`**: The root component wrapper that centers the game container.

### 2. Data Models
*   **`types.ts`**: Defines TypeScript interfaces for game entities:
    *   `Player`: Position, velocity, jump state.
    *   `Coin`: Type (`NORMAL` vs `SPECIAL`), oscillation animation.
    *   `MultiPlayer`: Remote player data (score, status, ready state).
    *   `GameStatus`: Enum for managing UI transitions.

*   **`constants.ts`**: Central configuration file.
    *   **Physics**: Gravity, jump force, speed.
    *   **Colors**: The "Cyberpunk" palette (Neon Cyan, Magenta, Dark Purple).
    *   **Config**: `BACKEND_URL` for connecting to the multiplayer server.

*   **`quizData.ts`**: Contains the dummy database of trivia questions used when a special coin is collected.

### 3. Utilities
*   **`utils/multiplayer.ts`**: A wrapper class for the `Socket.io-client`.
    *   Handles connection establishment.
    *   listens for events (`room_update`, `start_game`).
    *   Sends player actions (`join`, `toggle_ready`, `update_score`).

### 4. Entry Point
*   **`index.html`**:
    *   Imports **Tailwind CSS** (via CDN).
    *   Imports **Socket.io Client** (via CDN).
    *   Imports Google Fonts (**Orbitron**) for the sci-fi look.

## 🎨 Design System
The game uses a **Cyberpunk/Sci-Fi** aesthetic:
*   **Visuals**: Neon glows (`shadowBlur`), dark grid backgrounds, matrix-style text.
*   **UI**: Translucent dark overlays with bright borders.

## 🕹 Controls
*   **Spacebar**: Jump (Double jump is not enabled by default).
*   **Mouse**: Interaction with UI buttons (Quiz answers, Lobby).
