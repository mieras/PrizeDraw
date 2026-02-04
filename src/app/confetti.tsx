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

function createFallingRibbons(
  width: number,
  height: number,
  amount: number,
  colorMode: ColorMode,
  baseSize: number,
  baseLength: number,
  speedMult: number
): FallingRibbon[] {
  const ribbons: FallingRibbon[] = [];

  for (let i = 0; i < amount; i++) {
    const gradientColors =
      colorMode === "colorful"
        ? COLOR_PAIRS[Math.floor(Math.random() * COLOR_PAIRS.length)]!
        : GOLD;

    ribbons.push({
      x: Math.random() * width,
      y: Math.random() * -height - baseLength * 2,
      size: baseSize * (0.5 + Math.random()),
      length: baseLength * (0.5 + Math.random()),
      speedY: (1 + Math.random() * 2) * speedMult,
      speedX: (Math.random() - 0.5) * 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: 0.03 + Math.random() * 0.05,
      flip: 0,
      flipSpeed: 0.08 + Math.random() * 0.08,
      gradientColors: [...gradientColors],
    });
  }

  return ribbons;
}

export function Confetti({ colorMode = "gold" }: { colorMode?: ColorMode }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const ribbonsRef = React.useRef<FallingRibbon[]>([]);
  const rafRef = React.useRef<number>(0);
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
    window.addEventListener("resize", resize);

    const baseSize = 12;
    const baseLength = 8;
    const speedMult = 3;
    const amount = 120;

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

    const animate = () => {
      const { w, h, hCss } = dimensionsRef.current;
      const dpr = window.devicePixelRatio ?? 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const ribbons = ribbonsRef.current;
      let allBelow = true;

      for (const r of ribbons) {
        r.y += r.speedY;
        r.x += r.speedX;
        r.rotation += r.rotationSpeed;
        r.flip += r.flipSpeed;

        if (r.y < hCss + r.length) {
          allBelow = false;
          drawRibbon(r);
        }
      }

      if (!allBelow) {
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
