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

const GROUND_Y = 75;
const JUMP_FORCE = -18;
const GRAVITY = 0.8;
const MOVE_SPEED = 6;
const WORLD_WIDTH = 4000;

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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden cursor-pointer outline-none bg-gradient-to-b from-purple-900 to-orange-600"
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={() => containerRef.current?.focus()}
    >
      {!isFocused && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Game Builder</h1>
            <p className="text-xl mb-2">Click to Play</p>
            <p className="text-sm opacity-70">Arrow keys or WASD to move, Space to jump</p>
          </div>
        </div>
      )}

      {/* Parallax Layer 1 - Mountains (slowest) */}
      <div
        className="absolute inset-0 w-[400%] h-full"
        style={{
          backgroundImage: "url(/game/bg-mountains.jpg)",
          backgroundSize: "auto 100%",
          backgroundRepeat: "repeat-x",
          transform: `translateX(${-cameraX * 0.15}px)`,
        }}
      />

      {/* Parallax Layer 2 - City (medium) */}
      <div
        className="absolute inset-0 w-[400%] h-full"
        style={{
          backgroundImage: "url(/game/bg-city.jpg)",
          backgroundSize: "auto 100%",
          backgroundRepeat: "repeat-x",
          transform: `translateX(${-cameraX * 0.4}px)`,
        }}
      />

      {/* Parallax Layer 3 - Ground (fastest) */}
      <div
        className="absolute bottom-0 w-[400%] h-[35%]"
        style={{
          backgroundImage: "url(/game/bg-ground.jpg)",
          backgroundSize: "auto 100%",
          backgroundRepeat: "repeat-x",
          transform: `translateX(${-cameraX}px)`,
        }}
      />

      {/* Player */}
      <motion.div
        className="absolute w-20 h-20 md:w-28 md:h-28"
        style={{
          left: playerX - cameraX,
          top: `${playerY}%`,
          scaleX: facingRight ? 1 : -1,
          translateY: "-100%",
        }}
      >
        {/* Simple pixel art character */}
        <div className="w-full h-full relative">
          <motion.div
            className="w-full h-full bg-blue-500 rounded-lg shadow-lg flex items-center justify-center"
            animate={
              isJumping
                ? { scaleY: [1, 0.8, 1.2, 1], rotate: [0, -5, 5, 0] }
                : isRunning
                ? { y: [0, -4, 0], scaleX: [1, 1.05, 1] }
                : { y: 0 }
            }
            transition={
              isJumping
                ? { duration: 0.4 }
                : { duration: 0.25, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <span className="text-3xl">🏃</span>
          </motion.div>
        </div>
      </motion.div>

      {/* HUD */}
      {isFocused && (
        <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-2 rounded-lg">
          <div>Position: {Math.round(playerX)}</div>
          <div>World: {WORLD_WIDTH}px</div>
        </div>
      )}

      {isFocused && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 rounded-full text-white text-xs">
          ESC or click outside to pause
        </div>
      )}
    </div>
  );
}
