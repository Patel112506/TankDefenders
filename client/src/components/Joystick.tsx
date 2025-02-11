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
      size: 120, // Increased size for better control
      lockX: false, // Ensure no axis locking
      lockY: false,
      dynamicPage: true,
      maxNumberOfNipples: 1,
      threshold: 0.1 // Lower threshold for more responsive movement
    });

    joystick.on('move', (_, data) => {
      if (data.angle && data.force) {
        onMove({
          angle: (data.angle.radian + Math.PI) % (2 * Math.PI),
          force: Math.min(data.force / 40, 1)
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
      className="fixed bottom-20 left-20 w-52 h-52 bg-black/20 rounded-full" 
      style={{ touchAction: 'none' }}
    />
  );
}