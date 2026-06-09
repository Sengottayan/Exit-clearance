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
    const particleCount = Math.min(350, Math.floor(width / 3.5));
    const particles: Particle[] = [];

    // Base config
    const baseRadius = Math.max(width, height) * 0.55;
    
    for (let i = 0; i < particleCount; i++) {
      // phi around the circle (0 to 2*PI)
      const phi = Math.random() * Math.PI * 2;
      // theta upwards (0 to PI/2 to form a top dome)
      const theta = Math.pow(Math.random(), 1.5) * (Math.PI * 0.45);
      
      const size = Math.random() * 1.5 + 0.6;
      
      // Determine colors: Primary blue/Indigo split adapted to brand
      const isPrimary = Math.random() > 0.45;
      const color = isPrimary ? "59, 130, 246" : "99, 102, 241"; // Brand Blue/Indigo RGB
      
      particles.push({
        phi,
        theta,
        baseRadius,
        size,
        color,
        speed: (Math.random() * 0.05 + 0.02) * (Math.random() > 0.5 ? 1 : -1),
        waveOffset: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;
    const perspective = 700; // Camera distance / depth

    const render = () => {
      time += 0.05;
      
      // Clear canvas with a very soft radial black/dark-blue background gradient
      ctx.fillStyle = "rgba(10, 15, 30, 0.12)"; // Fades previous frame to create fine trails
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse coordinates (linear interpolation)
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      // Dome center (shifted down near the bottom of screen to create the arch)
      const centerX = width / 2;
      const centerY = height * 1.25;

      // Sort particles by depth Z so we render back-to-front
      const projected = particles.map(p => {
        // Current angle includes rotation over time
        const currentPhi = p.phi + (p.speed * time * 0.05);
        
        // Add dynamic wave ripple along the radius
        const ripple = Math.sin(time * 0.3 + p.waveOffset) * 15;
        const r = p.baseRadius + ripple;

        // Convert spherical coords to 3D Cartesian coords
        let x3d = r * Math.cos(p.theta) * Math.sin(currentPhi);
        let y3d = -r * Math.sin(p.theta); // Pointing upwards
        let z3d = r * Math.cos(p.theta) * Math.cos(currentPhi);

        // Interactive mouse distortion: push particles slightly away
        const dx = x3d + centerX - mouseX;
        const dy = y3d + centerY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) * 0.08;
          x3d += (dx / dist) * force;
          y3d += (dy / dist) * force;
        }

        // Project 3D to 2D
        const scale = perspective / (perspective + z3d);
        const x2d = centerX + x3d * scale;
        const y2d = centerY + y3d * scale;

        // Fading opacity based on Z-depth (back-facing particles are faint)
        const alpha = Math.max(0.08, scale * 0.75 * (1 - p.theta / (Math.PI * 0.5)));

        return { x2d, y2d, size: p.size * scale, color: p.color, alpha, z3d };
      });

      // Sort by Z depth (descending so we draw back particles first to prevent visual overlap bugs)
      projected.sort((a, b) => b.z3d - a.z3d);

      // Draw particles
      projected.forEach(p => {
        if (p.x2d < 0 || p.x2d > width || p.y2d < 0 || p.y2d > height) return;

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x2d, p.y2d, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();

        // Faint glow for larger dots close to camera
        if (p.size > 1.2 && p.alpha > 0.4) {
          ctx.beginPath();
          ctx.arc(p.x2d, p.y2d, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha * 0.15})`;
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
      className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none block"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
