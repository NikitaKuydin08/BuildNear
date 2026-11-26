// Leveled field badges. An event has one field; each real check-in counts toward that field.
// Art lives in public/badges/<folder>/<file>.svg (35 files: 7 fields x 5 levels).
export const BADGE_FIELDS = [
  { key: "web3", label: "Web3", folder: "web3" },
  { key: "ai", label: "AI / Data", folder: "ai-data" },
  { key: "cloud", label: "Cloud", folder: "cloud" },
  { key: "security", label: "Security", folder: "security" },
  { key: "web", label: "Web & Apps", folder: "web-apps" },
  { key: "sustainability", label: "Green Tech", folder: "green-tech" },
  { key: "fintech", label: "FinTech", folder: "fintech" },
] as const;

export const BADGE_LEVELS = [
  { name: "Newbie", file: "newbie", at: 1 },
  { name: "Explorer", file: "explorer", at: 2 },
  { name: "Researcher", file: "researcher", at: 4 },
  { name: "Veteran", file: "veteran", at: 7 },
  { name: "Legend", file: "legend", at: 12 },
] as const;

// Index of the highest level reached, or -1 if no check-ins yet.
export function levelIndex(count: number) {
  let idx = -1;
  BADGE_LEVELS.forEach((l, i) => { if (count >= l.at) idx = i; });
  return idx;
}

export function badgeSrc(folder: string, file: string) {
  return `/badges/${folder}/${file}.svg`;
}
