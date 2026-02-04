import type { MediaItem } from "~/src/infinite-canvas/types";

export type DrawResult = {
  postalCode: string;
  prize: MediaItem;
  prizeIndex: number;
  prizeLabel: string;
  ticketNumber: string;
};

function hashString(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return hash >>> 0;
}

function getPrizeLabel(url: string) {
  const fileName = decodeURIComponent(url.split("/").pop() ?? "Prijs");
  return fileName.replace(/\.[^.]+$/, "");
}

export function drawPrize(postalCode: string, media: MediaItem[]): DrawResult {
  const normalizedPostalCode = postalCode.trim().toUpperCase();
  const hash = hashString(normalizedPostalCode);

  const prizeIndex = hash % media.length;
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
    prizeLabel: getPrizeLabel(prize.url),
    ticketNumber,
  };
}
