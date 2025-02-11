import { useEffect, useRef } from 'react';
import nipplejs from 'nipplejs';

interface JoystickProps {
  onMove: (data: { angle: number; force: number }) => void;
  onEnd: () => void;
}

export function Joystick({ onMove, onEnd }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const joystick = nipplejs.create({
      zone: containerRef.current,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'white',
      size: 150, // Increased size for better control area
      lockX: false,
      lockY: false,
      dynamicPage: true,
      maxNumberOfNipples: 1,
      threshold: 0.05, // Lower threshold for more sensitive response
      fadeTime: 50, // Faster fade for more responsive feel
    });

    joystick.on('move', (_, data) => {
      if (data.angle && data.force) {
        // Smoother angle calculation with normalization
        const normalizedAngle = (data.angle.radian + Math.PI) % (2 * Math.PI);
        // Smoother force scaling with cubic easing
        const normalizedForce = Math.pow(Math.min(data.force / 50, 1), 2);

        onMove({
          angle: normalizedAngle,
          force: normalizedForce
        });
      }
    });

    joystick.on('end', onEnd);

    return () => {
      joystick.destroy();
    };
  }, [onMove, onEnd]);

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-20 left-20 w-60 h-60 bg-black/20 rounded-full backdrop-blur-sm" 
      style={{ touchAction: 'none' }}
    />
  );
}