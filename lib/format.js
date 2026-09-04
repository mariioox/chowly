export const fmt = (n) => '₦' + Number(n).toLocaleString();

export function shortId(id) {
  if (!id) return '';
  const digits = String(id).replace(/\D/g, '');
  return '#' + (digits.slice(-4) || '…');
}