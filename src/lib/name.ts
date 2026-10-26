/** "diksha.matia2027@x.org" -> "Diksha Matia" (first two name-like parts of the email). */
export function nameFromEmail(email: string | undefined): string {
  const local = (email ?? "").split("@")[0] ?? "";
  return local
    .split(/[._\-+]+/)
    .map((t) => t.replace(/[^a-zA-Z]/g, ""))
    .filter(Boolean)
    .slice(0, 2)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .join(" ");
}
