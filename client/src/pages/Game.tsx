import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { GameEngine } from '../game/engine';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(100);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);

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

    return () => {
      gameRef.current?.dispose();
    };
  }, []);

  const handleRestartGame = () => {
    setShowGameOver(false);
    setShowLevelComplete(false);
    setScore(0);
    setLevel(1);
    setHealth(100);
    gameRef.current?.restart();
  };

  const handleNextLevel = () => {
    setShowLevelComplete(false);
    gameRef.current?.startNextLevel();
  };

  return (
    <div className="relative w-full h-screen">
      {/* Game Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <Card className="p-4 bg-opacity-80 pointer-events-auto">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span>Health:</span>
              <Progress value={health} className="w-32" />
            </div>
            <div>Level: {level}</div>
            <div>Score: {score}</div>
          </div>
        </Card>

        <Card className="p-4 bg-opacity-80 pointer-events-auto">
          <Button variant="secondary" onClick={() => gameRef.current?.pause()}>
            Pause
          </Button>
        </Card>
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