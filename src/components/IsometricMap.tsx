import React, { useState } from 'react';
import type { Zone, ZoneType, Plant, Flow } from '../types/domain';

/* ── Projection ─────────────────────────────────────────────────────────── */
const SC = 0.46;
const OX = 415;
const OY = 20;
const ISO_ANGLE = Math.atan2(SC * 0.5, SC) * (180 / Math.PI);

const MAX_X = 714;
const MAX_Y = 692;

function iso(wx: number, wy: number): [number, number] {
  return [(wx - wy) * SC + OX, (wx + wy) * SC * 0.5 + OY];
}
function pts(points: [number, number][]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

/* ── Voxel grid ──────────────────────────────────────────────────────────── */
const VOXEL_SIZE = 24; // world units per voxel cell
const VOXEL_H    = 8;  // screen pixels per voxel layer

const VOXEL_LAYERS: Partial<Record<ZoneType, number>> = {
  habitat: 4, transformation: 3, stockage: 3,
  animaux: 2, verger: 2, champignons: 2, eau: 2,
  'maraîchage': 1, 'mellifères': 1,
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

function darken(hex: string, f: number): string {
  const h = hex.replace('#', '');
  return `rgb(${Math.round(parseInt(h.slice(0,2),16)*f)},${Math.round(parseInt(h.slice(2,4),16)*f)},${Math.round(parseInt(h.slice(4,6),16)*f)})`;
}

// Deterministic per-voxel color variation for a Minecraft-like texture
function voxelShade(fill: string, gx: number, gy: number, bonus: number = 0): string {
  const seed  = (gx * 7 + gy * 13) % 16;
  const delta = (seed - 8) * 1.8 + bonus;
  const h = fill.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(h.slice(0,2), 16) + delta));
  const g = Math.min(255, Math.max(0, parseInt(h.slice(2,4), 16) + delta));
  const b = Math.min(255, Math.max(0, parseInt(h.slice(4,6), 16) + delta));
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

/* ── Voxel face motifs ───────────────────────────────────────────────────── */
// Each motif is rendered in flat screen space centered at (cx, cy), size ~s px
function VoxelMotif({ type, zoneId, cx, cy, s }: {
  type: ZoneType; zoneId: string; cx: number; cy: number; s: number;
}) {
  const sw = 0.55;
  switch (type) {
    case 'habitat':
      // House: roof triangle + rectangle body
      return (
        <g pointerEvents="none" opacity={0.72}>
          <polygon points={`${cx},${cy - s * 0.72} ${cx - s * 0.55},${cy - s * 0.15} ${cx + s * 0.55},${cy - s * 0.15}`}
            fill="#c09060" stroke="#a07040" strokeWidth={sw}/>
          <rect x={cx - s * 0.38} y={cy - s * 0.15} width={s * 0.76} height={s * 0.6}
            fill="#d4c5a9" stroke="#a89070" strokeWidth={sw}/>
          <rect x={cx - s * 0.13} y={cy + s * 0.05} width={s * 0.26} height={s * 0.38}
            fill="#a89070" stroke="none"/>
        </g>
      );

    case 'eau':
      if (zoneId === 'aquaponie') return (
        // Fish silhouette
        <g pointerEvents="none" opacity={0.75}>
          <ellipse cx={cx} cy={cy} rx={s * 0.48} ry={s * 0.22} fill="#5ba8d4" stroke="#3a90c0" strokeWidth={sw}/>
          <polygon points={`${cx + s * 0.45},${cy - s * 0.22} ${cx + s * 0.8},${cy} ${cx + s * 0.45},${cy + s * 0.22}`}
            fill="#5ba8d4" stroke="#3a90c0" strokeWidth={sw}/>
          <circle cx={cx - s * 0.22} cy={cy - s * 0.05} r={s * 0.07} fill="#fff" opacity={0.9}/>
        </g>
      );
      // Water tank / barrel
      return (
        <g pointerEvents="none" opacity={0.75}>
          <ellipse cx={cx} cy={cy - s * 0.25} rx={s * 0.38} ry={s * 0.15} fill="#8ecae6" stroke="#3a90c0" strokeWidth={sw}/>
          <rect x={cx - s * 0.38} y={cy - s * 0.25} width={s * 0.76} height={s * 0.65}
            fill="#8ecae6" stroke="#3a90c0" strokeWidth={sw}/>
          <ellipse cx={cx} cy={cy + s * 0.4} rx={s * 0.38} ry={s * 0.15} fill="#7abcd4" stroke="#3a90c0" strokeWidth={sw}/>
          <line x1={cx - s * 0.38} y1={cy + 0.04} x2={cx + s * 0.38} y2={cy + 0.04} stroke="#3a90c0" strokeWidth={sw} opacity={0.5}/>
        </g>
      );

    case 'maraîchage': {
      // Rows of small plants
      const cols3 = [-1, 0, 1];
      return (
        <g pointerEvents="none" opacity={0.82}>
          {cols3.map(i => (
            <g key={i}>
              <line x1={cx + i * s * 0.35} y1={cy + s * 0.42} x2={cx + i * s * 0.35} y2={cy - s * 0.18} stroke="#3aaa5a" strokeWidth={sw}/>
              <ellipse cx={cx + i * s * 0.35} cy={cy - s * 0.3} rx={s * 0.16} ry={s * 0.22} fill="#3aaa5a" opacity={0.85}/>
            </g>
          ))}
        </g>
      );
    }

    case 'verger':
      // Tree canopy + trunk
      return (
        <g pointerEvents="none" opacity={0.82}>
          <line x1={cx} y1={cy + s * 0.45} x2={cx} y2={cy + s * 0.05} stroke="#7a5a2a" strokeWidth={sw * 1.2}/>
          <circle cx={cx} cy={cy - s * 0.15} r={s * 0.42} fill="#3a8a2a" opacity={0.85}/>
          <circle cx={cx - s * 0.18} cy={cy - s * 0.28} r={s * 0.18} fill="#2a6a1a" opacity={0.45}/>
        </g>
      );

    case 'animaux':
      if (zoneId === 'poulailler') return (
        // Hen: body + head + beak
        <g pointerEvents="none" opacity={0.82}>
          <ellipse cx={cx} cy={cy + s * 0.1} rx={s * 0.4} ry={s * 0.3} fill="#f0c060" stroke="#cc9a3a" strokeWidth={sw}/>
          <circle cx={cx + s * 0.38} cy={cy - s * 0.22} r={s * 0.2} fill="#f0c060" stroke="#cc9a3a" strokeWidth={sw}/>
          <polygon points={`${cx + s * 0.56},${cy - s * 0.22} ${cx + s * 0.72},${cy - s * 0.3} ${cx + s * 0.72},${cy - s * 0.14}`}
            fill="#e8a020"/>
          <rect x={cx + s * 0.3} y={cy - s * 0.38} width={s * 0.22} height={s * 0.12} rx={s * 0.04} fill="#e04040"/>
        </g>
      );
      // Cow: body + head + spots
      return (
        <g pointerEvents="none" opacity={0.82}>
          <ellipse cx={cx} cy={cy + s * 0.1} rx={s * 0.52} ry={s * 0.3} fill="#f5f0e8" stroke="#999" strokeWidth={sw}/>
          <circle cx={cx + s * 0.46} cy={cy - s * 0.15} r={s * 0.22} fill="#f5f0e8" stroke="#999" strokeWidth={sw}/>
          <ellipse cx={cx - s * 0.1} cy={cy + s * 0.05} rx={s * 0.18} ry={s * 0.18} fill="#555" opacity={0.3}/>
          <ellipse cx={cx + s * 0.22} cy={cy + s * 0.22} rx={s * 0.12} ry={s * 0.12} fill="#555" opacity={0.3}/>
        </g>
      );

    case 'stockage':
      if (zoneId === 'serre_semis') return (
        // Greenhouse: arch + panes
        <g pointerEvents="none" opacity={0.75}>
          <path d={`M${cx - s * 0.52},${cy + s * 0.38} Q${cx - s * 0.52},${cy - s * 0.55} ${cx},${cy - s * 0.55} Q${cx + s * 0.52},${cy - s * 0.55} ${cx + s * 0.52},${cy + s * 0.38}`}
            fill="#d0f0e8" stroke="#888" strokeWidth={sw} opacity={0.85}/>
          <line x1={cx} y1={cy - s * 0.55} x2={cx} y2={cy + s * 0.38} stroke="#999" strokeWidth={sw}/>
          <line x1={cx - s * 0.52} y1={cy - s * 0.05} x2={cx + s * 0.52} y2={cy - s * 0.05} stroke="#999" strokeWidth={sw}/>
        </g>
      );
      if (zoneId === 'sechoir') return (
        // Solar dryer: panel + vents
        <g pointerEvents="none" opacity={0.75}>
          <rect x={cx - s * 0.5} y={cy - s * 0.5} width={s} height={s * 0.7} rx={s * 0.05}
            fill="#1a1a3a" stroke="#555" strokeWidth={sw}/>
          {[-0.3, 0, 0.3].map(i => (
            <line key={i} x1={cx + i * s * 0.28} y1={cy + s * 0.35} x2={cx + i * s * 0.28} y2={cy + s * 0.65}
              stroke="#888" strokeWidth={sw}/>
          ))}
        </g>
      );
      // Hangar / stockage: box with door
      return (
        <g pointerEvents="none" opacity={0.75}>
          <rect x={cx - s * 0.5} y={cy - s * 0.38} width={s} height={s * 0.76}
            fill="#d8d8d8" stroke="#888" strokeWidth={sw}/>
          <polygon points={`${cx - s * 0.5},${cy - s * 0.38} ${cx},${cy - s * 0.68} ${cx + s * 0.5},${cy - s * 0.38}`}
            fill="#c0c0c0" stroke="#888" strokeWidth={sw}/>
          <rect x={cx - s * 0.15} y={cy + s * 0.0} width={s * 0.3} height={s * 0.38}
            fill="#aaa" stroke="none"/>
        </g>
      );

    case 'transformation':
      if (zoneId === 'cave') return (
        // Root cellar: arch door + stone texture
        <g pointerEvents="none" opacity={0.75}>
          <rect x={cx - s * 0.5} y={cy - s * 0.2} width={s} height={s * 0.62}
            fill="#c8b89a" stroke="#a89070" strokeWidth={sw}/>
          <path d={`M${cx - s * 0.24},${cy + s * 0.42} L${cx - s * 0.24},${cy - s * 0.02} Q${cx},${cy - s * 0.38} ${cx + s * 0.24},${cy - s * 0.02} L${cx + s * 0.24},${cy + s * 0.42}`}
            fill="#444" stroke="#333" strokeWidth={sw}/>
        </g>
      );
      if (zoneId === 'fromagerie') return (
        // Cheese wheel
        <g pointerEvents="none" opacity={0.78}>
          <ellipse cx={cx} cy={cy} rx={s * 0.46} ry={s * 0.3} fill="#f5e090" stroke="#cc8f3a" strokeWidth={sw}/>
          <ellipse cx={cx} cy={cy - s * 0.28} rx={s * 0.46} ry={s * 0.3} fill="#fdf4c0" stroke="#cc8f3a" strokeWidth={sw}/>
          <line x1={cx - s * 0.46} y1={cy} x2={cx - s * 0.46} y2={cy - s * 0.28} stroke="#cc8f3a" strokeWidth={sw}/>
          <line x1={cx + s * 0.46} y1={cy} x2={cx + s * 0.46} y2={cy - s * 0.28} stroke="#cc8f3a" strokeWidth={sw}/>
        </g>
      );
      // Generic kitchen pot
      return (
        <g pointerEvents="none" opacity={0.75}>
          <ellipse cx={cx} cy={cy + s * 0.22} rx={s * 0.42} ry={s * 0.18} fill="#e0a060" stroke="#cc8f3a" strokeWidth={sw}/>
          <rect x={cx - s * 0.42} y={cy - s * 0.28} width={s * 0.84} height={s * 0.5}
            fill="#f5c98a" stroke="#cc8f3a" strokeWidth={sw}/>
          <ellipse cx={cx} cy={cy - s * 0.28} rx={s * 0.42} ry={s * 0.18} fill="#fde0b0" stroke="#cc8f3a" strokeWidth={sw}/>
          <line x1={cx - s * 0.55} y1={cy - s * 0.15} x2={cx - s * 0.42} y2={cy - s * 0.15} stroke="#cc8f3a" strokeWidth={sw * 1.3}/>
          <line x1={cx + s * 0.42} y1={cy - s * 0.15} x2={cx + s * 0.55} y2={cy - s * 0.15} stroke="#cc8f3a" strokeWidth={sw * 1.3}/>
        </g>
      );

    case 'champignons': {
      // Mushroom: dome cap + stipe
      const seed2 = (zoneId.length + 3) % 3;
      const capColor = ['#c8a0d8', '#b890c8', '#d8b0e8'][seed2];
      return (
        <g pointerEvents="none" opacity={0.82}>
          <line x1={cx} y1={cy + s * 0.45} x2={cx} y2={cy + s * 0.05} stroke="#d4c8c0" strokeWidth={sw * 1.2}/>
          <ellipse cx={cx} cy={cy + s * 0.02} rx={s * 0.44} ry={s * 0.14} fill={capColor} opacity={0.5}/>
          <path d={`M${cx - s * 0.44},${cy + s * 0.02} Q${cx - s * 0.44},${cy - s * 0.52} ${cx},${cy - s * 0.52} Q${cx + s * 0.44},${cy - s * 0.52} ${cx + s * 0.44},${cy + s * 0.02}`}
            fill={capColor} stroke="#7a5a9a" strokeWidth={sw}/>
          <ellipse cx={cx} cy={cy - s * 0.5} rx={s * 0.44} ry={s * 0.1} fill={capColor} opacity={0.7}/>
        </g>
      );
    }

    case 'mellifères': {
      // Warré beehive: stacked boxes
      const stackY = [0, s * 0.3, s * 0.6];
      return (
        <g pointerEvents="none" opacity={0.82}>
          {stackY.map((dy, i) => (
            <rect key={i} x={cx - s * 0.38} y={cy - s * 0.6 + dy} width={s * 0.76} height={s * 0.28}
              fill={`hsl(45,70%,${72 - i * 6}%)`} stroke="#c8a820" strokeWidth={sw}/>
          ))}
          <line x1={cx - s * 0.38} y1={cy + s * 0.32} x2={cx + s * 0.38} y2={cy + s * 0.32}
            stroke="#c8a820" strokeWidth={sw * 0.7}/>
          {/* Bee dots */}
          {[[-0.28, -0.72], [0.18, -0.78], [-0.05, -0.85]].map(([bx, by], i) => (
            <circle key={i} cx={cx + bx * s} cy={cy + by * s} r={s * 0.06} fill="#f0a800" opacity={0.9}/>
          ))}
        </g>
      );
    }

    default:
      return null;
  }
}

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
  zones, flows = [], showFlows = false,
  selectedZoneId, onSelect,
  visibleTypes, rotation, onRotate,
}) => {
  function isoR(wx: number, wy: number): [number, number] {
    switch (rotation ?? 0) {
      case 1: return iso(MAX_Y - wy, wx);
      case 2: return iso(MAX_X - wx, MAX_Y - wy);
      case 3: return iso(wy, MAX_X - wx);
      default: return iso(wx, wy);
    }
  }

  const rot = rotation ?? 0;
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);

  const zonesEff = zones.map(z =>
    z.id === 'champignons_haie' ? { ...z, x: 626, y: 178, width: 88, height: 510 } : z
  );

  const visible = zonesEff.filter(z => !visibleTypes || visibleTypes.has(z.type));

  const viewBox = '0 0 830 420';

  const labelAngle = (type: ZoneType): number => {
    const isNS = type === 'champignons';
    const base  = rot % 2 === 0 ? ISO_ANGLE : -ISO_ANGLE;
    return isNS ? -base : base;
  };

  /* ── Voxel depth sort key ────────────────────────────────────────────── */
  function voxelSortKey(wx: number, wy: number, vw: number, vh: number): number {
    switch (rot) {
      case 1: return (wx + vw) - wy;
      case 2: return -wx - wy;
      case 3: return (wy + vh) - wx;
      default: return wx + wy;
    }
  }

  /* ── Build + sort all voxels ─────────────────────────────────────────── */
  interface VoxelData {
    key: string;
    wx: number; wy: number; vw: number; vh: number;
    fill: string; stroke: string; hz: number;
    zoneId: string; type: ZoneType;
    sortKey: number;
    isSelected: boolean;
    gx: number; gy: number;
    isHedge: boolean;
  }

  const allVoxels: VoxelData[] = [];

  for (const zone of visible) {
    const { x, y, width: w, height: h, type, id } = zone;
    const isHedge   = id.startsWith('haie');
    const isSelected = id === selectedZoneId;
    const colors    = ZONE_COLORS[type] ?? { fill: '#ddd', stroke: '#999' };
    const layers    = isHedge ? 0 : (VOXEL_LAYERS[type] ?? 1);
    const hz        = layers * VOXEL_H;

    const cols = Math.max(1, Math.round(w / VOXEL_SIZE));
    const rows = Math.max(1, Math.round(h / VOXEL_SIZE));
    const vw   = w / cols;
    const vh   = h / rows;

    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const wx = x + gx * vw;
        const wy = y + gy * vh;
        let sk   = voxelSortKey(wx, wy, vw, vh);
        if (isHedge) sk -= 1e9;

        allVoxels.push({
          key: `${id}-${gx}-${gy}`,
          wx, wy, vw, vh,
          fill: colors.fill, stroke: colors.stroke, hz,
          zoneId: id, type, sortKey: sk,
          isSelected, gx, gy, isHedge,
        });
      }
    }
  }

  allVoxels.sort((a, b) => a.sortKey - b.sortKey);

  /* ── Render one voxel ────────────────────────────────────────────────── */
  function renderVoxel(v: VoxelData) {
    const { wx, wy, vw, vh, fill, stroke, hz, zoneId, type, isSelected, gx, gy, isHedge } = v;

    const TL = isoR(wx,      wy);
    const TR = isoR(wx + vw, wy);
    const BR = isoR(wx + vw, wy + vh);
    const BL = isoR(wx,      wy + vh);

    const TL_top: [number,number] = [TL[0], TL[1] - hz];
    const TR_top: [number,number] = [TR[0], TR[1] - hz];
    const BR_top: [number,number] = [BR[0], BR[1] - hz];
    const BL_top: [number,number] = [BL[0], BL[1] - hz];

    const sw        = isSelected ? 1.2 : 0.35;
    const strokeCol = isSelected ? '#111' : stroke;
    const topFill   = voxelShade(fill, gx, gy, isSelected ? 28 : 0);

    type Wall = [number,number][];
    let wall1: Wall, wall2: Wall;
    switch (rot) {
      case 1: wall1 = [TR,BR,BR_top,TR_top]; wall2 = [TL,TR,TR_top,TL_top]; break;
      case 2: wall1 = [TL,TR,TR_top,TL_top]; wall2 = [TL,BL,BL_top,TL_top]; break;
      case 3: wall1 = [BL,BR,BR_top,BL_top]; wall2 = [TL,BL,BL_top,TL_top]; break;
      default: wall1 = [BL,BR,BR_top,BL_top]; wall2 = [BR,TR,TR_top,BR_top];
    }

    return (
      <g key={v.key}
        onClick={e => { e.stopPropagation(); onSelect(zoneId); }}
        style={{ cursor: 'pointer' }}
        opacity={isHedge ? 0.55 : 1}>
        {hz > 0 && (
          <polygon points={pts(wall1)}
            fill={darken(fill, isSelected ? 0.75 : 0.68)}
            stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"/>
        )}
        {hz > 0 && (
          <polygon points={pts(wall2)}
            fill={darken(fill, isSelected ? 0.60 : 0.52)}
            stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"/>
        )}
        <polygon points={pts([TL_top, TR_top, BR_top, BL_top])}
          fill={topFill}
          stroke={strokeCol} strokeWidth={sw} strokeLinejoin="round"/>
        {/* Motif on top face — centered, not clipped to face (small enough to stay inside) */}
        {!isHedge && (() => {
          const [mcx, mcy_g] = isoR(wx + vw / 2, wy + vh / 2);
          const mcy = mcy_g - hz;
          const motifSize = Math.min(vw, vh) * SC * 0.78;
          return (
            <VoxelMotif type={type} zoneId={zoneId} cx={mcx} cy={mcy} s={motifSize}/>
          );
        })()}
      </g>
    );
  }

  /* ── Tree decorations above voxels ──────────────────────────────────── */
  function renderTrees(zone: Zone, hz: number) {
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
            <circle cx={ix} cy={iy - hz} r={radius}        fill="#3a8a2a" opacity="0.88"/>
            <circle cx={ix} cy={iy - hz} r={radius * 0.5}  fill="#2a6a1a" opacity="0.55"/>
          </g>
        );
      }
    }
    return <g pointerEvents="none">{elems}</g>;
  }

  /* ── Zone labels + tree decorations (above all voxels) ───────────────── */
  function renderZoneOverlays() {
    return visible.map(zone => {
      const { x, y, width: w, height: h, type, id, name } = zone;
      const isHedge   = id.startsWith('haie');
      const layers    = isHedge ? 0 : (VOXEL_LAYERS[type] ?? 1);
      const hz        = layers * VOXEL_H;
      const [lcx, lcy_g] = isoR(x + w / 2, y + h / 2);
      const lcy  = lcy_g - hz;
      const isoW = Math.abs(isoR(x + w, y)[0] - isoR(x, y)[0]);
      const isTree = (id === 'verger' || id === 'noyers');

      return (
        <g key={`overlay-${id}`}>
          {isTree && renderTrees(zone, hz)}
          {isoW >= 14 && (
            <text x={lcx} y={lcy} textAnchor="middle" dominantBaseline="middle"
              fontSize={isoW > 80 ? 7.5 : isoW > 50 ? 6.5 : isoW > 30 ? 5.5 : 5}
              fontFamily="system-ui" fill="#222"
              fontWeight={id === selectedZoneId ? '700' : '500'}
              transform={`rotate(${labelAngle(type).toFixed(2)}, ${lcx.toFixed(1)}, ${lcy.toFixed(1)})`}
              pointerEvents="none" style={{ userSelect: 'none' }}>
              {name}
            </text>
          )}
          {zone.surfaceM2 && isoW >= 90 && (
            <text x={lcx} y={lcy + 8} textAnchor="middle" dominantBaseline="middle"
              fontSize="5.5" fontFamily="system-ui" fill="#555"
              transform={`rotate(${labelAngle(type).toFixed(2)}, ${lcx.toFixed(1)}, ${(lcy + 8).toFixed(1)})`}
              pointerEvents="none" style={{ userSelect: 'none' }}>
              {zone.surfaceM2.toLocaleString('fr')} m²
            </text>
          )}
        </g>
      );
    });
  }

  /* ── Compass ─────────────────────────────────────────────────────────── */
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

  /* ── Flows ───────────────────────────────────────────────────────────── */
  function renderFlows() {
    const zoneMap = new Map(zonesEff.map(z => [z.id, z]));
    const elems: React.ReactNode[] = [];

    flows.forEach(flow => {
      if (!flow.fromZoneId || !flow.toZoneId) return;
      const from = zoneMap.get(flow.fromZoneId);
      const to   = zoneMap.get(flow.toZoneId);
      if (!from || !to) return;

      const hzFrom = from.id.startsWith('haie') ? 0 : (VOXEL_LAYERS[from.type] ?? 1) * VOXEL_H;
      const hzTo   = to.id.startsWith('haie')   ? 0 : (VOXEL_LAYERS[to.type]   ?? 1) * VOXEL_H;

      const [fx, fy_g] = isoR(from.x + from.width / 2, from.y + from.height / 2);
      const fy = fy_g - hzFrom;
      const [tx, ty_g] = isoR(to.x + to.width / 2, to.y + to.height / 2);
      const ty = ty_g - hzTo;

      const color    = FLOW_COLORS[flow.type] ?? '#888';
      const isSel    = flow.id === selectedFlowId;

      elems.push(
        <g key={flow.id} style={{ cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); setSelectedFlowId(isSel ? null : flow.id); }}>
          <line x1={fx} y1={fy} x2={tx} y2={ty} stroke="transparent" strokeWidth={10}/>
          <line x1={fx} y1={fy} x2={tx} y2={ty}
            stroke={color}
            strokeWidth={isSel ? 2.2 : 1.2}
            opacity={isSel ? 1 : 0.75}
            strokeDasharray={isSel ? undefined : "4 2"}
            markerEnd={`url(#arrowIso-${flow.type})`}
          />
        </g>
      );
    });

    return <g>{elems}</g>;
  }

  /* ── SVG ─────────────────────────────────────────────────────────────── */
  return (
    <svg viewBox={viewBox} style={{ display: 'block', width: '100%', minWidth: '520px' }}
      onClick={() => { onSelect(null); setSelectedFlowId(null); }}>
      <defs>
        <linearGradient id="isoSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2d7fc1"/>
          <stop offset="35%"  stopColor="#6ab4df"/>
          <stop offset="70%"  stopColor="#b8ddf0"/>
          <stop offset="100%" stopColor="#d0ecd8"/>
        </linearGradient>
        <radialGradient id="sunGlow" cx="12%" cy="14%" r="28%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#fff8c0" stopOpacity="0.95"/>
          <stop offset="25%"  stopColor="#ffe97a" stopOpacity="0.5"/>
          <stop offset="60%"  stopColor="#ffd040" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#87ceeb" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="isoGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#b8d890"/>
          <stop offset="100%" stopColor="#90b860"/>
        </linearGradient>

        {(Object.entries(FLOW_COLORS) as [string, string][]).map(([type, color]) => (
          <marker key={type} id={`arrowIso-${type}`}
            markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={color} opacity={0.85}/>
          </marker>
        ))}
      </defs>

      {/* Sky + sun */}
      <rect width="830" height="420" fill="url(#isoSky)"/>
      <rect width="830" height="420" fill="url(#sunGlow)"/>
      <circle cx="102" cy="58" r="11" fill="#fff9a0" opacity="0.9"/>
      <circle cx="102" cy="58" r="7"  fill="#fff5c0" opacity="0.98"/>

      {/* Clouds */}
      <g opacity="0.88">
        <ellipse cx="195" cy="28" rx="34" ry="11" fill="white"/>
        <ellipse cx="222" cy="22" rx="22" ry="10" fill="white"/>
        <ellipse cx="170" cy="26" rx="20" ry="9"  fill="white"/>
      </g>
      <g opacity="0.72">
        <ellipse cx="80"  cy="52" rx="22" ry="8" fill="white"/>
        <ellipse cx="100" cy="47" rx="16" ry="7" fill="white"/>
        <ellipse cx="62"  cy="50" rx="14" ry="6" fill="white"/>
      </g>
      <g opacity="0.65">
        <ellipse cx="710" cy="26" rx="28" ry="9" fill="white"/>
        <ellipse cx="735" cy="21" rx="18" ry="8" fill="white"/>
        <ellipse cx="688" cy="24" rx="16" ry="7" fill="white"/>
      </g>

      {/* Ground plane */}
      <polygon
        points={pts([isoR(10,0), isoR(MAX_X,0), isoR(MAX_X,MAX_Y), isoR(10,MAX_Y)])}
        fill="url(#isoGround)" opacity="0.28"/>

      {/* All voxels — globally painter-sorted */}
      {allVoxels.map(renderVoxel)}

      {/* Trees + labels above voxels */}
      {renderZoneOverlays()}

      {/* Flows */}
      {showFlows && renderFlows()}

      {/* Flow info panel */}
      {showFlows && selectedFlowId && (() => {
        const flow = flows.find(f => f.id === selectedFlowId);
        if (!flow?.name) return null;
        const color = FLOW_COLORS[flow.type] ?? '#888';
        const desc  = flow.description ?? '';
        const l1 = desc.slice(0, 44);
        const l2 = desc.length > 44 ? desc.slice(44, 88) : '';
        const l3 = desc.length > 88 ? desc.slice(88, 132) + (desc.length > 132 ? '…' : '') : '';
        const px = 10, py = 300, PW = 262, PH = 88;
        return (
          <g pointerEvents="none">
            <rect x={px} y={py} width={PW} height={PH} rx={4}
              fill="#fff" stroke={color} strokeWidth={1.5} opacity={0.97}
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"/>
            <rect x={px} y={py} width={PW} height={14} rx={4} fill={color} opacity={0.15}/>
            <text x={px+7} y={py+10} fontSize="8.5" fontWeight="700" fill={color} fontFamily="system-ui">
              {flow.name}
            </text>
            <text x={px+7} y={py+26} fontSize="7" fill="#555" fontFamily="system-ui">{l1}</text>
            {l2 && <text x={px+7} y={py+36} fontSize="7" fill="#555" fontFamily="system-ui">{l2}</text>}
            {l3 && <text x={px+7} y={py+46} fontSize="7" fill="#555" fontFamily="system-ui">{l3}</text>}
            <text x={px+7} y={py+80} fontSize="6.5" fill="#aaa" fontFamily="system-ui">
              Cliquer ailleurs pour fermer
            </text>
          </g>
        );
      })()}

      {/* Compass */}
      <g transform="translate(798,38)" fontFamily="system-ui" onClick={e => e.stopPropagation()}>
        <circle cx="0" cy="0" r="15" fill="#fff" opacity="0.82"/>
        <line x1="-9" y1="4.5"  x2="9" y2="-4.5" stroke="#bbb" strokeWidth="0.8"/>
        <line x1="-9" y1="-4.5" x2="9" y2="4.5"  stroke="#bbb" strokeWidth="0.8"/>
        <polygon points="9,-4.5 5,-1.5 6.5,-4"
          fill={compassLabels.NE === compassLabels.front ? '#c44' : '#aaa'}/>
        <text x="11" y="-4"  textAnchor="start" fontSize="6" style={labelStyle(compassLabels.NE)} onClick={() => handleCompassClick(compassLabels.NE)}>{compassLabels.NE}</text>
        <text x="11" y="7"   textAnchor="start" fontSize="6" style={labelStyle(compassLabels.SE)} onClick={() => handleCompassClick(compassLabels.SE)}>{compassLabels.SE}</text>
        <text x="-11" y="-4" textAnchor="end"   fontSize="6" style={labelStyle(compassLabels.NW)} onClick={() => handleCompassClick(compassLabels.NW)}>{compassLabels.NW}</text>
        <text x="-11" y="7"  textAnchor="end"   fontSize="6" style={labelStyle(compassLabels.SW)} onClick={() => handleCompassClick(compassLabels.SW)}>{compassLabels.SW}</text>
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
