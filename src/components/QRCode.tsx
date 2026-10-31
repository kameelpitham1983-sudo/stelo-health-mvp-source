import { useEffect, useState, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 128, className }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    }, (err) => {
      setError(!!err);
    });
  }, [value, size]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-ink-50 rounded-lg ${className ?? ''}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-ink-400">QR unavailable</span>
      </div>
    );
  }

  return <canvas ref={canvasRef} className={`rounded-lg ${className ?? ''}`} style={{ width: size, height: size }} />;
}
