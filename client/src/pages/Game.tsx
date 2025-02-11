import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { GameEngine } from '../game/engine';

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    gameRef.current = new GameEngine(containerRef.current);
    gameRef.current.init();

    return () => {
      gameRef.current?.dispose();
    };
  }, []);

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
              <Progress value={100} className="w-32" />
            </div>
            <div>Level: 1</div>
            <div>Score: 0</div>
          </div>
        </Card>

        <Card className="p-4 bg-opacity-80 pointer-events-auto">
          <Button variant="secondary" onClick={() => gameRef.current?.pause()}>
            Pause
          </Button>
        </Card>
      </div>
    </div>
  );
}
