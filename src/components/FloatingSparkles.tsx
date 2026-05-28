import { useEffect, useRef } from 'react';

interface Sparkle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  initialOpacity: number;
}

export const FloatingSparkles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparklesRef = useRef<Sparkle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create delicate sparkles
    const createSparkle = (): Sparkle => ({
      x: Math.random() * canvas.width * 0.6 + canvas.width * 0.2,
      y: canvas.height + 50,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.8 + 0.3,
      opacity: Math.random() * 0.25 + 0.1,
      initialOpacity: Math.random() * 0.25 + 0.1,
    });

    // Start with minimal sparkles
    for (let i = 0; i < 8; i++) {
      const sparkle = createSparkle();
      sparkle.y = Math.random() * canvas.height;
      sparklesRef.current.push(sparkle);
    }

    const drawSparkle = (x: number, y: number, size: number, opacity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Four-pointed star sparkle
      ctx.fillStyle = 'hsl(0, 100%, 80%)';
      
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const angle = (i * Math.PI) / 2;
        const x1 = x + Math.cos(angle) * size;
        const y1 = y + Math.sin(angle) * size;
        const x2 = x + Math.cos(angle + 0.3) * (size * 0.4);
        const y2 = y + Math.sin(angle + 0.3) * (size * 0.4);
        
        ctx.moveTo(x, y);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fill();
      }
      
      // Center dot
      ctx.beginPath();
      ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparklesRef.current.forEach((sparkle, index) => {
        sparkle.y -= sparkle.speed;
        // Fade out as it rises
        sparkle.opacity = sparkle.initialOpacity * (1 - ((-sparkle.y) / canvas.height) * 1.5);

        drawSparkle(sparkle.x, sparkle.y, sparkle.size, Math.max(0, sparkle.opacity));

        // Reset sparkle if it goes off screen
        if (sparkle.y < -50) {
          sparklesRef.current[index] = createSparkle();
        }
      });

      // Occasionally add new sparkles (very rarely)
      if (Math.random() < 0.01 && sparklesRef.current.length < 15) {
        sparklesRef.current.push(createSparkle());
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      animate();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-20"
      aria-hidden="true"
    />
  );
};
