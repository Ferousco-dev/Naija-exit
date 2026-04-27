import { useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_PARTICLES = 720;
const GREEN_PARTICLE = "rgba(61, 140, 70, 0.95)";
const WHITE_PARTICLE = "rgba(255, 255, 255, 0.98)";
const DIM_GREEN = "rgba(61, 140, 70, 0.45)";

// ─── Scroll stages (normalised 0-1 scroll progress) ──────────────────────────
// Stage 0 → 0.00 – 0.20 : logo (image sampled)
// Stage 1 → 0.20 – 0.45 : scatter / dissolve
// Stage 2 → 0.45 – 0.70 : plane silhouette coalesces
// Stage 3 → 0.70 – 1.00 : takeoff — plane drifts upward + fades
const STAGE_LOGO = { start: 0.0, end: 0.2 };
const STAGE_SCATTER = { start: 0.2, end: 0.45 };
const STAGE_PLANE = { start: 0.45, end: 0.82 };
const STAGE_TAKEOFF = { start: 0.82, end: 1.0 };

// Total page scroll depth assumed for full progress (px). Adjust to taste.
const SCROLL_DEPTH = 2800;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Ease t into [0,1] with a smooth-step curve */
function smoothstep(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

/** Returns a 0–1 progress value inside a stage window. */
function stageProgress(globalT, stage) {
  const t = (globalT - stage.start) / (stage.end - stage.start);
  return smoothstep(clamp(t, 0, 1));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── Image sampling ───────────────────────────────────────────────────────────
function getParticleStyle(r, g, b) {
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const minChannel = Math.min(r, g, b);
  const maxChannel = Math.max(r, g, b);
  const channelSpread = maxChannel - minChannel;
  const isPlane = luminance > 185 && minChannel > 150 && channelSpread < 90;
  return isPlane
    ? { color: WHITE_PARTICLE, radius: 2.15, glow: "rgba(255,255,255,0.85)" }
    : { color: GREEN_PARTICLE, radius: 1.55, glow: "rgba(85,194,105,0.5)" };
}

function buildLogoTargets(image, width, height, particleCount) {
  const offscreen = document.createElement("canvas");
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  const maxLogoSize = Math.min(width, height) * 0.54;
  const ratio = image.width / image.height;
  const drawW = ratio >= 1 ? maxLogoSize : maxLogoSize * ratio;
  const drawH = ratio >= 1 ? maxLogoSize / ratio : maxLogoSize;
  const offX = (width - drawW) / 2;
  const offY = (height - drawH) / 2;

  offscreen.width = Math.max(1, Math.floor(width));
  offscreen.height = Math.max(1, Math.floor(height));
  ctx.clearRect(0, 0, offscreen.width, offscreen.height);
  ctx.drawImage(image, offX, offY, drawW, drawH);

  const { data } = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
  const bg = { r: data[0] || 0, g: data[1] || 0, b: data[2] || 0 };

  const candidates = [];
  const step = clamp(
    Math.floor(Math.sqrt((drawW * drawH) / particleCount) * 0.9),
    4,
    10,
  );

  for (let y = 0; y < offscreen.height; y += step) {
    for (let x = 0; x < offscreen.width; x += step) {
      const i = (y * offscreen.width + x) * 4;
      if (data[i + 3] < 30) continue;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const delta =
        Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b);
      if (delta < 38) continue;
      const style = getParticleStyle(r, g, b);
      candidates.push({
        x,
        y,
        color: style.color,
        radius: style.radius,
        glow: style.glow,
      });
    }
  }

  if (candidates.length <= particleCount) return candidates;
  const s = candidates.length / particleCount;
  return Array.from(
    { length: particleCount },
    (_, i) => candidates[Math.floor(i * s)],
  );
}

// ─── Procedural shape generators ─────────────────────────────────────────────

/**
 * "Scatter" cloud: particles orbit random positions around the screen centre
 * in loose elliptical rings – gives an "exploding / dissolving" feel.
 */
function buildScatterTargets(width, height, particleCount) {
  const cx = width / 2;
  const cy = height / 2;
  const targets = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 * 7.3; // golden-angle-ish spiral
    const radiusX = (Math.random() * 0.28 + 0.08) * width;
    const radiusY = (Math.random() * 0.22 + 0.06) * height;
    const jitter = (Math.random() - 0.5) * 60;

    // Alternate between green and dim-green for texture
    const isWhite = Math.random() < 0.12;
    targets.push({
      x: cx + Math.cos(angle) * radiusX + jitter,
      y: cy + Math.sin(angle) * radiusY + jitter,
      color: isWhite ? WHITE_PARTICLE : DIM_GREEN,
      radius: isWhite ? 1.8 : 1.2,
      glow: isWhite ? "rgba(255,255,255,0.6)" : "rgba(61,140,70,0.3)",
    });
  }
  return targets;
}

/**
 * Plane silhouette – a stylised side-view of the plane in image.png.
 * Built from simple parametric curves so it matches the brand feel.
 * The plane is centred on (cx, cy) and scaled to fill ~55% of the narrower dimension.
 */
function buildPlaneTargets(width, height, particleCount) {
  const cx = width / 2;
  const cy = height / 2;
  const scale = Math.min(width, height) * 0.0022; // tune-able

  const filled = [];

  // We sample a dense grid of procedural points that form a filled aircraft silhouette.
  // Each point is kept only if it lies inside one of the plane's body regions.

  const gridW = Math.floor(width * 0.7);
  const gridH = Math.floor(height * 0.35);
  const startX = cx - gridW / 2;
  const startY = cy - gridH / 2;
  const sampleStep = Math.max(
    3,
    Math.floor(Math.sqrt((gridW * gridH) / (particleCount * 6))),
  );

  for (let gy = 0; gy < gridH; gy += sampleStep) {
    for (let gx = 0; gx < gridW; gx += sampleStep) {
      // Normalised coordinates relative to plane centre
      const nx = (gx - gridW / 2) / (gridW / 2); // -1 … 1  (left=nose → right=tail)
      const ny = (gy - gridH / 2) / (gridH / 2); // -1 … 1

      if (isInsidePlane(nx, ny, scale)) {
        const x = startX + gx;
        const y = startY + gy;
        const isWing = isInWing(nx, ny);
        const isBody = Math.abs(ny) < 0.14;

        filled.push({
          x,
          y,
          color: isBody ? WHITE_PARTICLE : GREEN_PARTICLE,
          radius: isBody ? 2.0 : 1.4,
          glow: isBody ? "rgba(255,255,255,0.8)" : "rgba(85,194,105,0.55)",
        });
      }
    }
  }

  if (filled.length === 0)
    return buildScatterTargets(width, height, particleCount);
  if (filled.length <= particleCount) return filled;

  const s = filled.length / particleCount;
  return Array.from(
    { length: particleCount },
    (_, i) => filled[Math.floor(i * s)],
  );
}

/**
 * Plane interior test (right-pointing aircraft, fuselage horizontal).
 * nx in [-1,1], ny in [-1,1]. Returns true if point is inside a simplified plane.
 */
function isInsidePlane(nx, ny) {
  // ── Fuselage ──────────────────────────────────────────────────────────────
  const fuselageHalfH = 0.13;
  const fuselageLeft = -0.85;
  const fuselageRight = 0.72;
  // Taper nose
  const noseProgress = clamp((nx - fuselageRight) / 0.28, 0, 1);
  const fuselageHH =
    nx > fuselageRight
      ? fuselageHalfH * (1 - noseProgress) // taper to nose
      : fuselageHalfH;

  const inFuselage =
    nx >= fuselageLeft &&
    nx <= fuselageRight + 0.28 &&
    Math.abs(ny) <= fuselageHH;

  // ── Main wing (swept, thick root) ─────────────────────────────────────────
  // Wing sweeps from x≈0.1 at root (y≈±0.13) to x≈-0.35 at tip (y≈±0.72)
  const wingRootX = 0.18;
  const wingTipX = -0.28;
  const wingTipAbs = 0.72;
  const wingRootAbs = 0.14;

  let inMainWing = false;
  if (Math.abs(ny) >= wingRootAbs && Math.abs(ny) <= wingTipAbs) {
    const wnorm = (Math.abs(ny) - wingRootAbs) / (wingTipAbs - wingRootAbs);
    const wingLeadingEdge = lerp(wingRootX, wingTipX, wnorm);
    const wingTrailingEdge = lerp(0.42, -0.08, wnorm);
    inMainWing = nx >= wingLeadingEdge && nx <= wingTrailingEdge;
  }

  // ── Tail / stabilizer (small horizontal) ─────────────────────────────────
  const tailRootX = -0.62;
  const tailTipX = -0.82;
  const tailSpanAbs = 0.35;
  const tailRootAbs = 0.13;

  let inTail = false;
  if (Math.abs(ny) >= tailRootAbs && Math.abs(ny) <= tailSpanAbs) {
    const tnorm = (Math.abs(ny) - tailRootAbs) / (tailSpanAbs - tailRootAbs);
    const tLeadingEdge = lerp(tailRootX, tailTipX, tnorm);
    const tTrailingEdge = lerp(-0.52, -0.88, tnorm);
    inTail = nx >= tLeadingEdge && nx <= tTrailingEdge;
  }

  // ── Vertical tail (fin) ───────────────────────────────────────────────────
  const inFin = nx >= -0.88 && nx <= -0.55 && ny >= -0.55 && ny <= -0.12;

  return inFuselage || inMainWing || inTail || inFin;
}

function isInWing(nx, ny) {
  return Math.abs(ny) >= 0.14;
}

// ─── Particle creation ────────────────────────────────────────────────────────
function createParticles(width, height, targets) {
  return targets.map((t) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 2.8,
    vy: (Math.random() - 0.5) * 2.8,
    targetX: t.x,
    targetY: t.y,
    radius: t.radius,
    color: t.color,
    glow: t.glow,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ParticleSquareCanvas({
  particleCount = DEFAULT_PARTICLES,
  imageSrc = "/image.png",
  scrollY = 0, // raw scrollY from Landing.jsx
  scrollDepth = SCROLL_DEPTH,
  style,
}) {
  const canvasRef = useRef(null);

  // We use a ref to hand scroll progress to the animation loop without re-mounting.
  const scrollRef = useRef(0);
  useEffect(() => {
    scrollRef.current = clamp(scrollY / scrollDepth, 0, 1);
  }, [scrollY, scrollDepth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const state = {
      width: 0,
      height: 0,
      raf: 0,
      particles: [],
      // Four target arrays that we lerp between
      targets: {
        logo: [],
        scatter: [],
        plane: [],
      },
      image: null,
      mouse: { x: -9999, y: -9999, active: false },
      // Lift offset for takeoff stage (in pixels, grows upward)
      liftY: 0,
    };

    let disposed = false;

    // ── Build all target sets ──────────────────────────────────────────────
    const rebuildTargets = () => {
      const { width, height } = state;
      if (!state.image) return;

      state.targets.logo = buildLogoTargets(
        state.image,
        width,
        height,
        particleCount,
      );
      state.targets.scatter = buildScatterTargets(width, height, particleCount);
      state.targets.plane = buildPlaneTargets(width, height, particleCount);
    };

    // ── Resize ────────────────────────────────────────────────────────────
    const resize = () => {
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      state.width = w;
      state.height = h;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildTargets();

      if (state.particles.length === 0 && state.targets.logo.length > 0) {
        state.particles = createParticles(w, h, state.targets.logo);
      } else if (state.targets.logo.length > 0) {
        resyncParticleCount();
      }
    };

    const resyncParticleCount = () => {
      const logoTargets = state.targets.logo;
      const { width, height } = state;
      state.particles = logoTargets.map((t, i) => {
        const existing = state.particles[i];
        if (!existing) {
          return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0,
            targetX: t.x,
            targetY: t.y,
            radius: t.radius,
            color: t.color,
            glow: t.glow,
          };
        }
        return { ...existing, targetX: t.x, targetY: t.y };
      });
    };

    // ── Pointer ───────────────────────────────────────────────────────────
    const onMove = (e) => {
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;
      state.mouse.active = true;
    };
    const onLeave = () => {
      state.mouse.active = false;
      state.mouse.x = -9999;
      state.mouse.y = -9999;
    };

    // ── Per-particle target resolver (interpolated) ───────────────────────
    /**
     * Given globalT (0–1 scroll progress) and particle index,
     * returns the interpolated (tx, ty, color, radius, glow).
     */
    const resolveTarget = (globalT, i) => {
      const logo = state.targets.logo[i] || state.targets.logo[0];
      const scatter = state.targets.scatter[i] || state.targets.scatter[0];
      const plane = state.targets.plane[i] || state.targets.plane[0];

      // Stage 0: pure logo
      if (globalT <= STAGE_LOGO.end) {
        return logo;
      }

      // Stage 1: logo → scatter
      if (globalT <= STAGE_SCATTER.end) {
        const t = stageProgress(globalT, STAGE_SCATTER);
        return lerpTarget(logo, scatter, t);
      }

      // Stage 2: scatter → plane
      if (globalT <= STAGE_PLANE.end) {
        const t = stageProgress(globalT, STAGE_PLANE);
        return lerpTarget(scatter, plane, t);
      }

      // Stage 3: takeoff — plane stays, but we apply a vertical lift in render
      return plane;
    };

    // ── Render loop ───────────────────────────────────────────────────────
    const render = () => {
      const globalT = scrollRef.current;
      const { width, height } = state;

      // Takeoff lift: how far UP the entire plane floats (px)
      const takeoffT = stageProgress(globalT, STAGE_TAKEOFF);
      state.liftY = takeoffT * height * 0.22; // stays visible deeper into the page

      ctx.clearRect(0, 0, width, height);

      const {
        mouse: { x: mx, y: my, active: mouseActive },
        particles,
      } = state;

      const ease = 0.048;
      const damping = 0.89;
      const repelR = 125;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (state.targets.logo.length === 0) continue;

        const target = resolveTarget(globalT, i);

        // Apply takeoff lift to the target position
        const tY = target.y - state.liftY;
        const tX = target.x;

        // Ease towards (possibly lifted) target
        p.vx += (tX - p.x) * ease;
        p.vy += (tY - p.y) * ease;

        // Mouse repulsion
        if (mouseActive) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < repelR) {
            const strength = (1 - dist / repelR) * 9.5;
            const angle = Math.atan2(dy, dx);
            p.vx -= Math.cos(angle) * strength;
            p.vy -= Math.sin(angle) * strength;
          }
        }

        p.vx *= damping;
        p.vy *= damping;
        p.x += p.vx;
        p.y += p.vy;

        // Fade out particles that are out of viewport during takeoff
        let alpha = 1;
        if (globalT > STAGE_TAKEOFF.start) {
          const offscreenFraction = clamp(-p.y / (height * 0.2), 0, 1);
          alpha = Math.max(0.2, 1 - offscreenFraction * takeoffT * 0.6);
        }
        if (alpha <= 0.01) continue;

        // Draw
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = target.color === WHITE_PARTICLE ? 14 : 10;
        ctx.shadowColor = target.glow;
        ctx.fillStyle = target.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, target.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      state.raf = requestAnimationFrame(render);
    };

    // ── Boot ──────────────────────────────────────────────────────────────
    loadImage(imageSrc)
      .then((img) => {
        if (disposed) return;
        state.image = img;
        resize();
        render();
      })
      .catch(() => {
        if (disposed) return;
        state.particles = [];
      });

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    return () => {
      disposed = true;
      cancelAnimationFrame(state.raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
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

// ── Colour / position interpolation helpers ───────────────────────────────────
function lerpTarget(a, b, t) {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    radius: lerp(a.radius, b.radius, t),
    color: t < 0.5 ? a.color : b.color,
    glow: t < 0.5 ? a.glow : b.glow,
  };
}
