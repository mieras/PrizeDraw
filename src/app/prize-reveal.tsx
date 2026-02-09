import * as React from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import type { DrawResult } from "./draw";
import styles from "./style.module.css";

type PrizeRevealProps = {
  drawResult: DrawResult;
  reducedMotion: boolean;
};

const MIN_VALUE = 0.5;
const MAX_VALUE = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function capitalize(input: string): string {
  if (!input) {
    return "";
  }
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export function PrizeReveal({ drawResult, reducedMotion }: PrizeRevealProps) {
  const title = capitalize(drawResult.prizeLabel);
  const normalizedValue = clamp((drawResult.revealValue - MIN_VALUE) / (MAX_VALUE - MIN_VALUE), 0, 1);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const descRefs = React.useRef<HTMLParagraphElement[]>([]);

  React.useEffect(() => {
    gsap.registerPlugin(SplitText);
  }, []);

  React.useLayoutEffect(() => {
    if (!rootRef.current || !imageRef.current || !titleRef.current) {
      return;
    }

    const descriptions = descRefs.current.filter(Boolean);

    if (reducedMotion) {
      gsap.set([imageRef.current, titleRef.current, ...descriptions], {
        clearProps: "all",
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      });
      return;
    }

    const imageDuration = 0.55 + normalizedValue * 0.8;
    const startScale = 1.08 + normalizedValue * 0.22;
    const startBlur = 8 + normalizedValue * 18;
    const charStagger = 0.018 + normalizedValue * 0.03;
    const charDuration = 0.34 + normalizedValue * 0.32;
    const descDuration = 0.44 + normalizedValue * 0.22;

    const ctx = gsap.context(() => {
      let split: SplitText | null = null;

      try {
        split = new SplitText(titleRef.current, {
          type: "words,chars",
          wordsClass: "revealWord",
          charsClass: "revealChar",
        });
      } catch {
        split = null;
      }

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline.fromTo(
        imageRef.current,
        { autoAlpha: 0, scale: startScale, filter: `blur(${startBlur}px)` },
        { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: imageDuration }
      );

      if (split?.chars?.length) {
        gsap.set(titleRef.current, { autoAlpha: 1, filter: "blur(0px)" });
        timeline.from(
          split.chars,
          {
            autoAlpha: 0,
            yPercent: 65,
            filter: "blur(6px)",
            duration: charDuration,
            stagger: charStagger,
          },
          ">-0.05"
        );
      } else {
        timeline.fromTo(
          titleRef.current,
          { autoAlpha: 0, y: 20, filter: "blur(6px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 },
          ">-0.05"
        );
      }

      if (descriptions.length > 0) {
        timeline.fromTo(
          descriptions,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: descDuration, stagger: 0.1, ease: "power2.out" },
          ">-0.08"
        );
      }

      return () => {
        timeline.kill();
        split?.revert();
      };
    }, rootRef);

    return () => ctx.revert();
  }, [drawResult.prize.url, normalizedValue, reducedMotion, title]);

  const imageBlurPx = 8 + normalizedValue * 18;
  const imageScale = 1.08 + normalizedValue * 0.22;

  const descriptionLines: string[] = [];
  if ("uitslagTitle" in drawResult.prize && drawResult.prize.uitslagTitle && drawResult.prize.uitslagTitle !== "-") {
    descriptionLines.push(drawResult.prize.uitslagTitle);
  }
  if ("omschrijvingKort" in drawResult.prize && drawResult.prize.omschrijvingKort) {
    descriptionLines.push(drawResult.prize.omschrijvingKort);
  }
  descRefs.current = [];

  return (
    <div
      ref={rootRef}
      className={styles.prizeReveal}
      style={
        {
          "--reveal-image-blur": `${imageBlurPx}px`,
          "--reveal-image-scale": imageScale.toFixed(3),
        } as React.CSSProperties
      }
    >
      <img ref={imageRef} className={`${styles.resultImage} ${styles.revealImage}`} src={drawResult.prize.url} alt={drawResult.prizeLabel} />

      <h3 ref={titleRef} className={`${styles.resultPrize} ${styles.revealTitle}`} aria-label={title}>
        {title}
      </h3>

      {descriptionLines.map((line, index) => (
        <p
          key={`${line.slice(0, 24)}-${index}`}
          ref={(node) => {
            if (node) {
              descRefs.current[index] = node;
            }
          }}
          className={`${styles.resultInfo} ${styles.revealDescription}`}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
