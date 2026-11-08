/** Patrones Code 39 (barra, espacio, barra…): "w" es un elemento ancho y "n" uno angosto. */
const PATTERNS: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn',
  F: 'nnwnwwnnn', G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn',
  K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww', O: 'wnnnwnnwn',
  P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn', S: 'nnwnnnwwn', T: 'nnnnwnwwn',
  U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn',
};

const NARROW = 1;
const WIDE = 2.6;

/** Código de barras Code 39 legible por lectores estándar para el código del ticket. */
export default function Barcode39({ value, height = 52, className = '' }: { value: string; height?: number; className?: string }) {
  const chars = `*${value.toUpperCase().split('').filter((c) => c !== '*' && PATTERNS[c]).join('')}*`;
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (const char of chars) {
    PATTERNS[char].split('').forEach((unit, i) => {
      const w = unit === 'w' ? WIDE : NARROW;
      if (i % 2 === 0) bars.push({ x, w });
      x += w;
    });
    x += NARROW; // separación entre caracteres
  }
  const width = x - NARROW;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={className} role="img" aria-label={`Código de barras de ${value}`}>
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y={0} width={bar.w} height={height} fill="currentColor" />
      ))}
    </svg>
  );
}
