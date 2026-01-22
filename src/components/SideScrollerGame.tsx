"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame } from "framer-motion";

interface GameState {
  playerX: number;
  playerY: number;
  velocityY: number;
  isJumping: boolean;
  isRunning: boolean;
  facingRight: boolean;
  cameraX: number;
}

interface Landmark {
  id: string;
  x: number;
  image: string;
  width: number;
  height: number;
}

const GROUND_Y = 72;
const JUMP_FORCE = -20;
const GRAVITY = 0.9;
const MOVE_SPEED = 7;
const WORLD_WIDTH = 8000;

// Toronto landmarks placed at specific positions
const landmarks: Landmark[] = [
  { id: "cn-tower", x: 800, image: "/game/toronto/landmarks/cn-tower.jpg", width: 200, height: 400 },
  { id: "streetcar", x: 1800, image: "/game/toronto/landmarks/streetcar.jpg", width: 300, height: 150 },
  { id: "city-hall", x: 3000, image: "/game/toronto/landmarks/city-hall.jpg", width: 400, height: 250 },
  { id: "toronto-sign", x: 4200, image: "/game/toronto/landmarks/toronto-sign.jpg", width: 350, height: 120 },
  { id: "rogers-centre", x: 5500, image: "/game/toronto/landmarks/rogers-centre.jpg", width: 450, height: 200 },
  { id: "raccoon", x: 6800, image: "/game/toronto/landmarks/raccoon.jpg", width: 150, height: 150 },
];

