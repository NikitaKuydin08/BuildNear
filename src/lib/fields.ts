// The fields people can say they care about. `key` is what is stored in users.topics (lowercase, matched by scorePair).
// Colours are the same ones used for badges later.
export const FIELDS = [
  { key: "web3", label: "Web3 / Blockchain", color: "#F2B705" },
  { key: "ai", label: "AI / Data", color: "#8E5CF0" },
  { key: "cloud", label: "Cloud / DevOps", color: "#2F8CF0" },
  { key: "security", label: "Security", color: "#1F7A7A" },
  { key: "web", label: "Web & Apps", color: "#F2761B" },
  { key: "sustainability", label: "Green tech", color: "#3DAA4F" },
  { key: "mobile", label: "Mobile", color: "#D6457E" },
  { key: "hardware", label: "Hardware / IoT", color: "#8A6A4F" },
  { key: "games", label: "Games", color: "#C2410C" },
  { key: "design", label: "Design / UX", color: "#DB2777" },
  { key: "opensource", label: "Open source", color: "#4B5563" },
  { key: "fintech", label: "Fintech", color: "#0E7490" },
] as const;

export const FIELD_KEYS: string[] = FIELDS.map((f) => f.key);
