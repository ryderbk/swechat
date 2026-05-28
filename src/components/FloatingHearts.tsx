import { useEffect, useRef } from 'react';

interface Heart {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

export const FloatingHearts = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartsRef = useRef<Heart[]>([]);
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

    // Initialize hearts
    const createHeart = (): Heart => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 50,
      size: Math.random() * 15 + 10,
      speed: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
    });

    // Start with some hearts
    for (let i = 0; i < 15; i++) {
      const heart = createHeart();
      heart.y = Math.random() * canvas.height;
      heartsRef.current.push(heart);
    }

    const drawHeart = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;
      
      ctx.beginPath();
      ctx.moveTo(0, size * 0.3);
      ctx.bezierCurveTo(
        -size * 0.5, -size * 0.3,
        -size, size * 0.3,
        0, size
      );
      ctx.bezierCurveTo(
        size, size * 0.3,
        size * 0.5, -size * 0.3,
        0, size * 0.3
      );
      ctx.closePath();
      
      ctx.fillStyle = `hsl(0, 100%, 74%)`;
      ctx.fill();
      
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      heartsRef.current.forEach((heart, index) => {
        heart.y -= heart.speed;
        heart.rotation += heart.rotationSpeed;
        heart.x += Math.sin(heart.y * 0.01) * 0.5;

        drawHeart(heart.x, heart.y, heart.size, heart.rotation, heart.opacity);

        // Reset heart if it goes off screen
        if (heart.y < -50) {
          heartsRef.current[index] = createHeart();
        }
      });

      // Occasionally add new hearts
      if (Math.random() < 0.02 && heartsRef.current.length < 30) {
        heartsRef.current.push(createHeart());
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
      className="fixed inset-0 pointer-events-none z-10"
      aria-hidden="true"
    />
  );
};
