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

    // Draw battlefield/ground (green field)
    ctx.fillStyle = 'rgba(0, 119, 0, 0.3)'; // Semi-transparent green
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines for better orientation
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    const gridSize = 10;
    const gridStep = canvas.width / gridSize;

    for (let i = 1; i < gridSize; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * gridStep, 0);
      ctx.lineTo(i * gridStep, canvas.height);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * gridStep);
      ctx.lineTo(canvas.width, i * gridStep);
      ctx.stroke();
    }

    // Scale factor to convert world coordinates to minimap coordinates
    const scale = canvas.width / mapSize;

    // Draw player (green dot with outline)
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(
      (playerPosition.x + mapSize / 2) * scale,
      (playerPosition.z + mapSize / 2) * scale,
      6,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Draw enemies (red dots with outline)
    enemyPositions.forEach(pos => {
      ctx.fillStyle = '#ff0000';
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(
        (pos.x + mapSize / 2) * scale,
        (pos.z + mapSize / 2) * scale,
        4,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
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