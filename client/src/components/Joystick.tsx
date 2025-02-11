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
      color: '#ffffff',
      size: 100,
      lockX: false,
      lockY: false,
      dynamicPage: true,
      maxNumberOfNipples: 1,
      threshold: 0.1,
    });

    joystick.on('move', (_, data) => {
      if (data.angle && data.force) {
        onMove({
          angle: data.angle.radian,
          force: Math.min(data.force / 50, 1)
        });
      }
    });

    joystick.on('end', onEnd);

    return () => {
      joystick.destroy();
    };
  }, [onMove, onEnd]);

  return (
    <div className="fixed bottom-20 left-20 w-40 h-40">
      {/* Outer circle */}
      <div 
        className="absolute inset-0 rounded-full border-4 border-white/30 bg-black/20 backdrop-blur-sm"
        style={{ touchAction: 'none' }}
      >
        {/* Inner circle (static position indicator) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/50" />
      </div>
      {/* Joystick container */}
      <div 
        ref={containerRef}
        className="absolute inset-0" 
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}