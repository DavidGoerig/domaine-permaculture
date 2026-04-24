import React from 'react';
import type { Zone, ZoneType, Plant } from '../types/domain';

/* ── Projection ─────────────────────────────────────────────────────────── */
const SC = 0.46;
const OX = 415;
const OY = 20;

function iso(wx: number, wy: number): [number, number] {
  return [(wx - wy) * SC + OX, (wx + wy) * SC * 0.5 + OY];
}
function pts(points: [number, number][]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

/* ── Heights (SVG px above ground) ─────────────────────────────────────── */
const HEIGHTS: Partial<Record<ZoneType, number>> = {
  habitat: 46, stockage: 34, transformation: 26, animaux: 24,
  verger: 20, champignons: 16, eau: 14, 'maraîchage': 10, 'mellifères': 8,
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

const CATEGORY_COLORS: Record<string, string> = {
  'légume-feuille': '#3aaa5a', 'légume-racine': '#cc8f3a',
  'légume-fruit':   '#E8593C', 'légumineuse':   '#639922',
  'aromatique':     '#7a5a9a', 'fruit':          '#EF9F27',
  'vivace':         '#3B8BD4', 'engrais-vert':   '#a0c840',
  'sauvage':        '#5a8a3a', 'mellifère':      '#f0a800',
  'champignon':     '#8a6a6a',
};

function darken(hex: string, f: number): string {
  const h = hex.replace('#', '');
  return `rgb(${Math.round(parseInt(h.slice(0,2),16)*f)},${Math.round(parseInt(h.slice(2,4),16)*f)},${Math.round(parseInt(h.slice(4,6),16)*f)})`;
}
function lighten(hex: string, f: number): string {
  const h = hex.replace('#', '');
  const c = (s: string) => Math.min(255, Math.round(parseInt(s,16) + (255-parseInt(s,16))*f));
  return `rgb(${c(h.slice(0,2))},${c(h.slice(2,4))},${c(h.slice(4,6))})`;
}

/* ── Props ───────────────────────────────────────────────────────────────── */
interface Props {
  zones: Zone[];
  plants?: Plant[];
  selectedZoneId: string | null;
  selectedItemId?: string | null;
  onSelect: (id: string | null) => void;
  onItemSelect?: (id: string, type: 'plant' | 'animal' | 'mushroom' | 'beehive') => void;
}

/* ── Component ───────────────────────────────────────────────────────────── */
const IsometricMap: React.FC<Props> = ({
  zones, plants = [], selectedZoneId, selectedItemId, onSelect, onItemSelect,
}) => {
  // Override champignons_haie to full visual extent (matches FarmMap custom band)
  const zonesEff = zones.map(z =>
    z.id === 'champignons_haie' ? { ...z, x: 626, y: 178, width: 88, height: 510 } : z
  );

  // Painter's algorithm: south-edge (y+h) ascending, then west-to-east (x) for ties
  const sorted = [...zonesEff].sort(
    (a, b) => (a.y + a.height) - (b.y + b.height) || a.x - b.x
  );

  /* ── Plant strips on top face ─────────────────────────────────────────── */
  function renderPlantStrips(zone: Zone) {
    const { x, y, width: w, height: h, id, type } = zone;
    const colors = ZONE_COLORS[type] ?? { fill: '#ddd', stroke: '#999' };
    const isSelected = id === selectedZoneId;
    const strokeCol  = isSelected ? '#1a1a1a' : colors.stroke;
    const sw         = isSelected ? 2 : 0.7;

    const zonePlants = plants.filter(p => p.zones.includes(id));
    const TL = iso(x,     y);
    const TR = iso(x + w, y);
    const BR = iso(x + w, y + h);
    const BL = iso(x,     y + h);

    if (zonePlants.length === 0) {
      return (
        <polygon
          points={pts([TL, TR, BR, BL])}
          fill={isSelected ? lighten(colors.fill, 0.22) : colors.fill}
          stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"
        />
      );
    }

    const totalYield = Math.max(1, zonePlants.reduce((s, p) => s + p.yieldKgPerM2, 0));

    // Pre-compute strips
    const strips: { plant: Plant; y0: number; y1: number }[] = [];
    let yOff = y;
    for (const p of zonePlants) {
      const sh = Math.max(2, (p.yieldKgPerM2 / totalYield) * h);
      strips.push({ plant: p, y0: yOff, y1: yOff + sh });
      yOff += sh;
    }

    return (
      <g>
        {/* base fill */}
        <polygon points={pts([TL, TR, BR, BL])}
          fill={isSelected ? lighten(colors.fill, 0.22) : colors.fill}
          stroke="none"/>
        {strips.map(({ plant: p, y0, y1 }) => {
          const sTL = iso(x,     y0);
          const sTR = iso(x + w, y0);
          const sBR = iso(x + w, y1);
          const sBL = iso(x,     y1);
          const isSelItem = p.id === selectedItemId;
          return (
            <g key={p.id}
              onClick={e => { e.stopPropagation(); onItemSelect?.(p.id, 'plant'); }}
              style={{ cursor: 'pointer' }}>
              <polygon
                points={pts([sTL, sTR, sBR, sBL])}
                fill={CATEGORY_COLORS[p.category] ?? '#888'}
                opacity={isSelItem ? 1 : 0.82}
                stroke={isSelItem ? '#fff' : 'none'}
                strokeWidth={isSelItem ? 1 : 0}
              />
              <title>{p.name} — {p.yieldKgPerM2} kg/m²</title>
            </g>
          );
        })}
        {/* border on top */}
        <polygon points={pts([TL, TR, BR, BL])}
          fill="none" stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"/>
      </g>
    );
  }

  /* ── Tree decorations ────────────────────────────────────────────────── */
  function renderTrees(zone: Zone) {
    const { x, y, width: w, height: h, id } = zone;
    const cols   = Math.max(2, Math.floor(w / 48));
    const rows   = Math.max(2, Math.floor(h / 48));
    const radius = id === 'noyers' ? 8 : 5;
    const elems: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = x + (c + 0.5) * (w / cols);
        const wy = y + (r + 0.5) * (h / rows);
        const [ix, iy] = iso(wx, wy);
        elems.push(
          <g key={`t${r}-${c}`} pointerEvents="none">
            <circle cx={ix} cy={iy} r={radius}      fill="#3a8a2a" opacity="0.88"/>
            <circle cx={ix} cy={iy} r={radius * 0.5} fill="#2a6a1a" opacity="0.55"/>
          </g>
        );
      }
    }
    return <g pointerEvents="none">{elems}</g>;
  }

  /* ── Zone render ─────────────────────────────────────────────────────── */
  function renderZone(zone: Zone) {
    const { x, y, width: w, height: h, type, id, name } = zone;
    const isSelected = id === selectedZoneId;
    const isHedge    = id.startsWith('haie');
    const colors     = ZONE_COLORS[type] ?? { fill: '#ddd', stroke: '#999' };
    const hz         = isHedge ? 0 : (HEIGHTS[type] ?? 10);
    const sw         = isSelected ? 2 : 0.7;
    const strokeCol  = isSelected ? '#1a1a1a' : colors.stroke;

    const TL = iso(x,     y);
    const TR = iso(x + w, y);
    const BR = iso(x + w, y + h);
    const BL = iso(x,     y + h);

    const BRd: [number, number] = [BR[0], BR[1] + hz];
    const BLd: [number, number] = [BL[0], BL[1] + hz];
    const TRd: [number, number] = [TR[0], TR[1] + hz];

    const [lcx, lcy] = iso(x + w / 2, y + h / 2);
    const isoW       = TR[0] - TL[0];
    const hasPlants  = plants.some(p => p.zones.includes(id));
    const isTree     = (id === 'verger' || id === 'noyers') && !hasPlants;

    return (
      <g key={id} onClick={e => { e.stopPropagation(); onSelect(id); }} style={{ cursor: 'pointer' }}>
        {/* South wall */}
        {hz > 0 && (
          <polygon points={pts([BL, BR, BRd, BLd])}
            fill={darken(colors.fill, 0.68)} stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"/>
        )}
        {/* East wall */}
        {hz > 0 && (
          <polygon points={pts([BR, TR, TRd, BRd])}
            fill={darken(colors.fill, 0.52)} stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"/>
        )}
        {/* Top face (with plant strips if applicable) */}
        {renderPlantStrips(zone)}
        {/* Tree decorations */}
        {isTree && renderTrees(zone)}
        {/* Label */}
        {isoW >= 22 && (
          <text x={lcx} y={lcy} textAnchor="middle" dominantBaseline="middle"
            fontSize={isoW > 80 ? 8 : isoW > 48 ? 7 : 6}
            fontFamily="system-ui" fill="#222" fontWeight={isSelected ? '700' : '500'}
            pointerEvents="none" style={{ userSelect: 'none' }}>
            {name.slice(0, Math.max(3, Math.floor(isoW / 5.2)))}
          </text>
        )}
        {zone.surfaceM2 && isoW >= 90 && (
          <text x={lcx} y={lcy + 9} textAnchor="middle" dominantBaseline="middle"
            fontSize="6" fontFamily="system-ui" fill="#555"
            pointerEvents="none" style={{ userSelect: 'none' }}>
            {zone.surfaceM2.toLocaleString('fr')} m²
          </text>
        )}
        <title>{name}{zone.surfaceM2 ? ` — ${zone.surfaceM2.toLocaleString('fr')} m²` : ''}</title>
      </g>
    );
  }

  /* ── SVG ─────────────────────────────────────────────────────────────── */
  return (
    <svg viewBox="0 0 830 420" style={{ display: 'block', width: '100%', minWidth: '520px' }}
      onClick={() => onSelect(null)}>
      <defs>
        <linearGradient id="isoSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ddeef8"/>
          <stop offset="60%"  stopColor="#c8e0cc"/>
          <stop offset="100%" stopColor="#b8d8b8"/>
        </linearGradient>
      </defs>

      <rect width="830" height="420" fill="url(#isoSky)"/>

      {/* Ground plane */}
      <polygon
        points={pts([iso(10,0), iso(714,0), iso(714,692), iso(10,692)])}
        fill="#c8dca8" opacity="0.18"/>

      {sorted.map(zone => renderZone(zone))}

      {/* Compass */}
      <g transform="translate(800,36)" fontFamily="system-ui">
        <circle cx="0" cy="0" r="13" fill="#fff" opacity="0.75"/>
        <line x1="0" y1="-9" x2="0" y2="9"  stroke="#888" strokeWidth="0.8"/>
        <line x1="-9" y1="0" x2="9" y2="0"  stroke="#888" strokeWidth="0.8"/>
        <text x="0"  y="-11" textAnchor="middle" fontSize="6.5" fill="#555">N</text>
        <text x="11" y="2.5" textAnchor="start"  fontSize="6.5" fill="#555">E</text>
      </g>

      {/* Legend */}
      <rect x="8" y="398" width="814" height="18" rx="4" fill="#fff" opacity="0.82"/>
      {(Object.entries(ZONE_COLORS) as [ZoneType, {fill:string;stroke:string}][]).map(([type, { fill }], i) => {
        const labels: Partial<Record<ZoneType, string>> = {
          habitat: 'Habitat', eau: 'Eau', 'maraîchage': 'Maraîch.', verger: 'Verger',
          animaux: 'Animaux', stockage: 'Stockage', transformation: 'Transform.',
          champignons: 'Champis', 'mellifères': 'Mellifères',
        };
        return (
          <g key={type}>
            <rect x={14 + i * 88} y="402" width="9" height="9" rx="2" fill={fill} opacity="0.88"/>
            <text x={27 + i * 88} y="410" fontSize="7.5" fontFamily="system-ui" fill="#666">
              {labels[type]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default IsometricMap;
