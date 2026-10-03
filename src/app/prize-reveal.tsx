import * as React from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import type { DrawResult } from "./draw";
import type { TrekkingOption } from "./trekking";
import styles from "./style.module.css";

type PrizeRevealProps = {
  drawResult: DrawResult;
  trekking: TrekkingOption;
  reducedMotion: boolean;
  onReset: () => void;
};

const MIN_VALUE = 0.5;
const MAX_VALUE = 10;
const MY_ACCOUNT_URL = "https://www.postcodeloterij.nl/topmenu/inloggen";
const UITSLAGEN_URL = "https://www.postcodeloterij.nl/uitslagen";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function capitalize(input: string): string {
  if (!input) {
    return "";
  }
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function getPrizeTitle(drawResult: DrawResult): string {
  if ("title" in drawResult.prize && typeof drawResult.prize.title === "string" && drawResult.prize.title) {
    return drawResult.prize.title;
  }
  return capitalize(drawResult.prizeLabel);
}

function getAboutText(drawResult: DrawResult): string {
  if ("uitslagTitle" in drawResult.prize && drawResult.prize.uitslagTitle && drawResult.prize.uitslagTitle !== "-") {
    return drawResult.prize.uitslagTitle.replace(/\s*Je vindt hier meer informatie over deze prijs\s*›?\s*$/i, "").trim();
  }
  if ("omschrijvingKort" in drawResult.prize && drawResult.prize.omschrijvingKort) {
    return drawResult.prize.omschrijvingKort;
  }
  return `Heb je ${drawResult.prizeLabel} gewonnen? Gefeliciteerd!`;
}

function getDetailBullets(drawResult: DrawResult): string[] {
  const short =
    "omschrijvingKort" in drawResult.prize && drawResult.prize.omschrijvingKort
      ? drawResult.prize.omschrijvingKort
      : "";
  const full =
    "omschrijvingFull" in drawResult.prize && drawResult.prize.omschrijvingFull
      ? drawResult.prize.omschrijvingFull
      : "";

  const bullets: string[] = [];
  if (short) {
    bullets.push(short);
  }
  if (full && full.toLowerCase() !== short.toLowerCase() && full.length > 8) {
    bullets.push(`Officiële prijsnaam: ${full}.`);
  }
  return bullets;
}

function getPrizeValueLabel(drawResult: DrawResult): string | null {
  const text = [
    "title" in drawResult.prize ? drawResult.prize.title : "",
    "omschrijvingFull" in drawResult.prize ? drawResult.prize.omschrijvingFull : "",
    "omschrijvingKort" in drawResult.prize ? drawResult.prize.omschrijvingKort : "",
  ]
    .filter(Boolean)
    .join(" ");

  const match = text.match(/€\s*[\d.]+(?:,\d+)?(?:\s*,-)?/);
  return match?.[0]?.replace(/\s+/g, " ") ?? null;
}

export function PrizeReveal({ drawResult, trekking, reducedMotion, onReset }: PrizeRevealProps) {
  const title = getPrizeTitle(drawResult);
  const aboutText = getAboutText(drawResult);
  const detailBullets = getDetailBullets(drawResult);
  const prizeValueLabel = getPrizeValueLabel(drawResult);
  const normalizedValue = clamp((drawResult.revealValue - MIN_VALUE) / (MAX_VALUE - MIN_VALUE), 0, 1);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    gsap.registerPlugin(SplitText);
  }, []);

  React.useLayoutEffect(() => {
    if (!rootRef.current || !imageRef.current || !titleRef.current || !contentRef.current) {
      return;
    }

    if (reducedMotion) {
      gsap.set([imageRef.current, titleRef.current, contentRef.current], {
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
    const contentDuration = 0.44 + normalizedValue * 0.22;

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

      timeline.fromTo(
        contentRef.current,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: contentDuration, ease: "power2.out" },
        ">-0.08"
      );

      return () => {
        timeline.kill();
        split?.revert();
      };
    }, rootRef);

    return () => ctx.revert();
  }, [drawResult.prize.url, normalizedValue, reducedMotion, title]);

  const imageBlurPx = 8 + normalizedValue * 18;
  const imageScale = 1.08 + normalizedValue * 0.22;

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
      <div className={styles.prizeRevealCopy}>
        <div className={styles.prizeRevealCopyInner}>
          <p className={styles.resultEyebrow}>Jouw prijs · {trekking.label}</p>
          <h3 ref={titleRef} className={`${styles.resultPrize} ${styles.revealTitle}`} aria-label={title}>
            {title}
          </h3>

          <div ref={contentRef} className={styles.revealDescription}>
            <div className={styles.resultMetaRow}>
              <p className={styles.resultMeta}>
                Postcode: <span className={styles.mono}>{drawResult.postalCode}</span>
              </p>
              <p className={styles.resultMeta}>
                Ticketnummer: <span className={styles.mono}>{drawResult.ticketNumber}</span>
              </p>
            </div>

            <dl className={styles.trekkingMeta}>
              <div>
                <dt>Uiterste bezorgdatum</dt>
                <dd>{trekking.delivery}</dd>
              </div>
              {prizeValueLabel ? (
                <div>
                  <dt>Waarde</dt>
                  <dd>{prizeValueLabel}</dd>
                </div>
              ) : null}
            </dl>

            <div className={styles.aboutBlock}>
              <h4 className={styles.aboutTitle}>Over deze prijs</h4>
              <p className={styles.resultInfo}>{aboutText}</p>
              {detailBullets.length > 0 ? (
                <ul className={styles.aboutList}>
                  {detailBullets.map((bullet) => (
                    <li key={bullet.slice(0, 48)}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              <p className={styles.resultInfo}>
                Meer info op de{" "}
                <a className={styles.inlineLink} href={UITSLAGEN_URL} target="_blank" rel="noreferrer">
                  uitslagenpagina
                </a>
                .
              </p>
            </div>

            <div className={styles.resultActions}>
              <a className={`${styles.button} ${styles.accountCta}`} href={MY_ACCOUNT_URL} target="_blank" rel="noreferrer">
                Log in op Mijn Postcode Loterij
              </a>
              <button className={styles.resetLink} type="button" onClick={onReset}>
                Andere postcode
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.prizeRevealMedia}>
        <img
          ref={imageRef}
          className={`${styles.resultImage} ${styles.revealImage}`}
          src={drawResult.prize.url}
          alt={drawResult.prizeLabel}
        />
      </div>
    </div>
  );
}
