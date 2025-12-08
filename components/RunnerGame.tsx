
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameStatus, Player, Platform, Obstacle, Coin, MultiPlayer } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS, PLAYER_SIZE, DURATION_SECONDS, COLORS } from '../constants';
import { QUIZ_DATA, Question } from '../quizData';
import { MultiplayerClient } from '../utils/multiplayer';

interface UiState {
  score: number;
  timeLeft: number;
  status: GameStatus;
  activeQuiz: Question | null;
  quizTimeLeft: number; // Added for quiz timer
  // Multiplayer UI
  roomId: string;
  playerName: string;
  players: MultiPlayer[];
  myId: string;
  isConnecting: boolean;
}

// Global fixed room for the "One Room" requirement
const GLOBAL_ROOM_ID = "TEAM_ARENA_01";
const REQUIRED_PLAYERS = 10;

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
  });

  const playerRef = useRef<Player>({
    x: 100,
    y: PHYSICS.GroundLevel - PLAYER_SIZE.height,
    width: PLAYER_SIZE.width,
    height: PLAYER_SIZE.height,
    vy: 0,
    isJumping: false,
    color: COLORS.PLAYER,
  });

  const platformsRef = useRef<Platform[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  
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
    isConnecting: false
  });

  // Lobby Step State: 'MENU' | 'NAME_INPUT'
  const [lobbyStep, setLobbyStep] = useState<'MENU' | 'NAME_INPUT'>('MENU');

  // --- Sound Effects ---
  const playSound = (type: 'jump' | 'coin' | 'special' | 'hit' | 'win') => {
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

    if (type === 'jump') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start();
      osc.stop(now + 0.15);
    } else if (type === 'coin') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.setValueAtTime(2000, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start();
      osc.stop(now + 0.1);
    } else if (type === 'special') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start();
      osc.stop(now + 0.25);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start();
      osc.stop(now + 0.3);
    } else if (type === 'win') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.1);
      osc.frequency.setValueAtTime(659, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);
      osc.start();
      osc.stop(now + 1.5);
    }
  };

  // --- Multiplayer Logic ---
  const handleMpMessage = useCallback((msg: any) => {
    
    if (msg.type === 'CONNECTED') {
        // Just updated connection status, actual room join happens next
    } else if (msg.type === 'ROOM_UPDATE') {
        setUiState(prev => {
            const newId = msg.mySocketId || prev.myId;
            return { 
                ...prev, 
                players: msg.payload, 
                myId: newId,
                status: GameStatus.WAITING_ROOM,
                isConnecting: false // Connected and joined
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
        roomId: GLOBAL_ROOM_ID, // Enforce global room
        isConnecting: true
    }));

    mpClientRef.current?.connect(GLOBAL_ROOM_ID, '', uiState.playerName);
  };

  const toggleReady = () => {
    mpClientRef.current?.toggleReady(uiState.roomId);
  };

  const tryStartMultiplayer = () => {
    mpClientRef.current?.startGame(uiState.roomId);
  };

  // --- Core Game Logic ---

  const startGame = (mode: 'SINGLE' | 'MULTI') => {
    gameStateRef.current = {
      status: GameStatus.PLAYING,
      timeLeft: DURATION_SECONDS,
      score: 0,
      speed: PHYSICS.INITIAL_SPEED,
      distanceTraveled: 0,
      mode: mode,
    };

    playerRef.current = {
      x: 100,
      y: PHYSICS.GroundLevel - PLAYER_SIZE.height,
      width: PLAYER_SIZE.width,
      height: PLAYER_SIZE.height,
      vy: 0,
      isJumping: false,
      color: COLORS.PLAYER,
    };

    platformsRef.current = [{ id: 1, x: 0, y: PHYSICS.GroundLevel, width: GAME_WIDTH + 200, height: GAME_HEIGHT - PHYSICS.GroundLevel }];
    obstaclesRef.current = [];
    coinsRef.current = [];

    setUiState(prev => ({
      ...prev,
      score: 0,
      timeLeft: DURATION_SECONDS,
      status: GameStatus.PLAYING,
      activeQuiz: null,
      quizTimeLeft: 10
    }));
  };

  const returnToMenu = () => {
    gameStateRef.current.status = GameStatus.IDLE;
    setUiState(prev => ({ ...prev, status: GameStatus.IDLE, activeQuiz: null, players: [], isConnecting: false, playerName: '' }));
    setLobbyStep('MENU');
    mpClientRef.current?.disconnect();
  };

  const spawnEntities = (lastPlatformX: number) => {
    const buffer = GAME_WIDTH * 1.5;
    let currentRightmostX = lastPlatformX;

    while (currentRightmostX < GAME_WIDTH + buffer) {
      const isPit = Math.random() > 0.8; 
      
      if (isPit) {
        // Reduced pit size to be strictly within jump range
        // Max jump distance approx 240px. 
        // Old: 120 + 60 = 180.
        // New: 80 + 50 = 130 max. Safer.
        currentRightmostX += 80 + Math.random() * 50; 
      } else {
        const platformWidth = 300 + Math.random() * 500;
        const newPlatform: Platform = {
          id: Date.now() + Math.random(),
          x: currentRightmostX,
          y: PHYSICS.GroundLevel,
          width: platformWidth,
          height: GAME_HEIGHT - PHYSICS.GroundLevel
        };
        platformsRef.current.push(newPlatform);
        
        const availableWidth = platformWidth - 100;
        const startX = currentRightmostX + 50;
        const addedObstacles: Obstacle[] = [];

        if (Math.random() > 0.3) {
          const obsX = startX + Math.random() * availableWidth;
          const obstacle: Obstacle = {
            id: Date.now() + Math.random(),
            x: obsX,
            y: PHYSICS.GroundLevel - 40,
            width: 30,
            height: 40,
            type: 'CRATE'
          };
          obstaclesRef.current.push(obstacle);
          addedObstacles.push(obstacle);
        }

        const numCoins = Math.floor(Math.random() * 3);
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
            const isSpecial = Math.random() < 0.4;
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
        currentRightmostX += platformWidth;
      }
    }
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
                    // Time is up!
                    handleQuizAnswer(-1); // Pass -1 to indicate timeout
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
      handleDeath();
      return;
    }

    // Move World
    const moveSpeed = game.speed;
    game.distanceTraveled += moveSpeed;

    platformsRef.current.forEach(p => p.x -= moveSpeed);
    obstaclesRef.current.forEach(o => o.x -= moveSpeed);
    coinsRef.current.forEach(c => c.x -= moveSpeed);

    platformsRef.current = platformsRef.current.filter(p => p.x + p.width > -100);
    obstaclesRef.current = obstaclesRef.current.filter(o => o.x + o.width > -100);
    coinsRef.current = coinsRef.current.filter(c => c.x + c.width > -100);

    const lastPlatform = platformsRef.current[platformsRef.current.length - 1];
    if (lastPlatform) {
      spawnEntities(lastPlatform.x + lastPlatform.width);
    }

    // Obstacle Collision
    for (const obs of obstaclesRef.current) {
      const padding = 5;
      if (
        player.x + padding < obs.x + obs.width - padding &&
        player.x + player.width - padding > obs.x + padding &&
        player.y + padding < obs.y + obs.height &&
        player.y + player.height > obs.y + padding
      ) {
        playSound('hit');
        handleDeath();
        return;
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

  const handleDeath = () => {
    playSound('hit');
    
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
         // Wait for start time
         if (Date.now() < mpStartTimeRef.current) {
             // Countdown logic could go here
         } else {
             const elapsed = (Date.now() - mpStartTimeRef.current) / 1000;
             const remaining = DURATION_SECONDS - elapsed;
             
             if (remaining <= 0) {
                gameStateRef.current.timeLeft = 0;
                if (gameStateRef.current.status === GameStatus.PLAYING || gameStateRef.current.status === GameStatus.QUIZ) {
                    handleVictory(); 
                }
                if (gameStateRef.current.status !== GameStatus.LEADERBOARD) {
                    gameStateRef.current.status = GameStatus.LEADERBOARD;
                    setUiState(prev => ({ ...prev, status: GameStatus.LEADERBOARD }));
                }
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
                // We send update only if score changed is handled in updateState efficiency logic ideally
                // Here we just fire it
                mpClientRef.current?.updateState(prev.roomId, currentScore, 'ALIVE');
                return prev;
             });
        }
    }

    // --- GAME LOOP ---
    if (gameStateRef.current.status === GameStatus.PLAYING) {
      updatePhysics();
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

    // 6. Player
    const p = playerRef.current;
    if (gameStateRef.current.status !== GameStatus.WAITING_RESULTS && gameStateRef.current.status !== GameStatus.GAME_OVER) {
         if (gameStateRef.current.speed > 0) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = COLORS.PLAYER;
            ctx.fillRect(p.x - 10, p.y, p.width, p.height);
            ctx.globalAlpha = 1.0;
         }
         let drawH = p.height;
         let drawW = p.width;
         if (p.isJumping) {
            drawH = p.height * 0.9;
            drawW = p.width * 0.9;
         }
         ctx.shadowBlur = 20;
         ctx.shadowColor = COLORS.PLAYER_GLOW;
         ctx.fillStyle = COLORS.PLAYER;
         ctx.fillRect(p.x, p.y, drawW, drawH);
         ctx.shadowBlur = 0;
         ctx.fillStyle = '#fff';
         ctx.fillRect(p.x + drawW - 8, p.y + 6, 6, 4);
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
      }
    }
  }, []);

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
         <h1 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
            DIGITAL RUNNER
         </h1>
         
         {lobbyStep === 'MENU' && (
             <div className="flex flex-col gap-6 items-center">
                 <button 
                    onClick={() => setLobbyStep('NAME_INPUT')}
                    className="w-64 py-5 bg-gradient-to-r from-purple-900 to-purple-800 border-2 border-purple-500 hover:from-purple-800 hover:to-purple-700 hover:scale-105 text-white font-black text-xl tracking-widest transition-all shadow-lg shadow-purple-900/50 skew-x-[-10deg]"
                 >
                    JOIN THE TEAM
                 </button>
                 
                 <button 
                    onClick={() => startGame('SINGLE')}
                    className="w-40 py-2 bg-transparent border border-gray-600 text-gray-400 hover:text-cyan-400 hover:border-cyan-400 font-mono text-sm transition-all uppercase"
                 >
                    Single Play
                 </button>
             </div>
         )}

         {lobbyStep === 'NAME_INPUT' && (
             <div className="flex flex-col gap-4">
                 {uiState.isConnecting ? (
                     <div className="p-8 border border-purple-500 bg-purple-900/20">
                        <p className="text-purple-400 font-mono animate-pulse text-lg mb-2">CONNECTING TO SERVER...</p>
                        <p className="text-gray-500 text-xs">(Free server might take up to 50s to wake up)</p>
                     </div>
                 ) : (
                    <div className="flex flex-col gap-4 animate-fadeIn">
                        <h3 className="text-cyan-200 text-sm tracking-widest text-left">ENTER AGENT CODENAME</h3>
                        <input 
                            type="text" 
                            placeholder="CODENAME" 
                            className="bg-black/50 border border-gray-600 text-white p-3 focus:border-cyan-500 outline-none font-mono text-center text-lg uppercase"
                            maxLength={10}
                            value={uiState.playerName}
                            onChange={(e) => setUiState(prev => ({...prev, playerName: e.target.value}))}
                            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                        />
                        <button 
                            onClick={joinRoom}
                            disabled={!uiState.playerName}
                            className="px-6 py-3 bg-cyan-900/40 border border-cyan-500 hover:bg-cyan-500 hover:text-black text-cyan-400 font-bold transition-all uppercase disabled:opacity-50 mt-2"
                        >
                            ENTER WAITING ROOM
                        </button>
                        <button 
                            onClick={() => setLobbyStep('MENU')}
                            className="text-gray-600 hover:text-white text-xs mt-4 underline"
                        >
                            Back to Menu
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
    // Strict requirement: 10 players AND everyone ready
    const hasEnoughPlayers = uiState.players.length === REQUIRED_PLAYERS;
    const allReady = hasEnoughPlayers && uiState.players.every(p => p.isReady);
    
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30">
            <div className="w-full max-w-2xl bg-[#0f0f1a] border border-cyan-500 p-8">
                <div className="flex justify-between items-end border-b border-gray-700 pb-2 mb-6">
                    <h2 className="text-2xl text-cyan-400 font-bold tracking-widest">
                        TEAM LOBBY
                    </h2>
                    <span className={`font-mono text-lg ${hasEnoughPlayers ? 'text-green-500' : 'text-yellow-500'}`}>
                        {uiState.players.length} / {REQUIRED_PLAYERS} AGENTS
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
                    {[...Array(Math.max(0, 10 - uiState.players.length))].map((_, i) => (
                        <div key={i} className="p-4 border border-gray-800 bg-black/50 opacity-50 flex items-center justify-center text-gray-600 text-sm animate-pulse">
                            WAITING FOR AGENT...
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center">
                    <button onClick={returnToMenu} className="text-red-500 hover:text-red-400 underline text-sm">ABORT MISSION</button>
                    <div className="flex gap-4">
                        <button 
                            onClick={toggleReady}
                            className={`px-8 py-3 font-bold border ${me?.isReady ? 'bg-gray-800 text-gray-400 border-gray-600' : 'bg-green-600 text-black border-green-500 hover:bg-green-500'}`}
                        >
                            {me?.isReady ? 'CANCEL READY' : 'I AM READY'}
                        </button>
                        
                        <div className="relative group">
                            <button 
                                onClick={tryStartMultiplayer}
                                className={`px-8 py-3 font-bold border transition-all ${allReady ? 'bg-cyan-600 text-white border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed opacity-50'}`}
                                disabled={!allReady}
                            >
                                START MISSION
                            </button>
                            {!allReady && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-black border border-red-500 text-red-400 text-xs px-2 py-1 hidden group-hover:block">
                                    {!hasEnoughPlayers ? `WAITING FOR ${REQUIRED_PLAYERS - uiState.players.length} MORE AGENTS` : 'WAITING FOR ALL TO BE READY'}
                                </div>
                            )}
                        </div>
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
                <h2 className="text-3xl text-yellow-400 font-black text-center mb-6 tracking-widest">MISSION COMPLETE</h2>
                
                <div className="space-y-2 mb-8">
                    {sortedPlayers.map((p, idx) => (
                        <div key={p.id} className={`flex items-center p-3 border-b border-gray-800 ${idx === 0 ? 'bg-yellow-900/20' : ''}`}>
                            <div className="w-10 text-xl font-bold text-gray-500">#{idx + 1}</div>
                            <div className="flex-1 text-white font-mono text-lg">{p.name}</div>
                            <div className="text-yellow-400 font-bold text-xl">{p.score} <span className="text-xs text-yellow-600">pts</span></div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-4">
                    <button onClick={returnToMenu} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold border border-gray-600">
                        RETURN TO LOBBY
                    </button>
                </div>
            </div>
        </div>
     );
  };

  return (
    <div className="relative w-full h-full flex justify-center items-center bg-[#02020a] overflow-hidden select-none font-[Orbitron]">
      {/* HUD */}
      {(gameStateRef.current.status === GameStatus.PLAYING || gameStateRef.current.status === GameStatus.QUIZ || gameStateRef.current.status === GameStatus.WAITING_RESULTS) && (
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
            <div className="bg-black/80 px-6 py-2 border-l-4 border-yellow-400 transform skew-x-[-10deg]">
                <span className="text-2xl text-yellow-400 font-bold -skew-x-[10deg]">{uiState.score} <span className="text-sm">bits</span></span>
            </div>
            {gameStateRef.current.mode === 'MULTI' && (
                <div className="flex gap-2">
                     {uiState.players.filter(p => p.id !== uiState.myId).map(p => (
                         <div key={p.id} className="bg-black/50 px-3 py-1 border border-gray-700 text-xs text-gray-300">
                             {p.name}: {p.score}
                         </div>
                     ))}
                </div>
            )}
            <div className={`bg-black/80 px-6 py-2 border-r-4 ${uiState.timeLeft <= 5 ? 'border-red-500 animate-pulse' : 'border-cyan-500'} transform skew-x-[10deg]`}>
                <span className={`text-2xl font-bold skew-x-[-10deg] ${uiState.timeLeft <= 5 ? 'text-red-500' : 'text-cyan-400'}`}>
                    {formatTime(uiState.timeLeft)}s
                </span>
            </div>
        </div>
      )}

      {/* Mobile Jump Button */}
      {gameStateRef.current.status === GameStatus.PLAYING && (
        <div className="absolute bottom-6 right-6 z-20 md:hidden">
          <button
            onTouchStart={(e) => { e.preventDefault(); performJump(); }}
            onClick={(e) => { e.preventDefault(); performJump(); }}
            className="w-20 h-20 rounded-full bg-cyan-500/30 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center active:bg-cyan-500/60 active:scale-95 transition-all"
          >
            <span className="text-cyan-100 font-bold text-sm tracking-wider pointer-events-none">JUMP</span>
          </button>
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
                  <h2 className="text-2xl text-gray-400 animate-pulse mb-2">SYNCING WITH SERVER...</h2>
                  <p className="text-gray-600">Waiting for other runners to finish</p>
                  <p className="text-cyan-500 text-4xl mt-4 font-bold">{Math.ceil(uiState.timeLeft)}s</p>
              </div>
          </div>
      )}

      {/* Single Player Game Over/Victory screens (Simplified as they use same logic but might want separate if single player) */}
      {(uiState.status === GameStatus.GAME_OVER || uiState.status === GameStatus.VICTORY) && gameStateRef.current.mode === 'SINGLE' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
          <div className={`text-center p-8 bg-black/90 border-2 ${uiState.status === GameStatus.VICTORY ? 'border-yellow-400' : 'border-red-600'} shadow-lg max-w-md w-full`}>
            <h2 className={`text-5xl font-black mb-4 ${uiState.status === GameStatus.VICTORY ? 'text-yellow-400' : 'text-red-600'}`}>
                {uiState.status === GameStatus.VICTORY ? 'COMPLETE' : 'FAILURE'}
            </h2>
            <div className="text-3xl font-bold mb-8 text-white">SCORE: {uiState.score}</div>
            <div className="flex flex-col gap-4">
                <button onClick={() => startGame('SINGLE')} className="px-8 py-3 bg-gray-700 hover:bg-white hover:text-black text-white font-bold transition-all uppercase">RETRY</button>
                <button onClick={returnToMenu} className="px-8 py-3 border border-gray-600 text-gray-400 hover:text-white transition-all uppercase">MENU</button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {uiState.status === GameStatus.QUIZ && uiState.activeQuiz && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#050510] border border-green-500/50 p-6 relative">
             <div className="flex justify-between items-center border-b border-green-900/50 pb-2 mb-4">
                <div className="text-xs text-gray-500">ENCRYPTED DATA FOUND</div>
                <div className={`font-mono text-xl font-bold ${uiState.quizTimeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                    00:{uiState.quizTimeLeft.toString().padStart(2, '0')}
                </div>
             </div>
             
             <p className="text-lg text-green-100 font-mono mb-6 mt-4">{">"} {uiState.activeQuiz.question}</p>
             <div className="grid grid-cols-1 gap-3">
                {uiState.activeQuiz.options.map((option, idx) => (
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
