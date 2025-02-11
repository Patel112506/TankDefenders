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

    // Clear canvas with a semi-transparent dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw terrain grid with improved visuals
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    const gridSize = 40; // More grid lines for larger map
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

    // Draw cardinal directions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('N', canvas.width / 2, 20);
    ctx.fillText('S', canvas.width / 2, canvas.height - 10);
    ctx.fillText('W', 15, canvas.height / 2);
    ctx.fillText('E', canvas.width - 15, canvas.height / 2);

    // Draw player (green dot with pulse effect)
    const pulseSize = 8 + Math.sin(Date.now() * 0.01) * 2;

    // Pulse glow
    const gradient = ctx.createRadialGradient(
      (playerPosition.x + mapSize / 2) * scale,
      (playerPosition.z + mapSize / 2) * scale,
      0,
      (playerPosition.x + mapSize / 2) * scale,
      (playerPosition.z + mapSize / 2) * scale,
      pulseSize * 2
    );
    gradient.addColorStop(0, 'rgba(0, 255, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
      (playerPosition.x + mapSize / 2) * scale,
      (playerPosition.z + mapSize / 2) * scale,
      pulseSize * 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Player dot
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(
      (playerPosition.x + mapSize / 2) * scale,
      (playerPosition.z + mapSize / 2) * scale,
      pulseSize,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Draw enemies (red dots with threat indicator)
    enemyPositions.forEach(pos => {
      // Threat radius indicator
      const threatGradient = ctx.createRadialGradient(
        (pos.x + mapSize / 2) * scale,
        (pos.z + mapSize / 2) * scale,
        0,
        (pos.x + mapSize / 2) * scale,
        (pos.z + mapSize / 2) * scale,
        15
      );
      threatGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
      threatGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

      ctx.fillStyle = threatGradient;
      ctx.beginPath();
      ctx.arc(
        (pos.x + mapSize / 2) * scale,
        (pos.z + mapSize / 2) * scale,
        15,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Enemy dot
      ctx.fillStyle = '#ff0000';
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(
        (pos.x + mapSize / 2) * scale,
        (pos.z + mapSize / 2) * scale,
        6,
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
      width={300}
      height={300}
      className="border border-white/20 rounded-lg shadow-lg"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
    />
  );
}