export function SideScrollerGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    playerX: 150,
    playerY: GROUND_Y,
    velocityY: 0,
    isJumping: false,
    isRunning: false,
    facingRight: true,
    cameraX: 0,
  });

  const keysPressed = useRef<Set<string>>(new Set());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "w"].includes(e.key)) {
        e.preventDefault();
        keysPressed.current.add(e.key.toLowerCase());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isFocused]);

  useAnimationFrame(() => {
    if (!isFocused) return;

    setGameState((prev) => {
      let { playerX, playerY, velocityY, isJumping, facingRight, cameraX } = prev;
      let isRunning = false;

      if (keysPressed.current.has("arrowleft") || keysPressed.current.has("a")) {
        playerX = Math.max(50, playerX - MOVE_SPEED);
        facingRight = false;
        isRunning = true;
      }
      if (keysPressed.current.has("arrowright") || keysPressed.current.has("d")) {
        playerX = Math.min(WORLD_WIDTH - 50, playerX + MOVE_SPEED);
        facingRight = true;
        isRunning = true;
      }

      if (
        (keysPressed.current.has("arrowup") || keysPressed.current.has("w") || keysPressed.current.has(" ")) &&
        !isJumping
      ) {
        velocityY = JUMP_FORCE;
        isJumping = true;
      }

      if (isJumping) {
        velocityY += GRAVITY;
        playerY += velocityY;

        if (playerY >= GROUND_Y) {
          playerY = GROUND_Y;
          velocityY = 0;
          isJumping = false;
        }
      }

      const containerWidth = containerRef.current?.offsetWidth || 800;
      const targetCameraX = playerX - containerWidth / 3;
      cameraX = Math.max(0, Math.min(WORLD_WIDTH - containerWidth, targetCameraX));

      return { playerX, playerY, velocityY, isJumping, isRunning, facingRight, cameraX };
    });
  });

  const { playerX, playerY, isJumping, isRunning, facingRight, cameraX } = gameState;

  // Determine which character sprite to show
  const getCharacterSprite = () => {
    if (isJumping) return "/game/toronto/character/jump.jpg";
    if (isRunning) return "/game/toronto/character/run.jpg";
    return "/game/toronto/character/idle.jpg";
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden cursor-pointer outline-none"
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={() => containerRef.current?.focus()}
    >
      {/* Instructions overlay */}
      {!isFocused && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-2">Toronto Runner</h1>
            <p className="text-xl mb-4 opacity-80">A side-scrolling adventure</p>
            <div className="bg-white/10 rounded-2xl px-8 py-4 inline-block">
              <p className="text-lg mb-2">Click to Play</p>
              <p className="text-sm opacity-70">Arrow keys or WASD to move • Space to jump</p>
            </div>
          </div>
        </div>
      )}

      {/* Layer 1 - Sky (slowest) */}
      <div
        className="absolute inset-0 w-[500%] h-full"
        style={{
          backgroundImage: "url(/game/toronto/bg/sky.jpg)",
          backgroundSize: "auto 100%",
          backgroundRepeat: "repeat-x",
          transform: `translateX(${-cameraX * 0.05}px)`,
        }}
      />

      {/* Layer 2 - Far city (slow) */}
      <div
        className="absolute inset-0 w-[500%] h-full"
        style={{
          backgroundImage: "url(/game/toronto/bg/far-city.jpg)",
          backgroundSize: "auto 100%",
          backgroundRepeat: "repeat-x",
          transform: `translateX(${-cameraX * 0.2}px)`,
        }}
      />

      {/* Layer 3 - Mid urban (medium) */}
      <div
        className="absolute inset-0 w-[500%] h-full"
        style={{
          backgroundImage: "url(/game/toronto/bg/mid-urban.jpg)",
          backgroundSize: "auto 100%",
          backgroundRepeat: "repeat-x",
          transform: `translateX(${-cameraX * 0.5}px)`,
        }}
      />

      {/* Landmarks (placed at specific X positions, move with ground) */}
      {landmarks.map((landmark) => {
        const screenX = landmark.x - cameraX;
        const containerWidth = containerRef.current?.offsetWidth || 800;

        // Only render if visible on screen
        if (screenX < -landmark.width || screenX > containerWidth + 100) return null;

        return (
          <div
            key={landmark.id}
            className="absolute"
            style={{
              left: screenX,
              bottom: "28%",
              width: landmark.width,
              height: landmark.height,
            }}
          >
            <img
              src={landmark.image}
              alt={landmark.id}
              className="w-full h-full object-contain"
            />
          </div>
        );
      })}

      {/* Layer 4 - Ground (fastest, matches player) */}
      <div
        className="absolute bottom-0 w-[500%] h-[30%]"
        style={{
          backgroundImage: "url(/game/toronto/bg/ground.jpg)",
          backgroundSize: "auto 100%",
          backgroundRepeat: "repeat-x",
          transform: `translateX(${-cameraX}px)`,
        }}
      />

      {/* Player */}
      <motion.div
        className="absolute w-24 h-32 md:w-32 md:h-44"
        style={{
          left: playerX - cameraX,
          top: `${playerY}%`,
          scaleX: facingRight ? 1 : -1,
          translateY: "-100%",
        }}
      >
        <motion.img
          src={getCharacterSprite()}
          alt="Player"
          className="w-full h-full object-contain drop-shadow-2xl"
          animate={
            isJumping
              ? { scale: [1, 1.1, 1] }
              : isRunning
              ? { y: [0, -3, 0] }
              : { y: 0 }
          }
          transition={
            isJumping
              ? { duration: 0.3 }
              : { duration: 0.2, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </motion.div>

      {/* HUD */}
      {isFocused && (
        <>
          <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm">
            <div className="font-bold text-lg">Toronto Runner</div>
            <div className="opacity-70">Distance: {Math.round(playerX)}m</div>
            <div className="opacity-70">World: {WORLD_WIDTH}m</div>
          </div>

          <div className="absolute top-4 right-4 px-4 py-2 bg-black/50 rounded-xl text-white text-sm backdrop-blur-sm">
            Click outside to pause
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-4 left-4 right-4 h-2 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-white/80 rounded-full transition-all"
              style={{ width: `${(playerX / WORLD_WIDTH) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
