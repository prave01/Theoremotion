"use client";

import { useEffect, useRef } from "react";

export function AuroraEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Aurora parameters
    let time = 0;
    const waves = [
      {
        amplitude: 80,
        frequency: 0.02,
        phase: 0,
        color: "rgba(0, 255, 150, 0.6)",
      },
      {
        amplitude: 60,
        frequency: 0.025,
        phase: Math.PI / 3,
        color: "rgba(100, 200, 255, 0.5)",
      },
      {
        amplitude: 100,
        frequency: 0.015,
        phase: Math.PI / 2,
        color: "rgba(200, 100, 255, 0.4)",
      },
      {
        amplitude: 70,
        frequency: 0.03,
        phase: Math.PI,
        color: "rgba(255, 100, 200, 0.3)",
      },
      {
        amplitude: 90,
        frequency: 0.018,
        phase: Math.PI * 1.5,
        color: "rgba(150, 255, 100, 0.5)",
      },
    ];

    const particles = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.8 + 0.2,
    }));

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.01;

      // Draw aurora waves
      waves.forEach((wave, index) => {
        ctx.beginPath();

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, wave.color);
        gradient.addColorStop(0.5, wave.color.replace(/[\d.]+\)$/g, "0.2)"));
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;

        // Create wavy aurora shape
        ctx.moveTo(0, canvas.height);

        for (let x = 0; x <= canvas.width; x += 5) {
          const baseY =
            canvas.height * 0.3 +
            Math.sin(x * wave.frequency + time * 2 + wave.phase) *
            wave.amplitude +
            Math.sin(x * wave.frequency * 2 + time * 3 + wave.phase) *
            wave.amplitude *
            0.5 +
            Math.sin(x * wave.frequency * 0.5 + time + wave.phase) *
            wave.amplitude *
            0.3;

          const flickerY = baseY + Math.sin(time * 10 + x * 0.1 + index) * 15;

          if (x === 0) {
            ctx.moveTo(x, flickerY);
          } else {
            ctx.lineTo(x, flickerY);
          }
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = wave.color.replace(/rgba?$$([^)]+)$$/, "rgba($1)");
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw twinkling particles (stars)
      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        const twinkle = Math.sin(time * 5 + particle.x * 0.01) * 0.5 + 0.5;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * twinkle})`;
        ctx.fill();

        // Add star glow
        ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-gray-900 via-black to-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          background:
            "radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)",
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center space-y-6 px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white/90 tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Aurora
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Experience the mesmerizing dance of the northern lights
          </p>
          <div className="flex justify-center space-x-4 pt-8">
            <button className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-full font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25">
              Explore
            </button>
            <button className="px-8 py-3 border border-white/30 text-white rounded-full font-semibold hover:bg-white/10 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
