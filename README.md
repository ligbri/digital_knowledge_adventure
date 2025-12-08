# Digital Knowledge Adventure (DKA) - Project Overview

## 🎮 Introduction
**Digital Knowledge Adventure** is a Cyberpunk-themed side-scrolling parkour web game. Players control a runner to jump over obstacles, avoid pits, and collect coins.

What makes this game unique:
1.  **Quiz Mechanism**: Collecting special "Green Matrix Coins" triggers a trivia question. Answering correctly boosts the score.
2.  **Multiplayer Mode**: Up to 10 players can join a room, sync their start time, and compete for the high score on a live leaderboard.

## 📂 Project Structure

This project consists of two main parts:

1.  **Frontend (Root Directory)**: A React + TypeScript application that renders the game using HTML5 Canvas and handles user interaction.
2.  **Backend (`/dka-server` Directory)**: A lightweight Node.js + Socket.io server that manages game rooms, synchronizes timers, and broadcasts player scores.

## 🚀 Quick Start Guide

### 1. Start the Backend
The multiplayer features require the backend to be running.
```bash
cd dka-server
npm install
npm start
# Server runs on http://localhost:3001
```

### 2. Start the Frontend
In a new terminal window, go to the project root:
```bash
# Install dependencies (if using a local setup)
npm install

# Run the development server
npm run dev
```

---

## 🛠 Tech Stack
*   **Frontend**: React 19, TypeScript, Tailwind CSS, HTML5 Canvas.
*   **Backend**: Node.js, Express, Socket.io.
*   **Deployment**: 
    *   Frontend: Vercel / Netlify
    *   Backend: Render / Glitch

See `FRONTEND_README.md` and `dka-server/README.md` for detailed documentation on each part.
