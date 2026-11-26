// Contacts are validated on save and turned into links here, so stored text can never become a script link.
export type ContactFields = { telegram: string | null; whatsapp: string | null; linkedin: string | null; contactEmail: string | null };

export function cleanTelegram(v: string) {
  const h = v.trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
  return /^[A-Za-z0-9_]{3,32}$/.test(h) ? h : null;
}
export function cleanWhatsapp(v: string) {
  const d = v.replace(/[^\d+]/g, "");
  const digits = d.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : null;
}
export function cleanLinkedin(v: string) {
  const t = v.trim();
  if (/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/(in|company)\/[A-Za-z0-9\-_%]+\/?$/i.test(t)) return t.slice(0, 200);
  return /^[A-Za-z0-9\-_%]{3,100}$/.test(t) ? `https://www.linkedin.com/in/${t}` : null;
}
export function cleanEmail(v: string) {
  const t = v.trim().slice(0, 120);
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(t) ? t : null;
}

export function contactLinks(c: ContactFields) {
  const out: { label: string; text: string; href: string }[] = [];
  if (c.telegram) out.push({ label: "Telegram", text: `@${c.telegram}`, href: `https://t.me/${c.telegram}` });
  if (c.whatsapp) out.push({ label: "WhatsApp", text: c.whatsapp, href: `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` });
  if (c.linkedin) out.push({ label: "LinkedIn", text: c.linkedin.replace(/^https:\/\/(www\.)?/, ""), href: c.linkedin });
  if (c.contactEmail) out.push({ label: "Email", text: c.contactEmail, href: `mailto:${c.contactEmail}` });
  return out;
}
