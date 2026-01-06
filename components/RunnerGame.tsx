
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameStatus, Player, Platform, Obstacle, Coin, MultiPlayer, Particle, Ghost } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS, PLAYER_SIZE, DURATION_SECONDS, COLORS, GAME_CONFIG, VISUALS, GAME_TEXT, SPAWN_CONFIG, OBSTACLE_SIZE } from '../constants';
import { QUIZ_DATA, Question } from '../quizData';
import { MultiplayerClient } from '../utils/multiplayer';

interface UiState {
  score: number;
  timeLeft: number;
  status: GameStatus;
  activeQuiz: Question | null;
  quizTimeLeft: number; 
  // Multiplayer UI
  roomId: string;
  playerName: string;
  players: MultiPlayer[];
  myId: string;
  isConnecting: boolean;
  showJumpHint: boolean;
  // Removed returnTimer
}

// Global fixed room for the "One Room" requirement
const GLOBAL_ROOM_ID = "TEAM_ARENA_01";

const RunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Multiplayer Client Ref
  const mpClientRef = useRef<MultiplayerClient | null>(null);
  const mpStartTimeRef = useRef<number | null>(null);

  // Game State Refs
  const gameStateRef = useRef({
    status: GameStatus.IDLE,
    timeLeft: DURATION_SECONDS,
    score: 0,
    speed: PHYSICS.INITIAL_SPEED,
    distanceTraveled: 0,
    mode: 'SINGLE' as 'SINGLE' | 'MULTI',
    frameCount: 0,
    lastSpawnX: 0, // Track where the next entity should spawn
    lastEntityWasPit: false, // Prevents consecutive pits (Fix for "Super Wide Pits")
  });

  const playerRef = useRef<Player>({
    x: 100,
    y: PHYSICS.GroundLevel - PLAYER_SIZE.height,
    width: PLAYER_SIZE.width,
    height: PLAYER_SIZE.height,
    vy: 0,
    isJumping: false,
    color: COLORS.PLAYER,
    lives: GAME_CONFIG.MAX_LIVES,
    invulnerableUntil: 0
  });

  const platformsRef = useRef<Platform[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const ghostsRef = useRef<Ghost[]>([]);
  
  // React State
  const [uiState, setUiState] = useState<UiState>({
    score: 0,
    timeLeft: DURATION_SECONDS,
    status: GameStatus.IDLE,
    activeQuiz: null,
    quizTimeLeft: 10,
    roomId: GLOBAL_ROOM_ID,
    playerName: '',
    players: [],
    myId: '',
    isConnecting: false,
    showJumpHint: false
  });

  // Lobby Step State: 'MENU' | 'NAME_INPUT'
  const [lobbyStep, setLobbyStep] = useState<'MENU' | 'NAME_INPUT'>('MENU');

  // --- Sound Effects ---
  const playSound = (type: 'jump' | 'coin' | 'special' | 'hit' | 'win' | 'shield_break') => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    switch (type) {
      case 'jump':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        break;
      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.setValueAtTime(2000, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        break;
      case 'special':
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        break;
      case 'hit':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        break;
      case 'shield_break':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        break;
      case 'win':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1);
        osc.frequency.setValueAtTime(659, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.5);
        break;
    }
    osc.start();
    osc.stop(now + (type === 'win' ? 1.5 : 0.3));
  };

  // --- Particle System ---
  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        particlesRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: color,
            size: Math.random() * 3 + 1
        });
    }
  };

  const updateParticles = () => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05; // Fade out speed
        if (p.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const updateGhosts = () => {
    // Add new ghost periodically
    if (gameStateRef.current.frameCount % VISUALS.GHOST_INTERVAL === 0 && gameStateRef.current.status === GameStatus.PLAYING) {
        const p = playerRef.current;
        // Only spawn ghost if moving fast or jumping
        if (gameStateRef.current.speed > 0) {
            ghostsRef.current.push({
                x: p.x,
                y: p.y,
                width: p.width,
                height: p.height,
                alpha: 0.5,
                color: p.color
            });
        }
    }
    // Update existing ghosts
    for (let i = ghostsRef.current.length - 1; i >= 0; i--) {
        const g = ghostsRef.current[i];
        g.x -= gameStateRef.current.speed; // Move with world
        g.alpha -= 0.03;
        if (g.alpha <= 0) ghostsRef.current.splice(i, 1);
    }
  };

  // --- Multiplayer Logic ---
  const handleMpMessage = useCallback((msg: any) => {
    if (msg.type === 'CONNECTED') {
        // Just updated connection status
    } else if (msg.type === 'ROOM_UPDATE') {
        setUiState(prev => {
            const newId = msg.mySocketId || prev.myId;
            
            // CRITICAL FIX: Only switch status to WAITING_ROOM if we are in the initial connection/lobby phase.
            // If we are already playing or in the leaderboard phase, getting a ROOM_UPDATE (e.g. someone left) 
            // should NOT kick us back to the waiting room.
            let nextStatus = prev.status;
            if (prev.status === GameStatus.IDLE || prev.status === GameStatus.WAITING_ROOM || prev.isConnecting) {
                nextStatus = GameStatus.WAITING_ROOM;
            }

            return { 
                ...prev, 
                players: msg.payload, 
                myId: newId,
                status: nextStatus,
                isConnecting: false 
            };
        });
    } else if (msg.type === 'PLAYER_UPDATED') {
        const updatedPlayer = msg.payload;
        setUiState(prev => ({
            ...prev,
            players: prev.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
        }));
    } else if (msg.type === 'START_GAME') {
      mpStartTimeRef.current = msg.payload.startTime;
      startGame('MULTI');
    } else if (msg.type === 'FORCE_GAME_OVER') {
      gameStateRef.current.status = GameStatus.LEADERBOARD;
      // Received final signal from server: All players are done.
      // Now we show the leaderboard. No auto-return timer.
      setUiState(prev => ({
          ...prev,
          players: msg.payload,
          status: GameStatus.LEADERBOARD
      }));
    }
  }, []);

  useEffect(() => {
    mpClientRef.current = new MultiplayerClient(handleMpMessage);
    return () => {
        mpClientRef.current?.disconnect();
    };
  }, [handleMpMessage]);

  const joinRoom = () => {
    if (!uiState.playerName) return;
    setUiState(prev => ({
        ...prev,
        roomId: GLOBAL_ROOM_ID,
        isConnecting: true
    }));
    mpClientRef.current?.connect(GLOBAL_ROOM_ID, '', uiState.playerName);
  };

  const toggleReady = () => {
    mpClientRef.current?.toggleReady(uiState.roomId);
  };

  // --- Core Game Logic ---

  const startGame = (mode: 'SINGLE' | 'MULTI') => {
    const initialPlatWidth = GAME_WIDTH + 200;
    
    gameStateRef.current = {
      status: GameStatus.PLAYING,
      timeLeft: DURATION_SECONDS,
      score: 0,
      speed: PHYSICS.INITIAL_SPEED,
      distanceTraveled: 0,
      mode: mode,
      frameCount: 0,
      lastSpawnX: initialPlatWidth, // Initialize cursor
      lastEntityWasPit: false, // Reset logic for new game
    };

    playerRef.current = {
      x: 100,
      y: PHYSICS.GroundLevel - PLAYER_SIZE.height,
      width: PLAYER_SIZE.width,
      height: PLAYER_SIZE.height,
      vy: 0,
      isJumping: false,
      color: COLORS.PLAYER,
      lives: GAME_CONFIG.MAX_LIVES,
      invulnerableUntil: 0
    };

    platformsRef.current = [{ id: 1, x: 0, y: PHYSICS.GroundLevel, width: initialPlatWidth, height: GAME_HEIGHT - PHYSICS.GroundLevel }];
    obstaclesRef.current = [];
    coinsRef.current = [];
    particlesRef.current = [];
    ghostsRef.current = [];

    setUiState(prev => ({
      ...prev,
      score: 0,
      timeLeft: DURATION_SECONDS,
      status: GameStatus.PLAYING,
      activeQuiz: null,
      quizTimeLeft: 10,
      showJumpHint: true
    }));
  };

  const returnToMenu = useCallback(() => {
    // 1. Reset Internal Refs
    gameStateRef.current.status = GameStatus.IDLE;
    
    // 2. Disconnect Socket if active to prevent background updates
    if (mpClientRef.current) {
        mpClientRef.current.disconnect();
    }
    
    // 3. Completely Reset UI State to Initial Values
    setUiState({
        score: 0,
        timeLeft: DURATION_SECONDS,
        status: GameStatus.IDLE,
        activeQuiz: null,
        quizTimeLeft: 10,
        roomId: GLOBAL_ROOM_ID,
        playerName: '',
        players: [],
        myId: '',
        isConnecting: false,
        showJumpHint: false
    });
    
    // 4. Return to Menu Step
    setLobbyStep('MENU');
    
    // 5. Re-init socket client for next connection
    mpClientRef.current = new MultiplayerClient(handleMpMessage);

  }, [handleMpMessage]);

  const spawnEntities = () => {
    const buffer = GAME_WIDTH * 1.5;
    // Use the persistent cursor instead of calculating from the last platform
    let currentSpawnX = gameStateRef.current.lastSpawnX;

    while (currentSpawnX < GAME_WIDTH + buffer) {
      
      // NEW LOGIC (FIX):
      // Check the ABSOLUTE distance of where this new chunk will be placed.
      // If the world-distance is less than the distance a player runs in SAFE_ZONE_DURATION, it's safe.
      const absoluteSpawnX = gameStateRef.current.distanceTraveled + currentSpawnX;
      // 60 frames per second * speed * seconds = Total Safe Pixels
      const safeDistance = (GAME_CONFIG.MOVEMENT_SPEED * 60 * GAME_CONFIG.SAFE_ZONE_DURATION) + GAME_WIDTH;
      
      const isSafeZone = absoluteSpawnX < safeDistance;

      // LOGIC UPDATE: Use OBSTACLE_PROBABILITY to trigger a "Hazard".
      // If Hazard triggered, 50% chance it is a PIT, 50% chance it is a PLATFORM WITH OBSTACLES.
      const isHazard = !isSafeZone && Math.random() < SPAWN_CONFIG.OBSTACLE_PROBABILITY;
      
      // FIX FOR SUPER WIDE PITS: 
      // If the last entity was a pit, we MUST spawn a platform now.
      // We cannot allow consecutive pits.
      const mustBePlatform = gameStateRef.current.lastEntityWasPit;

      const isPit = !mustBePlatform && isHazard && Math.random() < 0.5;

      if (isPit) {
        // HAZARD TYPE 1: PIT (Gap)
        // STRICT CONTROL: 3 * Obstacle Width
        const gap = OBSTACLE_SIZE.width * 3; 
        currentSpawnX += gap;
        gameStateRef.current.lastEntityWasPit = true;
      } else {
        // HAZARD TYPE 2: PLATFORM (with potential obstacles) OR SAFE PLATFORM
        
        // Use SPAWN_CONFIG for platform width
        const platformWidth = SPAWN_CONFIG.MIN_PLATFORM_WIDTH + Math.random() * (SPAWN_CONFIG.MAX_PLATFORM_WIDTH - SPAWN_CONFIG.MIN_PLATFORM_WIDTH);
        const newPlatform: Platform = {
          id: Date.now() + Math.random(),
          x: currentSpawnX,
          y: PHYSICS.GroundLevel,
          width: platformWidth,
          height: GAME_HEIGHT - PHYSICS.GroundLevel
        };
        platformsRef.current.push(newPlatform);
        gameStateRef.current.lastEntityWasPit = false;
        
        const availableWidth = platformWidth - 100;
        const startX = currentSpawnX + 50;
        const addedObstacles: Obstacle[] = [];

        // Obstacle Spawning Logic
        // If isHazard is true (and it wasn't a pit), then we MUST spawn obstacles here to satisfy the hazard condition.
        if (isHazard) {
            const minObs = SPAWN_CONFIG.MIN_OBSTACLES_PER_PLATFORM;
            const maxObs = SPAWN_CONFIG.MAX_OBSTACLES_PER_PLATFORM;
            const numObs = Math.floor(Math.random() * (maxObs - minObs + 1)) + minObs;

            for(let k=0; k < numObs; k++) {
                 // Try to spread them out slightly if multiple
                 const obsX = startX + Math.random() * availableWidth;
                 
                 // Simple check to avoid stacking obstacles exactly on top of each other
                 const overlapsOther = addedObstacles.some(o => Math.abs(o.x - obsX) < 40);
                 
                 if (!overlapsOther) {
                     const obstacle: Obstacle = {
                        id: Date.now() + Math.random() + k,
                        x: obsX,
                        y: PHYSICS.GroundLevel - OBSTACLE_SIZE.height,
                        width: OBSTACLE_SIZE.width,
                        height: OBSTACLE_SIZE.height,
                        type: 'CRATE'
                      };
                      obstaclesRef.current.push(obstacle);
                      addedObstacles.push(obstacle);
                 }
            }
        }

        // Coins spawning logic using Config
        // Coins can appear on both Safe Platforms and Obstacle Platforms
        const numCoins = Math.floor(Math.random() * (SPAWN_CONFIG.MAX_COINS_PER_PLATFORM - SPAWN_CONFIG.MIN_COINS_PER_PLATFORM + 1)) + SPAWN_CONFIG.MIN_COINS_PER_PLATFORM;
        for(let i=0; i<numCoins; i++) {
          const coinW = 20;
          const coinH = 20;
          const coinX = startX + Math.random() * availableWidth;
          const coinY = PHYSICS.GroundLevel - 40 - (Math.random() * 80);

          const overlapsObstacle = addedObstacles.some(obs => 
            coinX < obs.x + obs.width + 20 &&
            coinX + coinW > obs.x - 20 &&
            coinY < obs.y + obs.height + 20 && 
            coinY + coinH > obs.y - 20
          );

          if (!overlapsObstacle) {
            const isSpecial = Math.random() < SPAWN_CONFIG.SPECIAL_COIN_CHANCE;
            coinsRef.current.push({
              id: Date.now() + Math.random() + i,
              x: coinX,
              y: coinY,
              width: coinW,
              height: coinH,
              collected: false,
              oscillationOffset: Math.random() * Math.PI * 2,
              type: isSpecial ? 'SPECIAL' : 'NORMAL'
            });
          }
        }
        currentSpawnX += platformWidth;
      }
    }
    // Update the state ref with the new cursor position
    gameStateRef.current.lastSpawnX = currentSpawnX;
  };

  const handleQuizAnswer = (index: number) => {
    // index -1 represents timeout
    if (index !== -1 && !uiState.activeQuiz) return;
    
    let isCorrect = false;
    if (uiState.activeQuiz && index === uiState.activeQuiz.correctAnswer) {
        isCorrect = true;
    }
    
    if (isCorrect) {
      gameStateRef.current.score += 5;
      spawnParticles(playerRef.current.x, playerRef.current.y, '#00ff00', 20);
      playSound('win');
    } else {
      playSound('hit');
    }

    gameStateRef.current.status = GameStatus.PLAYING;
    setUiState(prev => ({
      ...prev,
      score: gameStateRef.current.score,
      status: GameStatus.PLAYING,
      activeQuiz: null
    }));
  };

  // --- Quiz Timer ---
  useEffect(() => {
    let timer: number | null = null;
    if (uiState.status === GameStatus.QUIZ) {
        timer = window.setInterval(() => {
            setUiState(prev => {
                if (prev.quizTimeLeft <= 1) {
                    handleQuizAnswer(-1); 
                    return { ...prev, quizTimeLeft: 0 };
                }
                return { ...prev, quizTimeLeft: prev.quizTimeLeft - 1 };
            });
        }, 1000);
    }
    return () => {
        if (timer) clearInterval(timer);
    };
  }, [uiState.status]);

  const updatePhysics = () => {
    const player = playerRef.current;
    const game = gameStateRef.current;
    
    game.frameCount++;

    // Movement
    player.vy += PHYSICS.GRAVITY;
    player.y += player.vy;

    // Ground Collision
    if (player.vy >= 0) {
      let onGround = false;
      for (const plat of platformsRef.current) {
        if (
          player.x + player.width > plat.x &&
          player.x < plat.x + plat.width &&
          player.y + player.height >= plat.y &&
          player.y + player.height <= plat.y + 20 
        ) {
          onGround = true;
          player.y = plat.y - player.height;
          player.vy = 0;
          player.isJumping = false;
          break;
        }
      }
    }

    // Pit Fall
    if (player.y > GAME_HEIGHT) {
       if (player.lives > 1) {
           // Respawn mechanic: Deduct life, reset position to air, grant temporary invulnerability
           player.lives--;
           player.invulnerableUntil = Date.now() + 1500;
           player.y = PHYSICS.GroundLevel - 200; // Drop from above
           player.vy = 0;
           playSound('shield_break');
           spawnParticles(player.x, GAME_HEIGHT, COLORS.PLAYER_HIT, VISUALS.PARTICLE_COUNT_HIT);
       } else {
           // No lives left, game over
           playSound('hit');
           spawnParticles(player.x, player.y, COLORS.PLAYER_HIT, 30);
           handleDeath(false);
           return;
       }
    }

    // Move World
    const moveSpeed = game.speed;
    game.distanceTraveled += moveSpeed;
    game.lastSpawnX -= moveSpeed; // Move the spawn cursor along with the world

    platformsRef.current.forEach(p => p.x -= moveSpeed);
    obstaclesRef.current.forEach(o => o.x -= moveSpeed);
    coinsRef.current.forEach(c => c.x -= moveSpeed);

    platformsRef.current = platformsRef.current.filter(p => p.x + p.width > -100);
    obstaclesRef.current = obstaclesRef.current.filter(o => o.x + o.width > -100);
    coinsRef.current = coinsRef.current.filter(c => c.x + c.width > -100);

    // Check spawn based on the tracked cursor, not the last platform
    spawnEntities();

    // Obstacle Collision
    for (const obs of obstaclesRef.current) {
      const padding = 5;
      if (
        player.x + padding < obs.x + obs.width - padding &&
        player.x + player.width - padding > obs.x + padding &&
        player.y + padding < obs.y + obs.height &&
        player.y + player.height > obs.y + padding
      ) {
         // Check if invincible
         if (Date.now() < player.invulnerableUntil) {
             continue;
         }

         if (player.lives > 1) {
             // Lost a life but survived
             player.lives--;
             player.invulnerableUntil = Date.now() + 1500; // 1.5s Invulnerability
             playSound('shield_break');
             spawnParticles(player.x, player.y, COLORS.PLAYER_HIT, VISUALS.PARTICLE_COUNT_HIT);
             
             // Shake effect logic could go here (or screen flash in draw)
         } else {
             // Final death
             playSound('hit');
             spawnParticles(player.x, player.y, COLORS.PLAYER_HIT, 30);
             handleDeath(false);
             return;
         }
      }
    }

    // Coin Collection
    for (const coin of coinsRef.current) {
      if (!coin.collected &&
          player.x < coin.x + coin.width &&
          player.x + player.width > coin.x &&
          player.y < coin.y + coin.height &&
          player.y + player.height > coin.y
      ) {
        coin.collected = true;
        spawnParticles(coin.x, coin.y, coin.type === 'SPECIAL' ? COLORS.COIN_SPECIAL : COLORS.COIN, VISUALS.PARTICLE_COUNT_COIN);

        if (coin.type === 'SPECIAL') {
          playSound('special');
          const randomQuiz = QUIZ_DATA[Math.floor(Math.random() * QUIZ_DATA.length)];
          gameStateRef.current.status = GameStatus.QUIZ;
          setUiState(prev => ({ 
             ...prev, 
             status: GameStatus.QUIZ, 
             activeQuiz: randomQuiz,
             quizTimeLeft: 10 // Reset timer
          }));
          return; 
        } else {
          gameStateRef.current.score += 1;
          setUiState(prev => ({ ...prev, score: gameStateRef.current.score }));
          playSound('coin');
        }
      }
    }
  };

  const handleDeath = (instant: boolean) => {
    playerRef.current.lives = 0;
    
    if (gameStateRef.current.mode === 'MULTI') {
        gameStateRef.current.status = GameStatus.WAITING_RESULTS;
        setUiState(prev => {
             // Notify server
             mpClientRef.current?.updateState(prev.roomId, gameStateRef.current.score, 'DEAD');
             return { ...prev, status: GameStatus.WAITING_RESULTS };
        });
    } else {
        gameStateRef.current.status = GameStatus.GAME_OVER;
        setUiState(prev => ({ ...prev, status: GameStatus.GAME_OVER }));
    }
  };

  const handleVictory = () => {
    playSound('win');
    if (gameStateRef.current.mode === 'MULTI') {
         gameStateRef.current.status = GameStatus.WAITING_RESULTS;
         setUiState(prev => {
            mpClientRef.current?.updateState(prev.roomId, gameStateRef.current.score, 'FINISHED');
            return { ...prev, status: GameStatus.WAITING_RESULTS };
        });
    } else {
        gameStateRef.current.status = GameStatus.VICTORY;
        setUiState(prev => ({ ...prev, status: GameStatus.VICTORY }));
    }
  };

  const tick = useCallback((time: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const currentGameMode = gameStateRef.current.mode;
    
    // --- TIMER LOGIC ---
    if (currentGameMode === 'MULTI' && mpStartTimeRef.current) {
         if (Date.now() < mpStartTimeRef.current) {
             // Countdown
         } else {
             const elapsed = (Date.now() - mpStartTimeRef.current) / 1000;
             const remaining = DURATION_SECONDS - elapsed;
             
             if (remaining <= 0) {
                gameStateRef.current.timeLeft = 0;
                
                // If the player is still active when time runs out, they win the survival leg
                if (gameStateRef.current.status === GameStatus.PLAYING || gameStateRef.current.status === GameStatus.QUIZ) {
                    handleVictory(); 
                }
                
                // CRITICAL FIX: In Multiplayer, do NOT transition to LEADERBOARD locally based on time.
                // We stay in WAITING_RESULTS until the server sends 'FORCE_GAME_OVER' (meaning ALL players are done).
             } else {
                gameStateRef.current.timeLeft = remaining;
             }
         }
    } else if (currentGameMode === 'SINGLE' && gameStateRef.current.status === GameStatus.PLAYING) {
         gameStateRef.current.timeLeft -= 1/60;
         if (gameStateRef.current.timeLeft <= 0) {
            gameStateRef.current.timeLeft = 0;
            handleVictory();
         }
    }

    // --- BROADCAST SCORE ---
    if (currentGameMode === 'MULTI' && gameStateRef.current.status === GameStatus.PLAYING) {
        if (Math.random() < 0.05) { 
             const currentScore = gameStateRef.current.score;
             setUiState(prev => {
                mpClientRef.current?.updateState(prev.roomId, currentScore, 'ALIVE');
                return prev;
             });
        }
    }

    // --- GAME LOOP ---
    if (gameStateRef.current.status === GameStatus.PLAYING) {
      updatePhysics();
      updateParticles();
      updateGhosts();
    }
    
    const integerTime = Math.ceil(gameStateRef.current.timeLeft);
    if (integerTime !== Math.ceil(uiState.timeLeft) && integerTime >= 0) {
        setUiState(prev => ({ ...prev, timeLeft: gameStateRef.current.timeLeft }));
    }

    draw(ctx, time / 16);
    requestRef.current = requestAnimationFrame(tick);
  }, [uiState.timeLeft]); 

  // Draw Function
  const draw = (ctx: CanvasRenderingContext2D, frameCount: number) => {
    // 1. Clear & Background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, COLORS.SKY_TOP);
    gradient.addColorStop(1, COLORS.SKY_BOTTOM);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Grid
    ctx.strokeStyle = COLORS.GRID_LINES;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = PHYSICS.GroundLevel; i < GAME_HEIGHT; i += 20) {
       ctx.moveTo(0, i);
       ctx.lineTo(GAME_WIDTH, i);
    }
    const offsetX = Math.floor(gameStateRef.current.distanceTraveled * 0.5) % 50;
    for (let i = -offsetX; i < GAME_WIDTH; i += 50) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, GAME_HEIGHT);
    }
    ctx.stroke();

    // 3. Ground
    platformsRef.current.forEach(plat => {
      ctx.fillStyle = COLORS.GROUND;
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.GROUND_NEON;
      ctx.fillStyle = COLORS.GROUND_NEON;
      ctx.fillRect(plat.x, plat.y, plat.width, 3);
      ctx.shadowBlur = 0;
    });

    // 4. Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.fillStyle = COLORS.OBSTACLE;
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.OBSTACLE_NEON;
      ctx.strokeStyle = COLORS.OBSTACLE_NEON;
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y);
      ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
      ctx.moveTo(obs.x + obs.width, obs.y);
      ctx.lineTo(obs.x, obs.y + obs.height);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // 5. Coins
    coinsRef.current.forEach(coin => {
      if (coin.collected) return;
      const bounce = Math.sin(frameCount * 0.1 + coin.oscillationOffset) * 5;
      const cy = coin.y + coin.height/2 + bounce;
      const cx = coin.x + coin.width/2;
      const isSpecial = coin.type === 'SPECIAL';
      const color = isSpecial ? COLORS.COIN_SPECIAL : COLORS.COIN;
      const glow = isSpecial ? COLORS.COIN_SPECIAL_GLOW : COLORS.COIN_GLOW;
      ctx.shadowBlur = 15;
      ctx.shadowColor = glow;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, coin.width/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px "Courier New"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isSpecial ? '?' : '1', cx, cy);
    });

    // 6. Ghosts (Afterimages)
    ghostsRef.current.forEach(g => {
        ctx.globalAlpha = g.alpha;
        ctx.fillStyle = g.color;
        ctx.fillRect(g.x, g.y, g.width, g.height);
        ctx.globalAlpha = 1.0;
    });

    // 7. Particles
    particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // 8. Player
    const p = playerRef.current;
    if (gameStateRef.current.status !== GameStatus.WAITING_RESULTS && gameStateRef.current.status !== GameStatus.GAME_OVER) {
         
         // Invulnerability blinking
         const isInvincible = Date.now() < p.invulnerableUntil;
         if (isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
             // Don't draw this frame for blink effect (strobe)
         } else {
             // Draw Player
             let drawH = p.height;
             let drawW = p.width;
             if (p.isJumping) {
                drawH = p.height * 0.9;
                drawW = p.width * 0.9;
             }
             ctx.shadowBlur = 20;
             ctx.shadowColor = COLORS.PLAYER_GLOW;
             // Flash white if recently hit
             ctx.fillStyle = (isInvincible && Math.floor(Date.now() / 50) % 2 === 0) ? '#fff' : COLORS.PLAYER; 
             ctx.fillRect(p.x, p.y, drawW, drawH);
             ctx.shadowBlur = 0;
             ctx.fillStyle = '#fff';
             ctx.fillRect(p.x + drawW - 8, p.y + 6, 6, 4);
         }
    }
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  const performJump = useCallback(() => {
    if (gameStateRef.current.status === GameStatus.PLAYING) {
      if (!playerRef.current.isJumping) {
        playerRef.current.vy = PHYSICS.JUMP_FORCE;
        playerRef.current.isJumping = true;
        playSound('jump');
        setUiState(prev => ({...prev, showJumpHint: false})); // Hide hint on first jump
        spawnParticles(playerRef.current.x + PLAYER_SIZE.width/2, playerRef.current.y + PLAYER_SIZE.height, COLORS.GROUND_NEON, VISUALS.PARTICLE_COUNT_JUMP);
      }
    }
  }, []);

  const handleScreenTap = (e: React.MouseEvent | React.TouchEvent) => {
    performJump();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); 
        performJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performJump]);

  const formatTime = (t: number) => Math.ceil(t);

  // Render Helpers
  const renderLobby = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
      <div className="text-center p-8 bg-[#0a0a12] border border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.2)] max-w-lg w-full">
         <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
            {GAME_TEXT.TITLE}
         </h1>
         <p className="text-gray-500 text-sm mb-8 tracking-widest">{GAME_TEXT.SUBTITLE}</p>
         
         {lobbyStep === 'MENU' && (
             <div className="flex flex-col gap-6 items-center">
                 <button 
                    onClick={() => setLobbyStep('NAME_INPUT')}
                    className="w-64 py-5 bg-gradient-to-r from-purple-900 to-purple-800 border-2 border-purple-500 hover:from-purple-800 hover:to-purple-700 hover:scale-105 text-white font-black text-xl tracking-widest transition-all shadow-lg shadow-purple-900/50 skew-x-[-10deg]"
                 >
                    {GAME_TEXT.BTN_JOIN}
                 </button>
                 
                 <button 
                    onClick={() => startGame('SINGLE')}
                    className="w-40 py-2 bg-transparent border border-gray-600 text-gray-400 hover:text-cyan-400 hover:border-cyan-400 font-mono text-sm transition-all uppercase"
                 >
                    {GAME_TEXT.BTN_SINGLE}
                 </button>
             </div>
         )}

         {lobbyStep === 'NAME_INPUT' && (
             <div className="flex flex-col gap-4">
                 {uiState.isConnecting ? (
                     <div className="p-8 border border-purple-500 bg-purple-900/20">
                        <p className="text-purple-400 font-mono animate-pulse text-lg mb-2">{GAME_TEXT.LOBBY_CONNECTING}</p>
                        <p className="text-gray-500 text-xs">(Free server might take up to 50s to wake up)</p>
                     </div>
                 ) : (
                    <div className="flex flex-col gap-4 animate-fadeIn">
                        <h3 className="text-cyan-200 text-sm tracking-widest text-left">{GAME_TEXT.LOBBY_ENTER_NAME}</h3>
                        <input 
                            type="text" 
                            placeholder="YOUR NAME" 
                            className="bg-black/50 border border-gray-600 text-white p-3 focus:border-cyan-500 outline-none font-mono text-center text-lg uppercase"
                            maxLength={10}
                            value={uiState.playerName}
                            onChange={(e) => setUiState(prev => ({...prev, playerName: e.target.value}))}
                            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                            onMouseDown={(e) => e.stopPropagation()} 
                            onTouchStart={(e) => e.stopPropagation()}
                        />
                        <button 
                            onClick={joinRoom}
                            disabled={!uiState.playerName}
                            className="px-6 py-3 bg-cyan-900/40 border border-cyan-500 hover:bg-cyan-500 hover:text-black text-cyan-400 font-bold transition-all uppercase disabled:opacity-50 mt-2"
                        >
                            {GAME_TEXT.BTN_ENTER_WAITING}
                        </button>
                        <button 
                            onClick={() => setLobbyStep('MENU')}
                            className="text-gray-600 hover:text-white text-xs mt-4 underline"
                        >
                            {GAME_TEXT.BTN_BACK}
                        </button>
                    </div>
                 )}
             </div>
         )}
      </div>
    </div>
  );

  const renderWaitingRoom = () => {
    const me = uiState.players.find(p => p.id === uiState.myId);
    const hasEnoughPlayers = uiState.players.length === GAME_CONFIG.REQUIRED_PLAYERS;
    
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30">
            <div className="w-full max-w-2xl bg-[#0f0f1a] border border-cyan-500 p-8">
                <div className="flex justify-between items-end border-b border-gray-700 pb-2 mb-6">
                    <h2 className="text-2xl text-cyan-400 font-bold tracking-widest">
                        {GAME_TEXT.WAITING_TITLE}
                    </h2>
                    <span className={`font-mono text-lg ${hasEnoughPlayers ? 'text-green-500' : 'text-yellow-500'}`}>
                        {uiState.players.length} / {GAME_CONFIG.REQUIRED_PLAYERS} AGENTS
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {uiState.players.map(p => (
                        <div key={p.id} className={`p-4 border ${p.isReady ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-900'} flex justify-between items-center transition-all`}>
                            <span className="text-white font-mono">{p.name} {p.id === uiState.myId ? '(YOU)' : ''}</span>
                            <span className={`text-xs px-2 py-1 ${p.isReady ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                {p.isReady ? 'READY' : 'WAITING'}
                            </span>
                        </div>
                    ))}
                    {[...Array(Math.max(0, GAME_CONFIG.REQUIRED_PLAYERS - uiState.players.length))].map((_, i) => (
                        <div key={i} className="p-4 border border-gray-800 bg-black/50 opacity-50 flex items-center justify-center text-gray-600 text-sm animate-pulse">
                            {GAME_TEXT.WAITING_STATUS}
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center">
                    <button onClick={returnToMenu} className="text-red-500 hover:text-red-400 underline text-sm">{GAME_TEXT.BTN_ABORT}</button>
                    <div className="flex flex-col items-end gap-2">
                        <button 
                            onClick={toggleReady}
                            className={`px-8 py-3 font-bold border ${me?.isReady ? 'bg-gray-800 text-gray-400 border-gray-600' : 'bg-green-600 text-black border-green-500 hover:bg-green-500'}`}
                        >
                            {me?.isReady ? GAME_TEXT.BTN_CANCEL : GAME_TEXT.BTN_READY}
                        </button>
                        <p className="text-xs text-gray-500 font-mono mt-2 text-right max-w-xs">
                             GAME STARTS AUTOMATICALLY WHEN ALL {GAME_CONFIG.REQUIRED_PLAYERS} PLAYERS ARE READY
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderLeaderboard = () => {
     const sortedPlayers = [...uiState.players].sort((a, b) => b.score - a.score);
     
     return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-40 backdrop-blur-md">
            <div className="w-full max-w-lg bg-[#0a0a12] border-2 border-yellow-500 p-8 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-3xl text-yellow-400 font-black tracking-widest">{GAME_TEXT.LEADERBOARD_TITLE}</h2>
                    <div className="text-right">
                        {/* Auto Return Display Removed */}
                    </div>
                </div>
                
                <div className="space-y-2 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {sortedPlayers.map((p, idx) => (
                        <div key={p.id} className={`flex items-center p-3 border-b border-gray-800 ${idx === 0 ? 'bg-yellow-900/20' : ''}`}>
                            <div className="w-10 text-xl font-bold text-gray-500">#{idx + 1}</div>
                            <div className="flex-1 text-white font-mono text-lg">{p.name} {p.id === uiState.myId ? '(YOU)' : ''}</div>
                            <div className="text-yellow-400 font-bold text-xl">{p.score} <span className="text-xs text-yellow-600">pts</span></div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-4">
                    <button onClick={returnToMenu} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold border border-gray-600 w-full uppercase">
                        {GAME_TEXT.BTN_MENU}
                    </button>
                </div>
            </div>
        </div>
     );
  };

  return (
    <div 
        className="relative w-full h-full flex justify-center items-center bg-[#02020a] overflow-hidden select-none font-[Orbitron]"
        onMouseDown={handleScreenTap}
        onTouchStart={handleScreenTap}
    >
      {/* HUD */}
      {(gameStateRef.current.status === GameStatus.PLAYING || gameStateRef.current.status === GameStatus.QUIZ || gameStateRef.current.status === GameStatus.WAITING_RESULTS) && (
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
            <div className="flex flex-col gap-1">
                <div className="bg-black/80 px-6 py-2 border-l-4 border-yellow-400 transform skew-x-[-10deg]">
                    <span className="text-2xl text-yellow-400 font-bold -skew-x-[10deg]">{uiState.score} <span className="text-sm">bits</span></span>
                </div>
                {/* Lives Indicator (New Feature) */}
                <div className="flex gap-1 ml-2 mt-1 transform skew-x-[-10deg]">
                    {[...Array(GAME_CONFIG.MAX_LIVES)].map((_, i) => (
                        <div key={i} className={`w-6 h-2 border border-red-500 transition-all duration-300 ${i < playerRef.current.lives ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-transparent opacity-30'}`} />
                    ))}
                </div>
            </div>
            
            {/* OTHER PLAYERS SCORE DISPLAY REMOVED */}

            <div className={`bg-black/80 px-6 py-2 border-r-4 ${uiState.timeLeft <= 5 ? 'border-red-500 animate-pulse' : 'border-cyan-500'} transform skew-x-[10deg]`}>
                <span className={`text-2xl font-bold skew-x-[-10deg] ${uiState.timeLeft <= 5 ? 'text-red-500' : 'text-cyan-400'}`}>
                    {formatTime(uiState.timeLeft)}s
                </span>
            </div>
        </div>
      )}
      
      {/* Jump Hint Overlay (New Feature) */}
      {uiState.showJumpHint && gameStateRef.current.status === GameStatus.PLAYING && (
          <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="text-cyan-400 font-bold text-2xl tracking-widest animate-pulse border-l-4 border-cyan-400 pl-4 bg-black/40 p-2 backdrop-blur-sm">
                  {GAME_TEXT.HINT_JUMP}
              </div>
          </div>
      )}

      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="bg-black shadow-[0_0_40px_rgba(0,243,255,0.15)] rounded-sm border border-[#1a1a3a] max-w-full max-h-full"
        style={{ width: '100%', height: 'auto', maxWidth: '800px', aspectRatio: '2/1' }}
      />

      {/* States */}
      {uiState.status === GameStatus.IDLE && renderLobby()}
      {uiState.status === GameStatus.WAITING_ROOM && renderWaitingRoom()}
      {uiState.status === GameStatus.LEADERBOARD && renderLeaderboard()}

      {uiState.status === GameStatus.WAITING_RESULTS && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
              <div className="text-center">
                  <h2 className="text-2xl text-gray-400 animate-pulse mb-2">{GAME_TEXT.MSG_SYNC}</h2>
                  <p className="text-gray-600">{GAME_TEXT.MSG_WAIT_OTHERS}</p>
                  <p className="text-cyan-500 text-4xl mt-4 font-bold">{Math.ceil(uiState.timeLeft)}s</p>
              </div>
          </div>
      )}

      {/* Single Player Game Over/Victory screens */}
      {(uiState.status === GameStatus.GAME_OVER || uiState.status === GameStatus.VICTORY) && gameStateRef.current.mode === 'SINGLE' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
          <div className={`text-center p-8 bg-black/90 border-2 ${uiState.status === GameStatus.VICTORY ? 'border-yellow-400' : 'border-red-600'} shadow-lg max-w-md w-full`}>
            <h2 className={`text-5xl font-black mb-4 ${uiState.status === GameStatus.VICTORY ? 'text-yellow-400' : 'text-red-600'}`}>
                {uiState.status === GameStatus.VICTORY ? GAME_TEXT.VICTORY : GAME_TEXT.GAME_OVER}
            </h2>
            <div className="text-3xl font-bold mb-8 text-white">SCORE: {uiState.score}</div>
            <div className="flex flex-col gap-4">
                <button onClick={() => startGame('SINGLE')} className="px-8 py-3 bg-gray-700 hover:bg-white hover:text-black text-white font-bold transition-all uppercase">{GAME_TEXT.BTN_RETRY}</button>
                <button onClick={returnToMenu} className="px-8 py-3 border border-gray-600 text-gray-400 hover:text-white transition-all uppercase">{GAME_TEXT.BTN_MENU}</button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {uiState.status === GameStatus.QUIZ && uiState.activeQuiz && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30 backdrop-blur-md" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
          <div className="w-full max-w-lg bg-[#050510] border border-green-500/50 p-6 relative">
             <div className="flex justify-between items-center border-b border-green-900/50 pb-2 mb-4">
                <div className="text-xs text-gray-500">ENCRYPTED DATA FOUND</div>
                <div className={`font-mono text-xl font-bold ${uiState.quizTimeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                    00:{uiState.quizTimeLeft.toString().padStart(2, '0')}
                </div>
             </div>
             
             <p className="text-lg text-green-100 font-mono mb-6 mt-4">{">"} {uiState.activeQuiz.question}</p>
             <div className="grid grid-cols-1 gap-3">
                {uiState.activeQuiz.options.map((option: string, idx: number) => (
                  <button key={idx} onClick={() => handleQuizAnswer(idx)} className="p-3 text-left bg-green-900/10 border border-green-500/30 hover:bg-green-500/20 text-green-300 font-mono transition-colors">
                    {option}
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunnerGame;
