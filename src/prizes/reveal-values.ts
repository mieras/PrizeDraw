const MIN_REVEAL_VALUE = 0.5;
const MAX_REVEAL_VALUE = 10;

type PrizeLike = {
  title?: string;
  omschrijvingFull?: string;
  omschrijvingKort?: string;
  uitslagTitle?: string;
  revealValue?: number;
};

const VALUE_RULES: Array<{ pattern: RegExp; value: number }> = [
  { pattern: /superpostcodeprijs|1\s*miljoen|€\s*1\.?000\.?000/, value: 10 },
  { pattern: /10\s*jaar.*25\.?000|25\.?000.*per jaar/, value: 9.4 },
  { pattern: /\bbmw\b|naar keuze.*bmw/, value: 8.6 },
  { pattern: /playstation|ps5/, value: 7.5 },
  { pattern: /dyson/, value: 7.1 },
  { pattern: /€\s*500|shoptegoed.*500/, value: 6.4 },
  { pattern: /geldprijs.*1\.?000|€\s*1\.?000/, value: 6.1 },
  { pattern: /garmin|smartwatch/, value: 5.7 },
  { pattern: /fiets|roetz/, value: 5.2 },
  { pattern: /reiskofferset|reiskoffer/, value: 4.5 },
  { pattern: /giftcard|cadeaukaart|shoptegoed.*20|rituals/, value: 0.5 },
  { pattern: /boek|film|tijdschrift|plant/, value: 1.8 },
  { pattern: /sokken|keukentextiel|ovenschaal|paraplu|jbl|speaker|chocolade/, value: 1.5 },
  { pattern: /lokaal verscadeaukaart|bakkerscadeaukaart/, value: 0.8 },
  { pattern: /hema.*5|cadeaukaart.*5/, value: 0.5 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toText(prize: PrizeLike): string {
  return [prize.title, prize.omschrijvingFull, prize.omschrijvingKort, prize.uitslagTitle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function roundToHalfStep(value: number): number {
  return Math.round(value * 2) / 2;
}

function valueFromEuroAmount(text: string): number | null {
  const match = text.match(/€\s*([\d.]+(?:,\d+)?)/);
  if (!match) {
    return null;
  }

  const amount = Number.parseFloat(match[1].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  if (amount >= 1000000) return 10;
  if (amount >= 250000) return 9.5;
  if (amount >= 100000) return 9;
  if (amount >= 25000) return 8.5;
  if (amount >= 10000) return 8;
  if (amount >= 1000) return 6;
  if (amount >= 500) return 5.5;
  if (amount >= 100) return 3.5;
  if (amount >= 20) return 2;
  if (amount >= 10) return 1.5;
  return 1;
}

export function inferRevealValue(prize: PrizeLike): number {
  if (typeof prize.revealValue === "number" && Number.isFinite(prize.revealValue)) {
    return clamp(roundToHalfStep(prize.revealValue), MIN_REVEAL_VALUE, MAX_REVEAL_VALUE);
  }

  const text = toText(prize);
  for (const rule of VALUE_RULES) {
    if (rule.pattern.test(text)) {
      return clamp(rule.value, MIN_REVEAL_VALUE, MAX_REVEAL_VALUE);
    }
  }

  const moneyValue = valueFromEuroAmount(text);
  if (moneyValue !== null) {
    return clamp(roundToHalfStep(moneyValue), MIN_REVEAL_VALUE, MAX_REVEAL_VALUE);
  }

  return 1.5;
}

export function withRevealValues<T extends PrizeLike>(items: T[]): Array<T & { revealValue: number }> {
  return items.map((item) => ({
    ...item,
    revealValue: inferRevealValue(item),
  }));
}
