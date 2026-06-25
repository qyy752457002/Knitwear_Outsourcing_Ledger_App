const DAZHI = 12;

export function parseQuantity(input: string): number | null {
  const text = input.trim();
  if (!text) return null;

  if (/^\d+$/.test(text)) return parseInt(text, 10);

  const mixed = text.match(/^(\d+(?:\.\d+)?)打(\d*)$/);
  if (mixed) {
    const da = parseFloat(mixed[1]);
    const extra = mixed[2] ? parseInt(mixed[2], 10) : 0;
    return Math.round(da * DAZHI) + extra;
  }

  const pureDa = text.match(/^(\d+(?:\.\d+)?)打$/);
  if (pureDa) return Math.round(parseFloat(pureDa[1]) * DAZHI);

  return null;
}

export function formatDiff(diff: number): { text: string; color: string } {
  if (diff > 0) return { text: `+${diff}`, color: '#F59E0B' };
  if (diff < 0) return { text: `${diff}`, color: '#E54545' };
  return { text: '0', color: '#22C55E' };
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
