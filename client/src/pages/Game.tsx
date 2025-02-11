import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { GameEngine } from '../game/engine';
import { Joystick } from '@/components/Joystick';
import * as THREE from 'three';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Minimap } from '@/components/Minimap';

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(100);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<THREE.Vector3>(new THREE.Vector3());
  const [enemyPositions, setEnemyPositions] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    gameRef.current = new GameEngine(containerRef.current);

    // Set up UI callbacks
    gameRef.current.setUICallbacks({
      onScoreUpdate: setScore,
      onLevelUpdate: setLevel,
      onHealthUpdate: setHealth,
      onGameOver: () => setShowGameOver(true),
      onLevelComplete: () => setShowLevelComplete(true),
    });

    gameRef.current.init();
    setHealth(500); // Set initial health to 500

    // Add keyboard listener for spacebar shooting
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && gameRef.current) {
        gameRef.current.getPlayerTank()?.shoot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const updatePositions = () => {
      if (gameRef.current) {
        setPlayerPosition(gameRef.current.getPlayerTank()?.getPosition() || new THREE.Vector3());
        setEnemyPositions(gameRef.current.getEnemyPositions() || []);
      }
      requestAnimationFrame(updatePositions);
    };

    updatePositions();


    return () => {
      gameRef.current?.dispose();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleRestartGame = () => {
    setShowGameOver(false);
    setShowLevelComplete(false);
    setScore(0);
    setLevel(1);
    setHealth(500); // Reset health to 500
    gameRef.current?.restart();
  };

  const handleNextLevel = () => {
    setShowLevelComplete(false);
    gameRef.current?.startNextLevel();
  };

  const handleJoystickMove = (data: { angle: number; force: number }) => {
    gameRef.current?.getPlayerTank()?.handleJoystickInput(data);
  };

  const handleJoystickEnd = () => {
    gameRef.current?.getPlayerTank()?.handleJoystickInput(null);
  };

  return (
    <div className="relative w-full h-screen">
      {/* Game Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Joystick */}
      <Joystick onMove={handleJoystickMove} onEnd={handleJoystickEnd} />

      {/* Shoot Button (for mobile) */}
      <button
        className="fixed bottom-20 right-20 w-16 h-16 bg-red-500/50 rounded-full flex items-center justify-center text-white text-sm font-bold"
        onTouchStart={() => gameRef.current?.getPlayerTank()?.shoot()}
      >
        FIRE
      </button>

      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <Card className="p-4 bg-opacity-80 pointer-events-auto">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span>Health:</span>
              <Progress value={(health / 500) * 100} className="w-32" />
              <span className="text-sm">{health}/500</span>
            </div>
            <div>Level: {level}</div>
            <div>Score: {score}</div>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-4 bg-opacity-80 pointer-events-auto">
            <Button variant="secondary" onClick={() => gameRef.current?.pause()}>
              Pause
            </Button>
          </Card>

          <Card className="p-2 bg-opacity-80">
            <Minimap
              playerPosition={playerPosition}
              enemyPositions={enemyPositions}
              mapSize={50}
            />
          </Card>
        </div>
      </div>

      {/* Game Over Dialog */}
      <Dialog open={showGameOver} onOpenChange={setShowGameOver}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Over!</DialogTitle>
            <DialogDescription>
              Final Score: {score}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleRestartGame}>
              Play Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Complete Dialog */}
      <Dialog open={showLevelComplete} onOpenChange={setShowLevelComplete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Level {level} Complete!</DialogTitle>
            <DialogDescription>
              Current Score: {score}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleNextLevel}>
              Next Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}