import * as React from "react";

const COLOR_PAIRS = [
  ["#bb0020", "#e30027"],
  ["#004577", "#0069b4"],
  ["#007900", "#009b00"],
  ["#cf5d01", "#ff780a"],
  ["#ddb009", "#ffcd14"],
];

const GOLD = ["#b8860b", "#ffd700", "#fff2b0"];

type ColorMode = "gold" | "colorful";

interface RibbonBurst {
  x: number;
  y: number;
  size: number;
  length: number;
  scale: number;
  depth: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  gradientColors: string[];
  life: number;
  fade: number;
  gravity: number;
  airDrag: number;
  wind: number;
}

function createBurstParticles(
  x: number,
  y: number,
  amount: number,
  colorMode: ColorMode,
  baseSize: number,
  baseLength: number,
  speedMult: number
): RibbonBurst[] {
  const particles: RibbonBurst[] = [];

  for (let i = 0; i < amount; i++) {
    const depth = 0.25 + Math.random() * 1.25;
    const scale = depth;
    const size = baseSize * depth * (0.15 + Math.random());
    const length = baseLength * depth * (0.5 + Math.random());
    const angle = Math.random() * Math.PI * 2;
    const speed = (2 + Math.random() * 4) * speedMult * depth;

    const gradientColors =
      colorMode === "colorful"
        ? COLOR_PAIRS[Math.floor(Math.random() * COLOR_PAIRS.length)]!
        : GOLD;

    particles.push({
      x,
      y,
      size,
      length,
      scale,
      depth,
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2 * depth,
      flip: 0,
      flipSpeed: 0.08 + Math.random() * 0.08,
      gradientColors: [...gradientColors],
      life: 4,
      fade: 0.015 + Math.random() * 0.015,
      gravity: 0.06 + Math.random() * 0.04,
      airDrag: 0.96 + Math.random() * 0.03,
      wind: (Math.random() - 0.5) * 0.05,
    });
  }

  return particles;
}

export function Confetti({ colorMode = "gold" }: { colorMode?: ColorMode }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const particlesRef = React.useRef<RibbonBurst[]>([]);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio ?? 1;
      w = canvas.width = Math.round(rect.width * dpr);
      h = canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const baseSize = 10;
    const baseLength = 6;
    const speedMult = 1.5;
    const amount = 80;

    const centerX = canvas.getBoundingClientRect().width / 2;
    const centerY = canvas.getBoundingClientRect().height / 2;

    particlesRef.current = createBurstParticles(
      centerX,
      centerY,
      amount,
      colorMode,
      baseSize,
      baseLength,
      speedMult
    );

    const drawParticle = (p: RibbonBurst) => {
      if (p.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(p.life * 0.9, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(p.scale * 0.8, p.scale * 0.8);

      const flipScale = Math.sin(p.flip);
      const grad = ctx.createLinearGradient(-p.size, 0, p.size, 0);
      if (p.gradientColors.length === 2) {
        grad.addColorStop(0, p.gradientColors[0]!);
        grad.addColorStop(1, p.gradientColors[1]!);
      } else {
        grad.addColorStop(0, p.gradientColors[0]!);
        grad.addColorStop(0.5, p.gradientColors[1]!);
        grad.addColorStop(1, p.gradientColors[2]!);
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-p.size * flipScale, 0);
      ctx.lineTo(p.size * flipScale, 0);
      ctx.lineTo(p.size * flipScale, p.length);
      ctx.lineTo(-p.size * flipScale, p.length);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      const dpr = window.devicePixelRatio ?? 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const particles = particlesRef.current;
      let allDead = true;

      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedX *= p.airDrag;
        p.speedY = p.speedY * p.airDrag + p.gravity;
        p.speedX += p.wind * p.depth;
        p.rotation += p.rotationSpeed;
        p.flip += p.flipSpeed;
        p.life -= p.fade;
        if (p.life > 0) allDead = false;
        drawParticle(p);
      }

      if (!allDead) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [colorMode]);

  return (
    <canvas
      ref={canvasRef}
      className="confetti-canvas"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
      }}
      width={1}
      height={1}
      aria-hidden
    />
  );
}
