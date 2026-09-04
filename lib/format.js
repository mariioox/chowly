export const VAT_RATE = 0.05;

export const fmt = (n) => '₦' + Number(n).toLocaleString();

export function splitVat(gross) {
  const excl = Math.round((gross / (1 + VAT_RATE)) * 100) / 100;
  const vat = Math.round((gross - excl) * 100) / 100;
  return { excl, vat };
}

export function shortId(id) {
  if (!id) return '';
  const digits = String(id).replace(/\D/g, '');
  return '#' + (digits.slice(-4) || '…');
}