import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface MinimapProps {
  playerPosition: THREE.Vector3;
  enemyPositions: THREE.Vector3[];
  mapSize: number;
}

export function Minimap({ playerPosition, enemyPositions, mapSize }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = 'white';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Scale factor to convert world coordinates to minimap coordinates
    const scale = canvas.width / mapSize;

    // Draw player (green dot)
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(
      (playerPosition.x + mapSize / 2) * scale,
      (playerPosition.z + mapSize / 2) * scale,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw enemies (red dots)
    ctx.fillStyle = '#ff0000';
    enemyPositions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(
        (pos.x + mapSize / 2) * scale,
        (pos.z + mapSize / 2) * scale,
        3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }, [playerPosition, enemyPositions, mapSize]);

  return (
    <canvas
      ref={canvasRef}
      width={150}
      height={150}
      className="border border-white/20 rounded-lg"
    />
  );
}
