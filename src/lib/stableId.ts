function slugPart(name: string): string {
  return normalizeTr(name)
    .replace(/[^a-z0-9ığüşöçİĞÜŞÖÇ]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/** Ürün adı eşlemesi (raf+katalog görseli için); harici kullanıma açık */
export function normalizeTr(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export function seedItemId(shelfId: number, productName: string, indexOnShelf: number): string {
  const s = slugPart(productName) || 'urun';
  return `seed-${shelfId}-${indexOnShelf}-${s}`;
}
