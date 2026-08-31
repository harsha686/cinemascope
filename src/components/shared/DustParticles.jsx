import React, { useEffect, useRef } from 'react';

export default function DustParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.3,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: -Math.random() * 0.2 - 0.05,
      opacity: Math.random() * 0.4 + 0.05,
      life: 0,
      maxLife: Math.random() * 300 + 200,
    });

    resize();
    for (let i = 0; i < 60; i++) particles.push(createParticle());
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life++;
        const lifeRatio = p.life / p.maxLife;
        const alpha = p.opacity * (1 - Math.pow(lifeRatio, 2)) * Math.min(1, lifeRatio * 10);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 168, 76, ${alpha})`;
        ctx.fill();
        if (p.life >= p.maxLife) particles[i] = createParticle();
      });
      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.7 }}
      aria-hidden="true"
    />
  );
}
