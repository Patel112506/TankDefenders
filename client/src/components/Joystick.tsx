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
      size: 100,
    });

    joystick.on('move', (_, data) => {
      if (data.angle && data.force) {
        onMove({
          angle: (data.angle.radian + Math.PI) % (2 * Math.PI),
          force: Math.min(data.force / 50, 1), // Normalize force to 0-1
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
      className="fixed bottom-20 left-20 w-32 h-32 bg-black/20 rounded-full"
      style={{ touchAction: 'none' }}
    />
  );
}
