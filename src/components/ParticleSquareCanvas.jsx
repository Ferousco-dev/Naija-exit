import { useEffect, useRef } from "react";

const DEFAULT_PARTICLES = 720;
const GREEN_PARTICLE = "rgba(61, 140, 70, 0.95)";
const WHITE_PARTICLE = "rgba(255, 255, 255, 0.98)";

function getParticleStyle(r, g, b) {
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const minChannel = Math.min(r, g, b);
  const maxChannel = Math.max(r, g, b);
  const channelSpread = maxChannel - minChannel;
  const isPlane = luminance > 185 && minChannel > 150 && channelSpread < 90;

  return isPlane
    ? {
        color: WHITE_PARTICLE,
        radius: 2.15,
        glow: "rgba(255,255,255,0.85)",
      }
    : {
        color: GREEN_PARTICLE,
        radius: 1.55,
        glow: "rgba(85, 194, 105, 0.5)",
      };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function buildTargetsFromImage(image, width, height, particleCount) {
  const offscreen = document.createElement("canvas");
  const context = offscreen.getContext("2d", { willReadFrequently: true });
  if (!context) return [];

  const maxLogoSize = Math.min(width, height) * 0.54;
  const imageRatio = image.width / image.height;
  const drawWidth = imageRatio >= 1 ? maxLogoSize : maxLogoSize * imageRatio;
  const drawHeight = imageRatio >= 1 ? maxLogoSize / imageRatio : maxLogoSize;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  offscreen.width = Math.max(1, Math.floor(width));
  offscreen.height = Math.max(1, Math.floor(height));

  context.clearRect(0, 0, offscreen.width, offscreen.height);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  const { data } = context.getImageData(0, 0, offscreen.width, offscreen.height);
  const backgroundSample = {
    r: data[0] || 0,
    g: data[1] || 0,
    b: data[2] || 0,
  };

  const candidates = [];
  const sampleStep = clamp(
    Math.floor(Math.sqrt((drawWidth * drawHeight) / particleCount) * 0.9),
    4,
    10,
  );

  for (let y = 0; y < offscreen.height; y += sampleStep) {
    for (let x = 0; x < offscreen.width; x += sampleStep) {
      const index = (y * offscreen.width + x) * 4;
      const alpha = data[index + 3];
      if (alpha < 30) continue;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const delta =
        Math.abs(r - backgroundSample.r) +
        Math.abs(g - backgroundSample.g) +
        Math.abs(b - backgroundSample.b);

      // Keep only pixels that belong to the visible logo, not the flat bg.
      if (delta < 38) continue;

      const particleStyle = getParticleStyle(r, g, b);

      candidates.push({
        x,
        y,
        color: particleStyle.color,
        radius: particleStyle.radius,
        glow: particleStyle.glow,
      });
    }
  }

  if (candidates.length <= particleCount) {
    return candidates;
  }

  const step = candidates.length / particleCount;
  return Array.from({ length: particleCount }, (_, index) => {
    const candidateIndex = Math.floor(index * step);
    return candidates[candidateIndex];
  });
}

function createParticles(width, height, targets) {
  return targets.map((target) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 2.8,
    vy: (Math.random() - 0.5) * 2.8,
    targetX: target.x,
    targetY: target.y,
    radius: target.radius,
    color: target.color,
    glow: target.glow,
  }));
}

export default function ParticleSquareCanvas({
  particleCount = DEFAULT_PARTICLES,
  imageSrc = "/image.png",
  style,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return undefined;

    const state = {
      width: 0,
      height: 0,
      animationFrame: 0,
      particles: [],
      image: null,
      mouse: {
        x: -9999,
        y: -9999,
        active: false,
      },
    };

    let disposed = false;

    const syncTargets = () => {
      if (!state.image) return;

      const targets = buildTargetsFromImage(
        state.image,
        state.width,
        state.height,
        particleCount,
      );

      if (state.particles.length === 0) {
        state.particles = createParticles(state.width, state.height, targets);
        return;
      }

      state.particles = targets.map((target, index) => {
        const particle = state.particles[index];
        if (!particle) {
          return {
            x: Math.random() * state.width,
            y: Math.random() * state.height,
            vx: 0,
            vy: 0,
            targetX: target.x,
            targetY: target.y,
            radius: target.radius,
            color: target.color,
            glow: target.glow,
          };
        }

        return {
          ...particle,
          targetX: target.x,
          targetY: target.y,
          radius: target.radius,
          color: target.color,
          glow: target.glow,
        };
      });
    };

    const resize = () => {
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      state.width = width;
      state.height = height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      syncTargets();
    };

    const handlePointerMove = (event) => {
      state.mouse.x = event.clientX;
      state.mouse.y = event.clientY;
      state.mouse.active = true;
    };

    const handlePointerLeave = () => {
      state.mouse.active = false;
      state.mouse.x = -9999;
      state.mouse.y = -9999;
    };

    const updateParticle = (particle) => {
      const ease = 0.05;
      const damping = 0.9;
      const interactionRadius = 125;
      const dx = state.mouse.x - particle.x;
      const dy = state.mouse.y - particle.y;
      const distance = Math.hypot(dx, dy) || 1;

      // Ease the particle back toward the sampled logo pixel.
      particle.vx += (particle.targetX - particle.x) * ease;
      particle.vy += (particle.targetY - particle.y) * ease;

      // Repel nearby particles so the cursor feels like it slices the logo.
      if (state.mouse.active && distance < interactionRadius) {
        const strength = (1 - distance / interactionRadius) * 9.5;
        const angle = Math.atan2(dy, dx);
        particle.vx -= Math.cos(angle) * strength;
        particle.vy -= Math.sin(angle) * strength;
      }

      particle.vx *= damping;
      particle.vy *= damping;
      particle.x += particle.vx;
      particle.y += particle.vy;
    };

    const render = () => {
      context.clearRect(0, 0, state.width, state.height);

      for (const particle of state.particles) {
        updateParticle(particle);
        context.shadowBlur = particle.color === WHITE_PARTICLE ? 14 : 10;
        context.shadowColor = particle.glow;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }

      state.animationFrame = window.requestAnimationFrame(render);
    };

    loadImage(imageSrc)
      .then((image) => {
        if (disposed) return;
        state.image = image;
        resize();
        render();
      })
      .catch(() => {
        if (disposed) return;
        state.particles = [];
      });

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(state.animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, [imageSrc, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.8,
        ...style,
      }}
    />
  );
}
