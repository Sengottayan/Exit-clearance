"use client";

import { useEffect, useRef } from "react";

interface Particle {
  phi: number;        // Longitude angle
  theta: number;      // Latitude angle (curving upwards)
  baseRadius: number; // Base radius of the sphere
  size: number;       // Render size
  color: string;      // Color string (RGB format)
  speed: number;      // Rotation speed
  waveOffset: number; // Wave offset for physical ripple effect
  alpha: number;      // Base alpha
}

export function CanvasParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Detect dark mode
    const isDark = () => document.documentElement.classList.contains("dark");

    // Track mouse position for interactive displacement
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // Initialize particles on a 3D dome (hemisphere)
    const particleCount = Math.min(300, Math.floor(width / 4));
    const particles: Particle[] = [];

    // Base config
    const baseRadius = Math.max(width, height) * 0.5;

    for (let i = 0; i < particleCount; i++) {
      // phi around the circle (0 to 2*PI)
      const phi = Math.random() * Math.PI * 2;
      // theta upwards (0 to PI/2 to form a top dome)
      const theta = Math.pow(Math.random(), 1.5) * (Math.PI * 0.45);

      const size = Math.random() * 1.8 + 0.5;

      // Brand blue/indigo/violet palette
      const colorChoice = Math.random();
      const color = colorChoice > 0.65
        ? "59, 130, 246"   // blue-500
        : colorChoice > 0.3
        ? "99, 102, 241"   // indigo-500
        : "139, 92, 246";  // violet-500

      particles.push({
        phi,
        theta,
        baseRadius,
        size,
        color,
        speed: (Math.random() * 0.04 + 0.015) * (Math.random() > 0.5 ? 1 : -1),
        waveOffset: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.4 + 0.3,
      });
    }

    let time = 0;
    const perspective = 700;

    const render = () => {
      time += 0.045;

      const dark = isDark();

      // Use transparent background to let page color show through — no fill that blocks light mode
      // Just clear with very slight trail effect
      if (dark) {
        ctx.fillStyle = "rgba(10, 12, 30, 0.10)";
      } else {
        ctx.fillStyle = "rgba(248, 250, 252, 0.08)";
      }
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse coordinates
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      // Dome center — shifted down so the arch emerges from bottom
      const centerX = width / 2;
      const centerY = height * 1.2;

      // Sort particles by depth Z so we render back-to-front
      const projected = particles.map(p => {
        const currentPhi = p.phi + (p.speed * time * 0.05);

        const ripple = Math.sin(time * 0.25 + p.waveOffset) * 12;
        const r = p.baseRadius + ripple;

        let x3d = r * Math.cos(p.theta) * Math.sin(currentPhi);
        let y3d = -r * Math.sin(p.theta);
        let z3d = r * Math.cos(p.theta) * Math.cos(currentPhi);

        // Interactive mouse distortion
        const dx = x3d + centerX - mouseX;
        const dy = y3d + centerY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const force = (180 - dist) * 0.07;
          x3d += (dx / dist) * force;
          y3d += (dy / dist) * force;
        }

        const scale = perspective / (perspective + z3d);
        const x2d = centerX + x3d * scale;
        const y2d = centerY + y3d * scale;

        // Alpha: more visible on light mode, less on dark (blend modes differ)
        const depthAlpha = Math.max(0.05, scale * 0.8 * (1 - p.theta / (Math.PI * 0.5)));
        const baseAlpha = dark ? depthAlpha * 0.75 : depthAlpha * 0.55;

        return { x2d, y2d, size: p.size * scale, color: p.color, alpha: baseAlpha, z3d };
      });

      // Sort by Z depth
      projected.sort((a, b) => b.z3d - a.z3d);

      // Draw particles
      projected.forEach(p => {
        if (p.x2d < -10 || p.x2d > width + 10 || p.y2d < -10 || p.y2d > height + 10) return;

        ctx.beginPath();
        ctx.arc(p.x2d, p.y2d, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${Math.min(p.alpha, 0.9)})`;
        ctx.fill();

        // Glow halo for close/front particles
        if (p.size > 1.3 && p.alpha > 0.3) {
          ctx.beginPath();
          ctx.arc(p.x2d, p.y2d, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha * 0.12})`;
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none block"
      style={{ zIndex: 0 }}
    />
  );
}
