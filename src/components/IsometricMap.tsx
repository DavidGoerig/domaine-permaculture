import React from 'react';
import type { Zone, ZoneType, Plant } from '../types/domain';

/* ── Projection ─────────────────────────────────────────────────────────── */
const SC = 0.46;
const OX = 415;
const OY = 20;
const ISO_ANGLE = Math.atan2(SC * 0.5, SC) * (180 / Math.PI); // ≈ 26.57° axe est-ouest iso

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

/* ── Texture pattern IDs ────────────────────────────────────────────────── */
const ZONE_PATTERN: Partial<Record<ZoneType, string>> = {
  habitat: 'ptHabitat', eau: 'ptEau', 'maraîchage': 'ptMaraichage',
  verger: 'ptVerger', animaux: 'ptAnimaux', stockage: 'ptStockage',
  transformation: 'ptTransformation', champignons: 'ptChampignons',
  'mellifères': 'ptMelliferes',
};

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
    (a, b) => (a.x + a.width + a.y + a.height) - (b.x + b.width + b.y + b.height)
  );

  /* ── Plant strips on top face ─────────────────────────────────────────── */
  function renderPlantStrips(zone: Zone, lift: number = 0) {
    const { x, y, width: w, height: h, id, type } = zone;
    const colors = ZONE_COLORS[type] ?? { fill: '#ddd', stroke: '#999' };
    const isSelected = id === selectedZoneId;
    const strokeCol  = isSelected ? '#1a1a1a' : colors.stroke;
    const sw         = isSelected ? 2 : 0.7;

    const buildingTypes: ZoneType[] = ['habitat', 'transformation', 'stockage'];
    const zonePlants = buildingTypes.includes(type)
      ? []
      : plants.filter(p => p.zones.includes(id));
    const lp = ([sx, sy]: [number, number]): [number, number] => [sx, sy - lift];
    const TL = lp(iso(x,     y    ));
    const TR = lp(iso(x + w, y    ));
    const BR = lp(iso(x + w, y + h));
    const BL = lp(iso(x,     y + h));

    if (zonePlants.length === 0) {
      const patId = ZONE_PATTERN[type];
      return (
        <g>
          <polygon points={pts([TL, TR, BR, BL])}
            fill={isSelected ? lighten(colors.fill, 0.22) : colors.fill}
            stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"/>
          {patId && (
            <polygon points={pts([TL, TR, BR, BL])}
              fill={`url(#${patId})`} opacity={0.75}
              stroke="none" pointerEvents="none"/>
          )}
        </g>
      );
    }

    const totalYield = Math.max(1, zonePlants.reduce((s, p) => s + p.yieldKgPerM2, 0));

    // Raw sizes with per-plant minimum, then normalize so total = exactly h
    const minPerStrip = h / zonePlants.length;
    const rawSizes = zonePlants.map(p =>
      Math.max(minPerStrip, (p.yieldKgPerM2 / totalYield) * h)
    );
    const totalRaw = rawSizes.reduce((s, v) => s + v, 0);

    const strips: { plant: Plant; y0: number; y1: number }[] = [];
    let yOff = y;
    for (let i = 0; i < zonePlants.length; i++) {
      const sh = (rawSizes[i] / totalRaw) * h;
      strips.push({ plant: zonePlants[i], y0: yOff, y1: yOff + sh });
      yOff += sh;
    }

    const patId = ZONE_PATTERN[type];
    return (
      <g>
        {/* base fill + texture */}
        <polygon points={pts([TL, TR, BR, BL])}
          fill={isSelected ? lighten(colors.fill, 0.22) : colors.fill}
          stroke="none"/>
        {patId && (
          <polygon points={pts([TL, TR, BR, BL])}
            fill={`url(#${patId})`} opacity={0.5}
            stroke="none" pointerEvents="none"/>
        )}
        {strips.map(({ plant: p, y0, y1 }) => {
          const sTL = lp(iso(x,     y0));
          const sTR = lp(iso(x + w, y0));
          const sBR = lp(iso(x + w, y1));
          const sBL = lp(iso(x,     y1));
          const isSelItem = p.id === selectedItemId;
          const [scx, scy_g] = iso(x + w / 2, (y0 + y1) / 2);
          const scy = scy_g - lift;
          const stripH = (y1 - y0) * SC * 0.5;
          const isoW = TR[0] - TL[0];
          return (
            <g key={p.id}
              onClick={e => { e.stopPropagation(); onItemSelect?.(p.id, 'plant'); }}
              style={{ cursor: 'pointer' }}>
              <polygon
                points={pts([sTL, sTR, sBR, sBL])}
                fill={CATEGORY_COLORS[p.category] ?? '#888'}
                opacity={isSelItem ? 1 : 0.85}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={isSelItem ? 1.2 : 0.6}
              />
              {isoW >= 20 && (
                <text x={scx} y={scy} textAnchor="middle" dominantBaseline="middle"
                  fontSize={stripH >= 7 ? 5.5 : stripH >= 5 ? 4.5 : 3.8}
                  fontFamily="system-ui" fill="#fff" fontWeight="600"
                  transform={`rotate(${(type === 'champignons' ? -ISO_ANGLE : ISO_ANGLE).toFixed(2)}, ${scx.toFixed(1)}, ${scy.toFixed(1)})`}
                  pointerEvents="none" style={{ userSelect: 'none' }}>
                  {p.name}
                </text>
              )}
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
  function renderTrees(zone: Zone, lift: number = 0) {
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
            <circle cx={ix} cy={iy - lift} r={radius}      fill="#3a8a2a" opacity="0.88"/>
            <circle cx={ix} cy={iy - lift} r={radius * 0.5} fill="#2a6a1a" opacity="0.55"/>
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

    // Top face lifted hz pixels above ground — ground stays fixed, roof goes up
    const TR_top: [number, number] = [TR[0], TR[1] - hz];
    const BR_top: [number, number] = [BR[0], BR[1] - hz];
    const BL_top: [number, number] = [BL[0], BL[1] - hz];

    const [lcx, lcy_g] = iso(x + w / 2, y + h / 2);
    const lcy  = lcy_g - hz;  // label on top face
    const isoW = TR[0] - TL[0];
    const buildingTypes: ZoneType[] = ['habitat', 'transformation', 'stockage'];
    const hasPlants  = !buildingTypes.includes(type) && plants.some(p => p.zones.includes(id));
    const isTree     = (id === 'verger' || id === 'noyers') && !hasPlants;

    return (
      <g key={id} onClick={e => { e.stopPropagation(); onSelect(id); }} style={{ cursor: 'pointer' }} opacity={isHedge ? 0.55 : 1}>
        {/* South wall — ground south edge → top south edge */}
        {hz > 0 && (
          <polygon points={pts([BL, BR, BR_top, BL_top])}
            fill={darken(colors.fill, 0.68)} stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"/>
        )}
        {/* East wall — ground east edge → top east edge */}
        {hz > 0 && (
          <polygon points={pts([BR, TR, TR_top, BR_top])}
            fill={darken(colors.fill, 0.52)} stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"/>
        )}
        {/* Top face (with plant strips if applicable) */}
        {renderPlantStrips(zone, hz)}
        {/* Tree decorations */}
        {isTree && renderTrees(zone, hz)}
        {/* Label — only on zones without plant strips */}
        {isoW >= 14 && !hasPlants && (
          <text x={lcx} y={lcy} textAnchor="middle" dominantBaseline="middle"
            fontSize={isoW > 80 ? 7.5 : isoW > 50 ? 6.5 : isoW > 30 ? 5.5 : 5}
            fontFamily="system-ui" fill="#222" fontWeight={isSelected ? '700' : '500'}
            transform={`rotate(${(type === 'champignons' ? -ISO_ANGLE : ISO_ANGLE).toFixed(2)}, ${lcx.toFixed(1)}, ${lcy.toFixed(1)})`}
            pointerEvents="none" style={{ userSelect: 'none' }}>
            {name}
          </text>
        )}
        {zone.surfaceM2 && isoW >= 90 && !hasPlants && (
          <text x={lcx} y={lcy + 8} textAnchor="middle" dominantBaseline="middle"
            fontSize="5.5" fontFamily="system-ui" fill="#555"
            transform={`rotate(${ISO_ANGLE.toFixed(2)}, ${lcx.toFixed(1)}, ${(lcy + 8).toFixed(1)})`}
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

        {/* Habitat — briques */}
        <pattern id="ptHabitat" x="0" y="0" width="9" height="5" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="9" y2="0" stroke="#a89070" strokeWidth="0.5" opacity="0.45"/>
          <line x1="0" y1="2.5" x2="9" y2="2.5" stroke="#a89070" strokeWidth="0.5" opacity="0.45"/>
          <line x1="4.5" y1="0" x2="4.5" y2="2.5" stroke="#a89070" strokeWidth="0.4" opacity="0.35"/>
          <line x1="0" y1="2.5" x2="0" y2="5" stroke="#a89070" strokeWidth="0.4" opacity="0.35"/>
          <line x1="9" y1="2.5" x2="9" y2="5" stroke="#a89070" strokeWidth="0.4" opacity="0.35"/>
        </pattern>

        {/* Eau — ondes */}
        <pattern id="ptEau" x="0" y="0" width="10" height="5" patternUnits="userSpaceOnUse">
          <path d="M0,2.5 Q2.5,1 5,2.5 Q7.5,4 10,2.5" stroke="#3a90c0" strokeWidth="0.6" fill="none" opacity="0.5"/>
        </pattern>

        {/* Maraîchage — rangées de pointillés */}
        <pattern id="ptMaraichage" x="0" y="0" width="7" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.9" fill="#3aaa5a" opacity="0.45"/>
          <circle cx="5" cy="1.5" r="0.9" fill="#3aaa5a" opacity="0.45"/>
          <circle cx="3" cy="4" r="0.9" fill="#3aaa5a" opacity="0.45"/>
        </pattern>

        {/* Verger — couronnes d'arbres */}
        <pattern id="ptVerger" x="0" y="0" width="12" height="9" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="4.5" r="3" fill="none" stroke="#7aaa3a" strokeWidth="0.5" opacity="0.45"/>
          <circle cx="6" cy="4.5" r="1" fill="#7aaa3a" opacity="0.25"/>
        </pattern>

        {/* Animaux — touffes d'herbe */}
        <pattern id="ptAnimaux" x="0" y="0" width="8" height="6" patternUnits="userSpaceOnUse">
          <line x1="2" y1="5" x2="1.5" y2="2.5" stroke="#8a7a3a" strokeWidth="0.5" opacity="0.4"/>
          <line x1="2" y1="5" x2="2.5" y2="2.5" stroke="#8a7a3a" strokeWidth="0.5" opacity="0.4"/>
          <line x1="6" y1="5" x2="5.5" y2="3" stroke="#8a7a3a" strokeWidth="0.5" opacity="0.4"/>
          <line x1="6" y1="5" x2="6.5" y2="3" stroke="#8a7a3a" strokeWidth="0.5" opacity="0.4"/>
        </pattern>

        {/* Stockage — hachures diagonales */}
        <pattern id="ptStockage" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <line x1="0" y1="6" x2="6" y2="0" stroke="#888" strokeWidth="0.5" opacity="0.35"/>
          <line x1="-3" y1="6" x2="3" y2="0" stroke="#888" strokeWidth="0.5" opacity="0.35"/>
          <line x1="3" y1="6" x2="9" y2="0" stroke="#888" strokeWidth="0.5" opacity="0.35"/>
        </pattern>

        {/* Transformation — croisillons */}
        <pattern id="ptTransformation" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <line x1="0" y1="6" x2="6" y2="0" stroke="#cc8f3a" strokeWidth="0.4" opacity="0.3"/>
          <line x1="0" y1="0" x2="6" y2="6" stroke="#cc8f3a" strokeWidth="0.4" opacity="0.3"/>
        </pattern>

        {/* Champignons — points épars */}
        <pattern id="ptChampignons" x="0" y="0" width="8" height="6" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#7a5a9a" opacity="0.35"/>
          <circle cx="6" cy="4.5" r="0.8" fill="#7a5a9a" opacity="0.3"/>
        </pattern>

        {/* Mellifères — nid d'abeilles */}
        <pattern id="ptMelliferes" x="0" y="0" width="9" height="8" patternUnits="userSpaceOnUse">
          <polygon points="4.5,1 7.5,3 7.5,5 4.5,7 1.5,5 1.5,3"
            fill="none" stroke="#c8a820" strokeWidth="0.5" opacity="0.4"/>
        </pattern>
      </defs>

      <rect width="830" height="420" fill="url(#isoSky)"/>

      {/* Ground plane */}
      <polygon
        points={pts([iso(10,0), iso(714,0), iso(714,692), iso(10,692)])}
        fill="#c8dca8" opacity="0.18"/>

      {sorted.map(zone => renderZone(zone))}

      {/* Compass — isométrique (axes alignés sur la projection) */}
      {/* N: upper-right [+0.895, -0.447], E: lower-right [+0.895, +0.447] */}
      <g transform="translate(798,38)" fontFamily="system-ui">
        <circle cx="0" cy="0" r="15" fill="#fff" opacity="0.82"/>
        <line x1="-9" y1="4.5"  x2="9" y2="-4.5" stroke="#bbb" strokeWidth="0.8"/>
        <line x1="-9" y1="-4.5" x2="9" y2="4.5"  stroke="#bbb" strokeWidth="0.8"/>
        <polygon points="9,-4.5 5,-1.5 6.5,-4" fill="#c44"/>
        <text x="11"  y="-4"  textAnchor="start" fontSize="6" fill="#c44" fontWeight="700">N</text>
        <text x="11"  y="7"   textAnchor="start" fontSize="6" fill="#666">E</text>
        <text x="-11" y="-4"  textAnchor="end"   fontSize="6" fill="#666">O</text>
        <text x="-11" y="7"   textAnchor="end"   fontSize="6" fill="#666">S</text>
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
