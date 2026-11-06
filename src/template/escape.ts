/**
 * The characters HTML gives meaning to, and how each is written out instead.
 */
const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Make a value safe to place in HTML text or a quoted attribute.
 *
 * @param value The value to escape.
 * @returns The value as text, with every special character written out.
 */
export default function escape(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ENTITIES[char]);
}
