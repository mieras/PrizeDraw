import * as React from "react";
import manifest from "~/src/artworks/manifest.json";
import { InfiniteCanvas } from "~/src/infinite-canvas";
import type { MediaItem } from "~/src/infinite-canvas/types";
import { PageLoader } from "~/src/loader";
import { drawPrize, type DrawResult } from "./draw";
import styles from "./style.module.css";

type Phase = "idle" | "animating" | "revealed";

const POSTAL_CODE_PATTERN = /^\d{4}[A-Z]{2}$/;
const REVEAL_DURATION_MS = 5000;

function sanitizePostalCode(input: string) {
  return input.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function App() {
  const [media] = React.useState<MediaItem[]>(manifest);
  const [textureProgress, setTextureProgress] = React.useState(0);

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [postalCodeInput, setPostalCodeInput] = React.useState("");
  const [drawResult, setDrawResult] = React.useState<DrawResult | null>(null);
  const [animationProgress, setAnimationProgress] = React.useState(0);

  const isPostalCodeValid = POSTAL_CODE_PATTERN.test(postalCodeInput);
  const sceneFadeOpacity =
    phase === "animating" ? Math.max(0, Math.min(1, (animationProgress - 0.68) / 0.32)) * 0.92 : phase === "revealed" ? 0.92 : 0;

  React.useEffect(() => {
    if (phase !== "animating") {
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
  }, [phase]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isPostalCodeValid || !media.length) {
      return;
    }

    const result = drawPrize(postalCodeInput, media);
    setDrawResult(result);
    setAnimationProgress(0);
    setPhase("animating");
  };

  const handleReset = () => {
    setPhase("idle");
    setAnimationProgress(0);
  };

  if (!media.length) {
    return <PageLoader progress={0} />;
  }

  return (
    <>
      <PageLoader progress={textureProgress} />
      <InfiniteCanvas
        media={media}
        onTextureProgress={setTextureProgress}
        interactionMode={phase}
        animationProgress={animationProgress}
        focusMediaIndex={drawResult?.prizeIndex ?? null}
        backgroundColor="#070707"
        fogColor="#070707"
        fogNear={120}
        fogFar={320}
      />
      <div className={styles.sceneFade} style={{ opacity: sceneFadeOpacity }} />

      <main className={styles.overlay}>
        {phase === "idle" && (
          <section className={styles.panel}>
            <h1 className={styles.title}>Behoor jij tot de winnaars?</h1>
            <p className={styles.subtitle}>Vul je postcode in</p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.inputLabel} htmlFor="postalCodeInput">
                Postcode
              </label>
              <input
                id="postalCodeInput"
                className={styles.input}
                value={postalCodeInput}
                onChange={(event) => setPostalCodeInput(sanitizePostalCode(event.target.value))}
                placeholder="1234AA"
                autoComplete="postal-code"
                inputMode="text"
                spellCheck={false}
                aria-invalid={!isPostalCodeValid && postalCodeInput.length > 0}
                maxLength={8}
              />
              <button className={styles.button} type="submit" disabled={!isPostalCodeValid}>
                Bekijk uitslag
              </button>
            </form>
          </section>
        )}

        {phase === "animating" && (
          <section className={styles.loadingPanel} aria-live="polite">
            <p>Uitslag wordt berekend...</p>
          </section>
        )}

        {phase === "revealed" && drawResult && (
          <section className={styles.resultPanel} aria-live="polite">
            <h2>Jouw prijs</h2>
            <img className={styles.resultImage} src={drawResult.prize.url} alt={drawResult.prizeLabel} />
            <p className={styles.resultPrize}>{drawResult.prizeLabel}</p>
            <p className={styles.resultMeta}>
              Postcode: <span className={styles.mono}>{drawResult.postalCode}</span>
            </p>
            <p className={styles.resultMeta}>
              Ticketnummer: <span className={styles.mono}>{drawResult.ticketNumber}</span>
            </p>
            <button className={styles.button} type="button" onClick={handleReset}>
              Opnieuw proberen
            </button>
          </section>
        )}
      </main>
    </>
  );
}
