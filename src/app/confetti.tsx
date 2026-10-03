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

interface FallingRibbon {
  x: number;
  y: number;
  size: number;
  length: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  gradientColors: string[];
}

function createRibbon(
  width: number,
  height: number,
  colorMode: ColorMode,
  baseSize: number,
  baseLength: number,
  speedMult: number,
  startAbove = true
): FallingRibbon {
  const gradientColors =
    colorMode === "colorful"
      ? COLOR_PAIRS[Math.floor(Math.random() * COLOR_PAIRS.length)]!
      : GOLD;

  return {
    x: Math.random() * width,
    y: startAbove
      ? Math.random() * -height * 1.4 - baseLength * 2
      : -(Math.random() * height * 0.35 + baseLength * 2),
    size: baseSize * (0.5 + Math.random()),
    length: baseLength * (0.5 + Math.random()),
    speedY: (0.7 + Math.random() * 1.5) * speedMult,
    speedX: (Math.random() - 0.5) * 0.9,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: 0.03 + Math.random() * 0.05,
    flip: 0,
    flipSpeed: 0.08 + Math.random() * 0.08,
    gradientColors: [...gradientColors],
  };
}

function createFallingRibbons(
  width: number,
  height: number,
  amount: number,
  colorMode: ColorMode,
  baseSize: number,
  baseLength: number,
  speedMult: number
): FallingRibbon[] {
  return Array.from({ length: amount }, () =>
    createRibbon(width, height, colorMode, baseSize, baseLength, speedMult, true)
  );
}

type ConfettiProps = {
  colorMode?: ColorMode;
  contained?: boolean;
  className?: string;
  /** Delay before the first ribbons start falling (ms). */
  startDelayMs?: number;
  /** Keep recycling ribbons until this duration after start (ms). */
  durationMs?: number;
};

export function Confetti({
  colorMode = "gold",
  contained = false,
  className,
  startDelayMs = contained ? 900 : 0,
  durationMs = contained ? 10000 : 4500,
}: ConfettiProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const ribbonsRef = React.useRef<FallingRibbon[]>([]);
  const rafRef = React.useRef<number>(0);
  const startTimeoutRef = React.useRef<number>(0);
  const dimensionsRef = React.useRef({ w: 0, h: 0, wCss: 0, hCss: 0 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio ?? 1;
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      canvas.width = w;
      canvas.height = h;
      dimensionsRef.current = { w, h, wCss: rect.width, hCss: rect.height };
    };

    resize();

    const observer =
      contained && canvas.parentElement
        ? new ResizeObserver(() => {
            resize();
          })
        : null;

    if (observer && canvas.parentElement) {
      observer.observe(canvas.parentElement);
    } else {
      window.addEventListener("resize", resize);
    }

    const baseSize = contained ? 10 : 12;
    const baseLength = contained ? 7 : 8;
    const speedMult = contained ? 1.55 : 2.2;
    const amount = contained ? 110 : 120;

    const drawRibbon = (r: FallingRibbon) => {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rotation);
      const flipScale = Math.sin(r.flip);

      const grad = ctx.createLinearGradient(-r.size, 0, r.size, 0);
      if (r.gradientColors.length === 2) {
        grad.addColorStop(0, r.gradientColors[0]!);
        grad.addColorStop(1, r.gradientColors[1]!);
      } else {
        grad.addColorStop(0, r.gradientColors[0]!);
        grad.addColorStop(0.5, r.gradientColors[1]!);
        grad.addColorStop(1, r.gradientColors[2]!);
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-r.size * flipScale, 0);
      ctx.lineTo(r.size * flipScale, 0);
      ctx.lineTo(r.size * flipScale, r.length);
      ctx.lineTo(-r.size * flipScale, r.length);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    let startedAt = 0;
    let recycling = true;

    const animate = (now: number) => {
      if (!startedAt) {
        startedAt = now;
      }

      const { w, h, wCss, hCss } = dimensionsRef.current;
      const dpr = window.devicePixelRatio ?? 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (now - startedAt >= durationMs) {
        recycling = false;
      }

      const ribbons = ribbonsRef.current;
      let visibleCount = 0;

      for (const r of ribbons) {
        r.y += r.speedY;
        r.x += r.speedX;
        r.rotation += r.rotationSpeed;
        r.flip += r.flipSpeed;

        if (r.y > hCss + r.length) {
          if (recycling) {
            const next = createRibbon(wCss, hCss, colorMode, baseSize, baseLength, speedMult, false);
            Object.assign(r, next);
            visibleCount += 1;
            drawRibbon(r);
          }
          continue;
        }

        visibleCount += 1;
        drawRibbon(r);
      }

      if (visibleCount > 0 || recycling) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    startTimeoutRef.current = window.setTimeout(() => {
      const { wCss, hCss } = dimensionsRef.current;
      ribbonsRef.current = createFallingRibbons(
        wCss,
        hCss,
        amount,
        colorMode,
        baseSize,
        baseLength,
        speedMult
      );
      rafRef.current = requestAnimationFrame(animate);
    }, startDelayMs);

    return () => {
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener("resize", resize);
      }
      window.clearTimeout(startTimeoutRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [colorMode, contained, durationMs, startDelayMs]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={
        contained
          ? {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1,
            }
          : {
              position: "fixed",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 5,
            }
      }
      width={1}
      height={1}
      aria-hidden
    />
  );
}
