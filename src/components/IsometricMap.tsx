import React from 'react';
import type { Zone, ZoneType } from '../types/domain';

/* ── Projection ─────────────────────────────────────────────────────────── */
const SC   = 0.46;   // world → iso scale
const OX   = 415;    // iso origin x
const OY   = 20;     // iso origin y

function iso(wx: number, wy: number): [number, number] {
  return [
    (wx - wy) * SC + OX,
    (wx + wy) * SC * 0.5 + OY,
  ];
}

function poly(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

/* ── Zone 3D heights (SVG pixels) ───────────────────────────────────────── */
const HEIGHTS: Partial<Record<ZoneType, number>> = {
  habitat:        46,
  stockage:       34,
  transformation: 28,
  animaux:        26,
  verger:         22,
  champignons:    16,
  eau:            14,
  'maraîchage':   10,
  'mellifères':   10,
};

/* ── Colors ─────────────────────────────────────────────────────────────── */
const ZONE_COLORS: Record<ZoneType, { fill: string; stroke: string }> = {
  habitat:        { fill: '#d4c5a9', stroke: '#a89070' },
  eau:            { fill: '#8ecae6', stroke: '#3a90c0' },
  'maraîchage':   { fill: '#a8e6b0', stroke: '#3aaa5a' },
  verger:         { fill: '#c8d8a0', stroke: '#7aaa3a' },
  animaux:        { fill: '#f5e0b8', stroke: '#cc9a3a' },
  stockage:       { fill: '#d0d0d0', stroke: '#888888' },
  transformation: { fill: '#f5c98a', stroke: '#cc8f3a' },
  champignons:    { fill: '#c8b8d8', stroke: '#7a5a9a' },
  'mellifères':   { fill: '#fdf4c0', stroke: '#c8a820' },
};

function darken(hex: string, f: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

function lighten(hex: string, f: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * f))},${Math.min(255, Math.round(g + (255 - g) * f))},${Math.min(255, Math.round(b + (255 - b) * f))})`;
}

/* ── Props ───────────────────────────────────────────────────────────────── */
interface Props {
  zones: Zone[];
  selectedZoneId: string | null;
  onSelect: (id: string | null) => void;
}

/* ── Component ───────────────────────────────────────────────────────────── */
const IsometricMap: React.FC<Props> = ({ zones, selectedZoneId, onSelect }) => {
  // Painter's algorithm: render north-west zones first (lowest x+y = farthest from viewer)
  const sorted = [...zones].sort((a, b) =>
    (a.x + a.y + a.width / 2 + a.height / 2) - (b.x + b.y + b.width / 2 + b.height / 2)
  );

  function renderZone(zone: Zone) {
    const { x, y, width: w, height: h, type, id, name } = zone;
    const isSelected = id === selectedZoneId;
    const isHedge    = id.startsWith('haie');
    const colors     = ZONE_COLORS[type] ?? { fill: '#ddd', stroke: '#999' };
    const hz         = isHedge ? 5 : (HEIGHTS[type] ?? 10);
    const sw         = isSelected ? 1.8 : 0.7;

    // Four corners of the top face
    const TL = iso(x,     y);
    const TR = iso(x + w, y);
    const BR = iso(x + w, y + h);
    const BL = iso(x,     y + h);

    // Same corners shifted down for the "floor" of the walls
    const TRd: [number, number] = [TR[0], TR[1] + hz];
    const BRd: [number, number] = [BR[0], BR[1] + hz];
    const BLd: [number, number] = [BL[0], BL[1] + hz];

    const topFill   = isSelected ? lighten(colors.fill, 0.22) : colors.fill;
    const southFill = darken(colors.fill, isHedge ? 0.55 : 0.70);
    const eastFill  = darken(colors.fill, isHedge ? 0.42 : 0.54);
    const strokeCol = isSelected ? '#1a1a1a' : colors.stroke;

    // Iso center of top face for label
    const [lcx, lcy] = iso(x + w / 2, y + h / 2);
    const isoTopW    = TR[0] - TL[0];  // approximate iso width of top face
    const maxChars   = Math.max(2, Math.floor(isoTopW / 5.2));
    const fontSize   = isoTopW > 80 ? 8 : isoTopW > 50 ? 7 : 6;

    return (
      <g key={id} onClick={e => { e.stopPropagation(); onSelect(id); }} style={{ cursor: 'pointer' }}>
        {/* South wall (bottom edge of top face → floor) */}
        <polygon
          points={poly([BL, BR, BRd, BLd])}
          fill={southFill} stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"
        />
        {/* East wall (right edge of top face → floor) */}
        <polygon
          points={poly([BR, TR, TRd, BRd])}
          fill={eastFill} stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"
        />
        {/* Top face */}
        <polygon
          points={poly([TL, TR, BR, BL])}
          fill={topFill} stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"
        />
        {/* Zone name */}
        {isoTopW >= 28 && (
          <text
            x={lcx} y={lcy}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={fontSize} fontFamily="system-ui"
            fill="#222" fontWeight={isSelected ? '700' : '500'}
            pointerEvents="none" style={{ userSelect: 'none' }}
          >
            {name.slice(0, maxChars)}
          </text>
        )}
        {/* Surface area on large zones */}
        {zone.surfaceM2 && isoTopW >= 80 && (
          <text
            x={lcx} y={lcy + fontSize + 1}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="6" fontFamily="system-ui"
            fill="#555" pointerEvents="none" style={{ userSelect: 'none' }}
          >
            {zone.surfaceM2.toLocaleString('fr')} m²
          </text>
        )}
        <title>{zone.name}{zone.surfaceM2 ? ` — ${zone.surfaceM2.toLocaleString('fr')} m²` : ''}</title>
      </g>
    );
  }

  return (
    <svg
      viewBox="0 0 820 460"
      style={{ display: 'block', width: '100%', minWidth: '520px' }}
      onClick={() => onSelect(null)}
    >
      <defs>
        <linearGradient id="isoSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ddeef8" />
          <stop offset="100%" stopColor="#c8e0cc" />
        </linearGradient>
        <filter id="isoShadow" x="-5%" y="-5%" width="115%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0002" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="820" height="460" fill="url(#isoSky)" />

      {/* Ground plane hint */}
      <polygon
        points={poly([iso(0, 0), iso(760, 0), iso(760, 720), iso(0, 720)])}
        fill="#d8e8c8" opacity="0.25"
      />

      {/* All zones sorted back-to-front */}
      <g filter="url(#isoShadow)">
        {sorted.map(zone => renderZone(zone))}
      </g>

      {/* Compass */}
      <g transform="translate(780, 40)" fontSize="7" fontFamily="system-ui" fill="#666">
        <line x1="0" y1="0" x2="0" y2="-14" stroke="#888" strokeWidth="1.5" markerEnd="url(#compassN)"/>
        <text x="0" y="-17" textAnchor="middle" fontSize="7" fill="#666">N</text>
        <line x1="0" y1="0" x2="10" y2="5" stroke="#aaa" strokeWidth="0.8"/>
        <text x="13" y="8" textAnchor="middle" fontSize="6" fill="#aaa">E</text>
      </g>

      {/* Legend */}
      <rect x="8" y="432" width="804" height="22" rx="4" fill="#fff" opacity="0.82"/>
      {Object.entries(ZONE_COLORS).map(([type, { fill }], i) => {
        const labels: Partial<Record<ZoneType, string>> = {
          habitat: 'Habitat', eau: 'Eau', 'maraîchage': 'Maraîch.', verger: 'Verger',
          animaux: 'Animaux', stockage: 'Stockage', transformation: 'Transform.',
          champignons: 'Champis', 'mellifères': 'Mellifères',
        };
        const xOff = 14 + i * 88;
        return (
          <g key={type}>
            <rect x={xOff} y="438" width="9" height="9" rx="2" fill={fill} opacity="0.88"/>
            <text x={xOff + 13} y="446" fontSize="7.5" fontFamily="system-ui" fill="#666">
              {labels[type as ZoneType]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default IsometricMap;
