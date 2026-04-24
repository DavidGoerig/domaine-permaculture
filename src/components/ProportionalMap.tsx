import React from 'react';
import type { Zone, Plant, Animal, MushroomBed, ZoneType } from '../types/domain';

const COLORS: Record<ZoneType, { fill: string; stroke: string }> = {
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
  'légume-feuille':  '#3aaa5a',
  'légume-racine':   '#cc8f3a',
  'légume-fruit':    '#E8593C',
  'légumineuse':     '#639922',
  'aromatique':      '#7a5a9a',
  'fruit':           '#EF9F27',
  'vivace':          '#3B8BD4',
  'engrais-vert':    '#a0c840',
  'sauvage':         '#5a8a3a',
  'mellifère':       '#f0a800',
  'champignon':      '#8a6a6a',
};

const FLOW_COLORS: Record<string, string> = {
  water:     '#3B8BD4',
  fertility: '#639922',
  animals:   '#EF9F27',
  cuisine:   '#E8593C',
};

const FLOW_CONNECTIONS: { from: string; to: string; type: string }[] = [
  { from: 'stockage_eau', to: 'aquaponie',   type: 'water' },
  { from: 'stockage_eau', to: 'aromatiques', type: 'water' },
  { from: 'compost',      to: 'parcelle_a',  type: 'fertility' },
  { from: 'compost',      to: 'parcelle_b',  type: 'fertility' },
  { from: 'parcelle_b',   to: 'cuisine',     type: 'cuisine' },
  { from: 'aquaponie',    to: 'cuisine',     type: 'cuisine' },
  { from: 'paturage',     to: 'fromagerie',  type: 'animals' },
  { from: 'melliferes',   to: 'ruches',      type: 'animals' },
];

function getZoneCenter(layout: LayoutZone[], zoneId: string): { x: number; y: number } | null {
  const lz = layout.find(l => l.zone.id === zoneId);
  if (!lz) return null;
  return { x: lz.x + lz.w / 2, y: lz.y + lz.h / 2 };
}

const SVG_W = 760;
const SVG_H = 860;
const LABEL_H = 18;
const SEP_H = 12;
const LEGEND_H = 28;

function sqrtM2(zone: Zone): number {
  return Math.sqrt(zone.surfaceM2 ?? 0);
}

interface LayoutZone { zone: Zone; x: number; y: number; w: number; h: number; }

function computeLayout(zones: Zone[]): { layout: LayoutZone[]; groupY: Record<number, number>; groupH: Record<number, number> } {
  const z0 = zones.filter(z => z.zoneNumber === 0 && (z.surfaceM2 ?? 0) > 0);
  const z1 = zones.filter(z => z.zoneNumber === 1 && (z.surfaceM2 ?? 0) > 0);
  const z2 = zones.filter(z => z.zoneNumber === 2 && (z.surfaceM2 ?? 0) > 0);
  const z3 = zones.filter(z => z.zoneNumber === 3 && (z.surfaceM2 ?? 0) > 0);

  const hasZ0 = z0.length > 0;
  const H0 = hasZ0 ? 58 : 0;
  const s0 = z0.reduce((s, z) => s + sqrtM2(z), 0);
  const s1 = z1.reduce((s, z) => s + sqrtM2(z), 0);
  const s2 = z2.reduce((s, z) => s + sqrtM2(z), 0);
  const s3 = z3.reduce((s, z) => s + sqrtM2(z), 0);
  const sRest = s1 + s2 + s3;

  const nGroups = hasZ0 ? 4 : 3;
  const nSeps   = hasZ0 ? 3 : 2;
  const usable  = SVG_H - LABEL_H * nGroups - SEP_H * nSeps - LEGEND_H - 10 - H0;
  const h1 = (s1 / sRest) * usable;
  const h2 = (s2 / sRest) * usable;
  const h3 = (s3 / sRest) * usable;

  const y0 = LABEL_H;
  const y1 = hasZ0 ? y0 + H0 + SEP_H + LABEL_H : LABEL_H;
  const y2 = y1 + h1 + SEP_H + LABEL_H;
  const y3 = y2 + h2 + SEP_H + LABEL_H;

  const layout: LayoutZone[] = [];

  const addRow = (group: Zone[], y: number, h: number, total: number) => {
    if (!group.length || total === 0) return;
    let x = 0;
    for (const zone of group) {
      const w = (sqrtM2(zone) / total) * SVG_W;
      layout.push({ zone, x, y, w, h });
      x += w;
    }
  };

  if (hasZ0) addRow(z0, y0, H0, s0);
  addRow(z1, y1, h1, s1);
  addRow(z2, y2, h2, s2);
  addRow(z3, y3, h3, s3);

  return {
    layout,
    groupY: { 0: y0, 1: y1, 2: y2, 3: y3 },
    groupH: { 0: H0, 1: h1, 2: h2, 3: h3 },
  };
}

