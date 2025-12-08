
import { MultiPlayer } from '../types';
import { BACKEND_URL } from '../constants';

// We assume socket.io is loaded via CDN in index.html, exposing window.io
declare global {
  interface Window {
    io: any;
  }
}

export class MultiplayerClient {
  private socket: any = null;
  private onMessageCallback: (msg: any) => void;

  constructor(onMessage: (msg: any) => void) {
    this.onMessageCallback = onMessage;
  }

  connect(roomId: string, playerId: string, playerName: string) {
    if (!window.io) {
        console.error("Socket.io not found. Make sure the CDN script is in index.html");
        return;
    }

    if (this.socket) {
        this.socket.disconnect();
    }

    // Connect to the backend server
    console.log("Connecting to:", BACKEND_URL);
    this.socket = window.io(BACKEND_URL);

    this.socket.on('connect', () => {
        console.log("Connected to server", this.socket.id);
        this.onMessageCallback({ type: 'CONNECTED' });
        // Join the room immediately after connecting
        this.socket.emit('join_room', { roomId, name: playerName });
    });

    this.socket.on('connect_error', (err: any) => {
        console.error("Connection failed", err);
        // Render free tier might be waking up, retries happen automatically usually, 
        // but we can warn the user if it takes too long.
    });

    // Listen for room updates (player joined, left, ready state changed)
    this.socket.on('room_update', (players: MultiPlayer[]) => {
        // Find our new ID if it changed (server assigns socket ID as player ID)
        // logic is handled in the callback
        this.onMessageCallback({ type: 'ROOM_UPDATE', payload: players, mySocketId: this.socket.id });
    });

    // Listen for game start
    this.socket.on('start_game', (data: { startTime: number }) => {
        this.onMessageCallback({ type: 'START_GAME', payload: data });
    });

    // Listen for individual player updates (score/status)
    this.socket.on('player_updated', (player: MultiPlayer) => {
        this.onMessageCallback({ type: 'PLAYER_UPDATED', payload: player });
    });

    this.socket.on('error_msg', (msg: string) => {
        alert(msg);
    });
  }

  toggleReady(roomId: string) {
    if (!this.socket) return;
    this.socket.emit('toggle_ready', roomId);
  }

  startGame(roomId: string) {
    if (!this.socket) return;
    this.socket.emit('start_game', roomId);
  }

  updateState(roomId: string, score: number, status: 'ALIVE' | 'DEAD' | 'FINISHED') {
    if (!this.socket) return;
    this.socket.emit('update_player', { roomId, score, status });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
