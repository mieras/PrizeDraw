import type { MediaItem, PrizeManifestItem } from "~/src/infinite-canvas/types";

export type DrawResult = {
  postalCode: string;
  prize: MediaItem | PrizeManifestItem;
  prizeIndex: number;
  prizeLabel: string;
  ticketNumber: string;
  revealValue: number;
};

function hashString(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return hash >>> 0;
}

/** Seeded PRNG: zelfde postcode →zelfde seed →zelfde reeks. Gebruikt om per postcode een vaste maar "random" prijs te kiezen. */
function seededRandom(seed: number): () => number {
  let current = seed;
  return function next() {
    current = (current * 1664525 + 1013904223) >>> 0;
    return current / 2 ** 32;
  };
}

function getPrizeLabel(prize: MediaItem | PrizeManifestItem): string {
  if ("title" in prize && typeof prize.title === "string" && prize.title) {
    const lid = "lidwoord" in prize && typeof prize.lidwoord === "string" ? prize.lidwoord : "";
    return [lid, prize.title].filter(Boolean).join(" ").trim();
  }
  const fileName = decodeURIComponent(prize.url.split("/").pop() ?? "Prijs");
  return fileName.replace(/\.[^.]+$/, "");
}

function getRevealValue(prize: MediaItem | PrizeManifestItem): number {
  if ("revealValue" in prize && typeof prize.revealValue === "number" && Number.isFinite(prize.revealValue)) {
    return prize.revealValue;
  }
  return 1.5;
}

export function drawPrize(
  postalCode: string,
  media: (MediaItem | PrizeManifestItem)[],
): DrawResult {
  const normalizedPostalCode = postalCode.trim().toUpperCase();
  const hash = hashString(normalizedPostalCode);

  // Per postcode een vaste maar random prijs: seeded RNG voor gelijkmatige verdeling
  const random = seededRandom(hash);
  const prizeIndex = Math.min(Math.floor(random() * media.length), media.length - 1);
  const prize = media[prizeIndex] ?? media[0];

  if (!prize) {
    throw new Error("Cannot draw prize without media items");
  }

  const ticketHash = hashString(`${normalizedPostalCode}:ticket`);
  const ticketNumber = `TD-${String((ticketHash % 900000) + 100000)}`;

  return {
    postalCode: normalizedPostalCode,
    prize,
    prizeIndex,
    prizeLabel: getPrizeLabel(prize),
    ticketNumber,
    revealValue: getRevealValue(prize),
  };
}
