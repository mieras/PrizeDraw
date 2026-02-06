import * as React from "react";
import artworksManifest from "~/src/artworks/manifest.json";
import prizeManifest from "~/src/prizes/manifest.json";
import { InfiniteCanvas } from "~/src/infinite-canvas";
import type { MediaItem, PrizeManifestItem } from "~/src/infinite-canvas/types";
import { PageLoader } from "~/src/loader";
import { useReducedMotion } from "~/src/use-reduced-motion";
import { Confetti } from "./confetti";
import { drawPrize, type DrawResult } from "./draw";
import styles from "./style.module.css";

/** Switch: true = prizes (CSV), false = artworks */
const USE_PRIZES = true;

const base = (import.meta.env.BASE_URL ?? "/").replace(/\/*$/, "/");
function assetUrl(url: string): string {
  const path = url.startsWith("/") ? url.slice(1) : url;
  return `${base}${path}`;
}

function withBaseUrl<T extends { url: string }>(items: T[]): T[] {
  return items.map((item) => ({ ...item, url: assetUrl(item.url) }));
}

const rawMedia = USE_PRIZES ? (prizeManifest as PrizeManifestItem[]) : (artworksManifest as MediaItem[]);
const media = withBaseUrl(rawMedia);

type Phase = "idle" | "animating" | "revealed";

const POSTAL_CODE_PATTERN = /^\d{4}[A-Z]{2}$/;
const REVEAL_DURATION_MS = 4000;

function sanitizePostalCode(input: string) {
  const cleaned = input.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "");
  const digits = cleaned.replace(/\D/g, "").slice(0, 4);
  const letters = cleaned.replace(/\d/g, "").slice(0, 2);
  return digits + letters;
}

export function App() {
  const [mediaItems] = React.useState(media);
  const [textureProgress, setTextureProgress] = React.useState(0);
  const reducedMotion = useReducedMotion();

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [postalCodeInput, setPostalCodeInput] = React.useState("");
  const [drawResult, setDrawResult] = React.useState<DrawResult | null>(null);
  const [animationProgress, setAnimationProgress] = React.useState(0);

  const isPostalCodeValid = POSTAL_CODE_PATTERN.test(postalCodeInput);
  const sceneFadeOpacity = reducedMotion
    ? phase === "revealed"
      ? 1
      : 0
    : phase === "animating"
      ? Math.max(0, Math.min(1, (animationProgress - 0.5) / 0.25))
      : phase === "revealed"
        ? 1
        : 0;

  React.useEffect(() => {
    if (phase !== "animating" || reducedMotion) {
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / REVEAL_DURATION_MS, 1);
      setAnimationProgress(progress);

      if (progress >= 1) {
        setPhase("revealed");
        return;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [phase, reducedMotion]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isPostalCodeValid || !mediaItems.length) {
      return;
    }

    const result = drawPrize(postalCodeInput, mediaItems);
    setDrawResult(result);
    if (reducedMotion) {
      setAnimationProgress(1);
      setPhase("revealed");
    } else {
      setAnimationProgress(0);
      setPhase("animating");
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setAnimationProgress(0);
    setPostalCodeInput("");
    setDrawResult(null);
  };

  if (!mediaItems.length) {
    return <PageLoader progress={0} />;
  }

  return (
    <>
      <PageLoader progress={textureProgress} reducedMotion={reducedMotion} />
      <InfiniteCanvas
        media={mediaItems}
        onTextureProgress={setTextureProgress}
        interactionMode={phase}
        animationProgress={animationProgress}
        reducedMotion={reducedMotion}
        backgroundColor="transparent"
        fogColor="#E30027"
        fogNear={20}
        fogFar={320}
      />
      <div className={styles.sceneFade} style={{ opacity: sceneFadeOpacity }} />

      <main className={styles.overlay}>
        {phase === "idle" && (
          <section className={styles.panel}>
            <h1 className={styles.title}>Behoor jij tot de winnaars?</h1>
            <p className={styles.subtitle}>Elke 1e van de maand maken we de uitslagen bekend.</p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.inputLabel} htmlFor="postalCodeInput">
                Vul je postcode in
              </label>
              <input
                id="postalCodeInput"
                className={styles.input}
                value={postalCodeInput}
                onChange={(event) => setPostalCodeInput(sanitizePostalCode(event.target.value))}
                placeholder="1234AB"
                autoComplete="postal-code"
                autoFocus
                inputMode="text"
                spellCheck={false}
                aria-invalid={!isPostalCodeValid && postalCodeInput.length > 0}
                maxLength={8}
              />
              <button className={`${styles.button} ${styles.buttonInverted}`} type="submit" disabled={!isPostalCodeValid}>
                Bekijk uitslag
              </button>
            </form>
          </section>
        )}

        {phase === "animating" && (
          <section className={styles.loadingPanel} aria-live="polite">
            <p>Moment, wij zoeken {postalCodeInput.length === 6 ? `${postalCodeInput.slice(0, 4)} ${postalCodeInput.slice(4)}` : postalCodeInput} tussen de winnaars</p>
          </section>
        )}

        {phase === "revealed" && (
          <>
            {!reducedMotion && <Confetti colorMode="gold" />}
            {drawResult && (
              <section className={`${styles.resultPanel} ${styles.resultPlain}`} aria-live="polite">
                <h2>Jouw prijs</h2>
                <div className={styles.resultMetaRow}>
                  <p className={styles.resultMeta}>
                    Postcode: <span className={styles.mono}>{drawResult.postalCode}</span>
                  </p>
                  <p className={styles.resultMeta}>
                    Ticketnummer: <span className={styles.mono}>{drawResult.ticketNumber}</span>
                  </p>
                </div>
                <img className={styles.resultImage} src={drawResult.prize.url} alt={drawResult.prizeLabel} />
                <h3 className={styles.resultPrize}>
                  {drawResult.prizeLabel
                    ? drawResult.prizeLabel.charAt(0).toUpperCase() + drawResult.prizeLabel.slice(1)
                    : ""}
                </h3>
                {"uitslagTitle" in drawResult.prize && drawResult.prize.uitslagTitle && drawResult.prize.uitslagTitle !== "-" ? (
                  <p className={styles.resultInfo}>{drawResult.prize.uitslagTitle}</p>
                ) : null}
                {"omschrijvingKort" in drawResult.prize && drawResult.prize.omschrijvingKort ? (
                  <p className={styles.resultInfo}>{drawResult.prize.omschrijvingKort}</p>
                ) : null}
                <button className={styles.button} type="button" onClick={handleReset}>
                  Voer nog een postcode in
                </button>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
