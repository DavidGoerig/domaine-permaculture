import React from 'react';
import type { Zone, ZoneType, Plant, Flow } from '../types/domain';

/* ── Projection ─────────────────────────────────────────────────────────── */
const SC = 0.46;
const OX = 415;
const OY = 20;
const ISO_ANGLE = Math.atan2(SC * 0.5, SC) * (180 / Math.PI); // ≈ 26.57° axe est-ouest iso

const MAX_X = 714;
const MAX_Y = 692;

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

const FLOW_COLORS: Record<string, string> = {
  water: '#3B8BD4', fertility: '#639922', cuisine: '#E8593C',
  animals: '#EF9F27', transformation: '#7a5a9a',
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
  flows?: Flow[];
  showFlows?: boolean;
  selectedZoneId: string | null;
  selectedItemId?: string | null;
  onSelect: (id: string | null) => void;
  onItemSelect?: (id: string, type: 'plant' | 'animal' | 'mushroom' | 'beehive') => void;
  visibleTypes?: Set<ZoneType>;
  rotation?: 0 | 1 | 2 | 3;
  onRotate?: (r: 0 | 1 | 2 | 3) => void;
}


/* ── Component ───────────────────────────────────────────────────────────── */
const IsometricMap: React.FC<Props> = ({
  zones, plants = [], flows = [], showFlows = false, selectedZoneId, selectedItemId, onSelect, onItemSelect,
  visibleTypes, rotation, onRotate,
}) => {
  // Rotated projection
  function isoR(wx: number, wy: number): [number, number] {
    switch (rotation ?? 0) {
      case 1: return iso(MAX_Y - wy, wx);
      case 2: return iso(MAX_X - wx, MAX_Y - wy);
      case 3: return iso(wy, MAX_X - wx);
      default: return iso(wx, wy);
    }
  }

  const rot = rotation ?? 0;

  // Override champignons_haie to full visual extent (matches FarmMap custom band)
  const zonesEff = zones.map(z =>
    z.id === 'champignons_haie' ? { ...z, x: 626, y: 178, width: 88, height: 510 } : z
  );

  // Painter's algorithm — sort key depends on rotation; haies always first
  const isoDepth = (z: Zone): number => {
    if (z.id.startsWith('haie')) return -1e9;
    switch (rot) {
      case 1: return (z.x + z.width) - z.y;
      case 2: return -(z.x + z.y);
      case 3: return (z.y + z.height) - z.x;
      default: return z.x + z.width + z.y + z.height;
    }
  };
  const sorted = [...zonesEff].sort((a, b) => isoDepth(a) - isoDepth(b));

  // Filter by visible types
  const visible = sorted.filter(z => !visibleTypes || visibleTypes.has(z.type));

  const viewBox = '0 0 830 420';

  // Label angle follows east-west axis of current rotation
  const labelAngle = (type: ZoneType): number => {
    const isNS = type === 'champignons';
    const base = rot % 2 === 0 ? ISO_ANGLE : -ISO_ANGLE;
    return isNS ? -base : base;
  };

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
    const TL = lp(isoR(x,     y    ));
    const TR = lp(isoR(x + w, y    ));
    const BR = lp(isoR(x + w, y + h));
    const BL = lp(isoR(x,     y + h));

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
          const sTL = lp(isoR(x,     y0));
          const sTR = lp(isoR(x + w, y0));
          const sBR = lp(isoR(x + w, y1));
          const sBL = lp(isoR(x,     y1));
          const isSelItem = p.id === selectedItemId;
          const [scx, scy_g] = isoR(x + w / 2, (y0 + y1) / 2);
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
                  transform={`rotate(${labelAngle(type).toFixed(2)}, ${scx.toFixed(1)}, ${scy.toFixed(1)})`}
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
        const [ix, iy] = isoR(wx, wy);
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

    const TL = isoR(x,     y);
    const TR = isoR(x + w, y);
    const BR = isoR(x + w, y + h);
    const BL = isoR(x,     y + h);

    // Top face lifted hz pixels above ground
    const TL_top: [number, number] = [TL[0], TL[1] - hz];
    const TR_top: [number, number] = [TR[0], TR[1] - hz];
    const BR_top: [number, number] = [BR[0], BR[1] - hz];
    const BL_top: [number, number] = [BL[0], BL[1] - hz];

    // Visible walls depend on rotation: viewer at NE(0) SE(1) SW(2) NW(3)
    type Wall = [number,number][];
    let wall1: Wall, wall2: Wall;
    switch (rot) {
      case 1: wall1 = [TL,BL,BL_top,TL_top]; wall2 = [TL,TR,TR_top,TL_top]; break;
      case 2: wall1 = [TL,TR,TR_top,TL_top]; wall2 = [TL,BL,BL_top,TL_top]; break;
      case 3: wall1 = [BL,BR,BR_top,BL_top]; wall2 = [TL,BL,BL_top,TL_top]; break;
      default: wall1 = [BL,BR,BR_top,BL_top]; wall2 = [BR,TR,TR_top,BR_top];
    }

    const [lcx, lcy_g] = isoR(x + w / 2, y + h / 2);
    const lcy  = lcy_g - hz;
    const isoW = Math.abs(TR[0] - TL[0]);
    const buildingTypes: ZoneType[] = ['habitat', 'transformation', 'stockage'];
    const hasPlants  = !buildingTypes.includes(type) && plants.some(p => p.zones.includes(id));
    const isTree     = (id === 'verger' || id === 'noyers') && !hasPlants;

    return (
      <g key={id} onClick={e => { e.stopPropagation(); onSelect(id); }} style={{ cursor: 'pointer' }} opacity={isHedge ? 0.55 : 1}>
        {hz > 0 && (
          <polygon points={pts(wall1 as [number,number][])}
            fill={darken(colors.fill, 0.68)} stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"/>
        )}
        {hz > 0 && (
          <polygon points={pts(wall2 as [number,number][])}
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
            transform={`rotate(${labelAngle(type).toFixed(2)}, ${lcx.toFixed(1)}, ${lcy.toFixed(1)})`}
            pointerEvents="none" style={{ userSelect: 'none' }}>
            {name}
          </text>
        )}
        {zone.surfaceM2 && isoW >= 90 && !hasPlants && (
          <text x={lcx} y={lcy + 8} textAnchor="middle" dominantBaseline="middle"
            fontSize="5.5" fontFamily="system-ui" fill="#555"
            transform={`rotate(${labelAngle(type).toFixed(2)}, ${lcx.toFixed(1)}, ${(lcy + 8).toFixed(1)})`}
            pointerEvents="none" style={{ userSelect: 'none' }}>
            {zone.surfaceM2.toLocaleString('fr')} m²
          </text>
        )}
        <title>{name}{zone.surfaceM2 ? ` — ${zone.surfaceM2.toLocaleString('fr')} m²` : ''}</title>
      </g>
    );
  }

  /* ── Compass labels by rotation ──────────────────────────────────────── */
  const compassLabels = [
    { NE: 'N', SE: 'E', SW: 'S', NW: 'O', front: 'S' },
    { NE: 'E', SE: 'S', SW: 'O', NW: 'N', front: 'O' },
    { NE: 'S', SE: 'O', SW: 'N', NW: 'E', front: 'N' },
    { NE: 'O', SE: 'N', SW: 'E', NW: 'S', front: 'E' },
  ][rot];

  const handleCompassClick = (label: string) => {
    if (!onRotate) return;
    const frontMap: Record<string, 0 | 1 | 2 | 3> = { S: 0, O: 1, N: 2, E: 3 };
    const target = frontMap[label];
    if (target !== undefined) onRotate(target);
  };

  const labelStyle = (label: string) => ({
    cursor: onRotate ? 'pointer' : 'default',
    fontWeight: label === compassLabels.front ? 700 : 400,
    fill: label === compassLabels.front ? '#c44' : '#666',
  });

  /* ── Flows render ───────────────────────────────────────────────────── */
  function renderFlows() {
    const zoneMap = new Map(zonesEff.map(z => [z.id, z]));
    const elems: React.ReactNode[] = [];

    flows.forEach(flow => {
      if (!flow.fromZoneId || !flow.toZoneId) return;
      const from = zoneMap.get(flow.fromZoneId);
      const to   = zoneMap.get(flow.toZoneId);
      if (!from || !to) return;

      const isHedgeFrom = from.id.startsWith('haie');
      const isHedgeTo   = to.id.startsWith('haie');
      const hzFrom = isHedgeFrom ? 0 : (HEIGHTS[from.type] ?? 10);
      const hzTo   = isHedgeTo   ? 0 : (HEIGHTS[to.type]   ?? 10);

      const [fx, fy_g] = isoR(from.x + from.width / 2, from.y + from.height / 2);
      const fy = fy_g - hzFrom;
      const [tx, ty_g] = isoR(to.x + to.width / 2, to.y + to.height / 2);
      const ty = ty_g - hzTo;

      const color = FLOW_COLORS[flow.type] ?? '#888';
      const markerId = `arrowIso-${flow.type}`;

      elems.push(
        <line
          key={flow.id}
          x1={fx} y1={fy}
          x2={tx} y2={ty}
          stroke={color}
          strokeWidth={1.2}
          opacity={0.75}
          strokeDasharray="4 2"
          markerEnd={`url(#${markerId})`}
        />
      );
    });

    return <g pointerEvents="none">{elems}</g>;
  }

  /* ── SVG ─────────────────────────────────────────────────────────────── */
  return (
    <svg viewBox={viewBox} style={{ display: 'block', width: '100%', minWidth: '520px' }}
      onClick={() => onSelect(null)}>
      <defs>
        {/* Sky gradient */}
        <linearGradient id="isoSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2d7fc1"/>
          <stop offset="35%"  stopColor="#6ab4df"/>
          <stop offset="70%"  stopColor="#b8ddf0"/>
          <stop offset="100%" stopColor="#d0ecd8"/>
        </linearGradient>
        {/* Sun glow — upper-left */}
        <radialGradient id="sunGlow" cx="12%" cy="14%" r="28%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#fff8c0" stopOpacity="0.95"/>
          <stop offset="25%"  stopColor="#ffe97a" stopOpacity="0.5"/>
          <stop offset="60%"  stopColor="#ffd040" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#87ceeb" stopOpacity="0"/>
        </radialGradient>
        {/* Ground plane gradient */}
        <linearGradient id="isoGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#b8d890"/>
          <stop offset="100%" stopColor="#90b860"/>
        </linearGradient>

        {/* Flow arrow markers — one per flow type */}
        {(Object.entries(FLOW_COLORS) as [string, string][]).map(([type, color]) => (
          <marker
            key={type}
            id={`arrowIso-${type}`}
            markerWidth="6" markerHeight="6"
            refX="5" refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" fill={color} opacity={0.85}/>
          </marker>
        ))}

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

      {/* Sky */}
      <rect width="830" height="420" fill="url(#isoSky)"/>
      {/* Sun glow */}
      <rect width="830" height="420" fill="url(#sunGlow)"/>
      {/* Sun disc */}
      <circle cx="102" cy="58" r="11" fill="#fff9a0" opacity="0.9"/>
      <circle cx="102" cy="58" r="7"  fill="#fff5c0" opacity="0.98"/>

      {/* Clouds */}
      <g opacity="0.88">
        <ellipse cx="195" cy="28" rx="34" ry="11" fill="white"/>
        <ellipse cx="222" cy="22" rx="22" ry="10" fill="white"/>
        <ellipse cx="170" cy="26" rx="20" ry="9"  fill="white"/>
      </g>
      <g opacity="0.72">
        <ellipse cx="80"  cy="52" rx="22" ry="8"  fill="white"/>
        <ellipse cx="100" cy="47" rx="16" ry="7"  fill="white"/>
        <ellipse cx="62"  cy="50" rx="14" ry="6"  fill="white"/>
      </g>
      <g opacity="0.65">
        <ellipse cx="710" cy="26" rx="28" ry="9"  fill="white"/>
        <ellipse cx="735" cy="21" rx="18" ry="8"  fill="white"/>
        <ellipse cx="688" cy="24" rx="16" ry="7"  fill="white"/>
      </g>

      {/* Ground plane */}
      <polygon
        points={pts([isoR(10,0), isoR(MAX_X,0), isoR(MAX_X,MAX_Y), isoR(10,MAX_Y)])}
        fill="url(#isoGround)" opacity="0.28"/>

      {visible.map(zone => renderZone(zone))}

      {/* Flows — rendered above zones */}
      {showFlows && renderFlows()}

      {/* Compass — isométrique (axes alignés sur la projection) */}
      {/* Upper-right arm = NE direction in screen space */}
      <g transform="translate(798,38)" fontFamily="system-ui" onClick={e => e.stopPropagation()}>
        <circle cx="0" cy="0" r="15" fill="#fff" opacity="0.82"/>
        <line x1="-9" y1="4.5"  x2="9" y2="-4.5" stroke="#bbb" strokeWidth="0.8"/>
        <line x1="-9" y1="-4.5" x2="9" y2="4.5"  stroke="#bbb" strokeWidth="0.8"/>
        {/* Arrow tip toward upper-right (NE arm) */}
        <polygon points="9,-4.5 5,-1.5 6.5,-4"
          fill={compassLabels.NE === compassLabels.front ? '#c44' : '#aaa'}/>
        {/* NE arm label */}
        <text x="11" y="-4" textAnchor="start" fontSize="6"
          style={labelStyle(compassLabels.NE)}
          onClick={() => handleCompassClick(compassLabels.NE)}>
          {compassLabels.NE}
        </text>
        {/* SE arm label */}
        <text x="11" y="7" textAnchor="start" fontSize="6"
          style={labelStyle(compassLabels.SE)}
          onClick={() => handleCompassClick(compassLabels.SE)}>
          {compassLabels.SE}
        </text>
        {/* NW arm label */}
        <text x="-11" y="-4" textAnchor="end" fontSize="6"
          style={labelStyle(compassLabels.NW)}
          onClick={() => handleCompassClick(compassLabels.NW)}>
          {compassLabels.NW}
        </text>
        {/* SW arm label */}
        <text x="-11" y="7" textAnchor="end" fontSize="6"
          style={labelStyle(compassLabels.SW)}
          onClick={() => handleCompassClick(compassLabels.SW)}>
          {compassLabels.SW}
        </text>
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
