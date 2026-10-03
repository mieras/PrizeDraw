export type TrekkingOption = {
  id: string;
  label: string;
  delivery: string;
};

export const TREKKING_OPTIONS: TrekkingOption[] = [
  { id: "2026-09", label: "September 2026", delivery: "Brief: 23 oktober 2026" },
  { id: "2026-08", label: "Augustus 2026", delivery: "Brief: 18 september 2026" },
  { id: "2026-07", label: "Juli 2026", delivery: "Brief: 19 augustus 2026" },
  { id: "2026-bonus", label: "Bonustrekking 2026", delivery: "Brief: 2 september 2026" },
  { id: "2026-06", label: "Juni 2026", delivery: "Brief: 17 juli 2026" },
  { id: "2026-13", label: "Jaarlijkse 13e trekking 2026", delivery: "Brief: 30 juni 2026" },
  { id: "2026-05", label: "Mei 2026", delivery: "Brief: 19 juni 2026" },
];

export function getTrekkingById(id: string): TrekkingOption {
  return TREKKING_OPTIONS.find((option) => option.id === id) ?? TREKKING_OPTIONS[0];
}
