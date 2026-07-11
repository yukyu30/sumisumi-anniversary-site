const jstFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** unix 秒を「2026年7月11日 22:00」形式の JST 文字列にする */
export function formatJst(unixSeconds: number): string {
  const parts: Record<string, string> = {};
  for (const part of jstFormatter.formatToParts(new Date(unixSeconds * 1000))) {
    parts[part.type] = part.value;
  }
  return `${parts.year}年${parts.month}月${parts.day}日 ${parts.hour}:${parts.minute}`;
}
