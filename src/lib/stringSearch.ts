export function normalizeTr(text: string): string {
  return text.toLocaleLowerCase('tr-TR');
}

export function matchesSearch(haystack: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return normalizeTr(haystack).includes(normalizeTr(needle.trim()));
}