interface Props {
  zones: Zone[];
  plants: Plant[];
  animals: Animal[];
  mushroomBeds: MushroomBed[];
  selectedZoneId: string | null;
  selectedItemId: string | null;
  onSelect: (id: string | null) => void;
  onItemSelect: (id: string, type: 'plant' | 'animal' | 'mushroom' | 'beehive') => void;
}

const ZONE_LABELS: Record<number, string> = {
  0: 'ZONE 0 — Earthship · systèmes autonomes',
  1: 'ZONE 1 — Infrastructures intensives',
  2: 'ZONE 2 — Cœur maraîcher',
  3: 'ZONE 3 — Extensif · pâturage · biodiversité',
};

const ProportionalMap: React.FC<Props> = ({
  zones, plants, animals, mushroomBeds,
  selectedZoneId, selectedItemId,
  onSelect, onItemSelect,
}) => {
  const { layout, groupY, groupH } = computeLayout(zones);

  const renderZone = ({ zone, x, y, w, h }: LayoutZone) => {
    const colors = COLORS[zone.type] ?? { fill: '#ddd', stroke: '#999' };
    const selected = zone.id === selectedZoneId;
    const zonePlantList = plants.filter(p => p.zones.includes(zone.id));
    const zoneAnimalList = animals.filter(a => a.zoneId === zone.id);
    const zoneMushList = mushroomBeds.filter(b => b.zoneId === zone.id);

    const isNarrow = w < 24;
    const totalYield = Math.max(1, zonePlantList.reduce((s, p) => s + p.yieldKgPerM2, 0));

    const NAME_H = 14;
    const SURFACE_H = isNarrow ? 0 : 11;
    const BADGE_W = 14;
    const topH = NAME_H + SURFACE_H + 2;
    const stripY = y + topH;
    const stripH = Math.max(0, h - topH - 2);
    const stripW = w - (zoneAnimalList.length + zoneMushList.length > 0 ? BADGE_W + 2 : 0) - 4;

    let cx = x + 2;
    const plantRects: { x: number; w: number; plant: Plant }[] = [];
    for (const plant of zonePlantList) {
      const pw = Math.max(1, (plant.yieldKgPerM2 / totalYield) * stripW);
      plantRects.push({ x: cx, w: pw, plant });
      cx += pw;
    }

    const badgeX = x + w - BADGE_W;
    const animalY = y + 8;
    const mushY = zoneAnimalList.length > 0 ? y + 22 : y + 8;

    return (
      <g key={zone.id} onClick={e => { e.stopPropagation(); onSelect(zone.id); }} style={{ cursor: 'pointer' }}>
        <rect
          x={x} y={y} width={w} height={h} rx={3}
          fill={colors.fill}
          stroke={selected ? '#333' : colors.stroke}
          strokeWidth={selected ? 2 : 0.8}
        />

        {/* Zone name */}
        {isNarrow ? (
          <text
            x={x + w / 2} y={y + 4}
            fontSize="6.5" fontFamily="system-ui" fill="#444" fontWeight="500"
            pointerEvents="none"
            transform={`rotate(90,${x + w / 2},${y + h / 2})`}
          >
            {zone.name.slice(0, Math.floor(h / 5))}
          </text>
        ) : (
          <text x={x + 3} y={y + 10} fontSize="8" fontFamily="system-ui" fill="#333" fontWeight="600" pointerEvents="none">
            {zone.name.slice(0, Math.floor(w / 4.8))}
            {zone.name.length > Math.floor(w / 4.8) ? '…' : ''}
          </text>
        )}

        {/* Surface m² */}
        {!isNarrow && zone.surfaceM2 && (
          <text x={x + 3} y={y + 20} fontSize="7" fontFamily="system-ui" fill="#888" pointerEvents="none">
            {zone.surfaceM2.toLocaleString('fr')} m²
          </text>
        )}

        {/* Plant yield strips */}
        {stripH >= 4 && zonePlantList.length > 0 && (
          <>
            {plantRects.map(({ x: rx, w: rw, plant }) => {
              const isSelectedItem = plant.id === selectedItemId;
              return (
                <g
                  key={plant.id}
                  onClick={e => { e.stopPropagation(); onItemSelect(plant.id, 'plant'); }}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={rx} y={stripY} width={rw} height={stripH} rx={1}
                    fill={CATEGORY_COLORS[plant.category] ?? '#888'}
                    opacity={isSelectedItem ? 1 : 0.78}
                    stroke={isSelectedItem ? '#222' : 'none'}
                    strokeWidth={isSelectedItem ? 1 : 0}
                  />
                  {rw > 22 && stripH > 8 && (
                    <text
                      x={rx + 2} y={stripY + stripH / 2 + 3}
                      fontSize="6" fontFamily="system-ui" fill="#fff" fontWeight="500"
                      pointerEvents="none"
                      style={{ userSelect: 'none' }}
                    >
                      {plant.name.slice(0, Math.floor(rw / 3.5))}
                    </text>
                  )}
                  <title>{plant.name} — {plant.yieldKgPerM2} kg/m²{plant.variety ? ` (${plant.variety})` : ''}</title>
                </g>
              );
            })}
          </>
        )}

        {/* Animal badge */}
        {zoneAnimalList.length > 0 && w > 20 && (
          <g onClick={e => { e.stopPropagation(); onItemSelect(zoneAnimalList[0].id, 'animal'); }} style={{ cursor: 'pointer' }}>
            <circle cx={badgeX + 7} cy={animalY} r="6" fill="#EF9F27" opacity="0.9" />
            <text x={badgeX + 7} y={animalY + 2.5} textAnchor="middle" fontSize="5" fill="#fff" fontWeight="700" pointerEvents="none">A</text>
            <title>{zoneAnimalList.map(a => a.name).join(', ')}</title>
          </g>
        )}

        {/* Mushroom badge */}
        {zoneMushList.length > 0 && w > 20 && (
          <g onClick={e => { e.stopPropagation(); onItemSelect(zoneMushList[0].id, 'mushroom'); }} style={{ cursor: 'pointer' }}>
            <circle cx={badgeX + 7} cy={mushY} r="6" fill="#7a5a9a" opacity="0.9" />
            <text x={badgeX + 7} y={mushY + 2.5} textAnchor="middle" fontSize="5" fill="#fff" fontWeight="700" pointerEvents="none">M</text>
            <title>{zoneMushList.map(b => b.name).join(', ')}</title>
          </g>
        )}

        {/* Selection ring */}
        {selected && (
          <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} rx={4}
            fill="none" stroke="#333" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.5" pointerEvents="none"/>
        )}
      </g>
    );
  };

  const legendY = SVG_H - LEGEND_H + 4;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ display: 'block', width: '100%', minWidth: '520px' }}
      onClick={e => { if ((e.target as SVGElement).tagName === 'svg') onSelect(null); }}
    >
      <defs>
      {Object.entries(FLOW_COLORS).map(([type, color]) => (
        <marker key={type} id={`arrow-${type}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M 0 0 L 8 3 L 0 6 Z" fill={color} opacity="0.75"/>
        </marker>
      ))}
    </defs>

    {/* Group labels */}
      {([0, 1, 2, 3] as const).map(g =>
        groupH[g] > 0 ? (
          <text key={g} x="4" y={groupY[g] - 3} fontSize="8" fontFamily="system-ui" fill="#999" fontWeight="500">
            {ZONE_LABELS[g]}
          </text>
        ) : null
      )}

      {/* Separators */}
      {groupH[0] > 0 && (
        <>
          <rect x={0} y={groupY[0] + groupH[0]} width={SVG_W} height={SEP_H} fill="#a08060" opacity="0.15" rx="2"/>
          <text x={SVG_W / 2} y={groupY[0] + groupH[0] + 8.5} textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#a08060">
            Zone 0 → Zone 1
          </text>
        </>
      )}
      <rect x={0} y={groupY[1] + groupH[1]} width={SVG_W} height={SEP_H} fill="#3d6b2c" opacity="0.2" rx="2"/>
      <text x={SVG_W / 2} y={groupY[1] + groupH[1] + 8.5} textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#3d6b2c">
        Haie fruitière Z1→Z2
      </text>
      <rect x={0} y={groupY[2] + groupH[2]} width={SVG_W} height={SEP_H} fill="#3d6b2c" opacity="0.2" rx="2"/>
      <text x={SVG_W / 2} y={groupY[2] + groupH[2] + 8.5} textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#3d6b2c">
        Haie fruitière Z2→Z3
      </text>

      {/* Zones */}
      {layout.map(lz => renderZone(lz))}

      {/* Flux arrows */}
      {FLOW_CONNECTIONS.map(({ from, to, type }, i) => {
        const src = getZoneCenter(layout, from);
        const dst = getZoneCenter(layout, to);
        if (!src || !dst) return null;
        const color = FLOW_COLORS[type] ?? '#999';
        const mx = (src.x + dst.x) / 2 + (dst.y - src.y) * 0.25;
        const my = (src.y + dst.y) / 2 - (dst.x - src.x) * 0.25;
        return (
          <path
            key={i}
            d={`M ${src.x.toFixed(1)} ${src.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${dst.x.toFixed(1)} ${dst.y.toFixed(1)}`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            opacity="0.5"
            markerEnd={`url(#arrow-${type})`}
            pointerEvents="none"
          />
        );
      })}

      {/* Legend */}
      <rect x={0} y={legendY} width={SVG_W} height={LEGEND_H} fill="#fff" opacity="0.9"/>
      <text x="4" y={legendY + 9} fontSize="7" fontFamily="system-ui" fill="#999" fontWeight="600">
        Largeur zone ∝ √m² · Strips internes ∝ rendement kg/m²
      </text>
      {Object.entries(CATEGORY_COLORS).slice(0, 9).map(([cat, color], i) => {
        const labels: Record<string, string> = {
          'légume-feuille': 'Feuille', 'légume-racine': 'Racine', 'légume-fruit': 'Fruit',
          'légumineuse': 'Légum.', 'aromatique': 'Arom.', 'fruit': 'Fruit arbre',
          'vivace': 'Vivace', 'engrais-vert': 'Eng. vert', 'sauvage': 'Sauvage',
        };
        const xOff = 4 + i * 82;
        return (
          <g key={cat}>
            <rect x={xOff} y={legendY + 13} width="8" height="8" rx="1.5" fill={color} opacity="0.85"/>
            <text x={xOff + 10} y={legendY + 20} fontSize="7" fontFamily="system-ui" fill="#666">{labels[cat] ?? cat}</text>
          </g>
        );
      })}
    </svg>
  );
};

export default ProportionalMap;
