import React, { useState } from 'react';
import type { Zone, Flow, FlowFilters, ZoneType, Plant, Animal, MushroomBed, BeeHive } from '../types/domain';

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

const FLOW_COLORS: Record<string, string> = {
  water:          '#3B8BD4',
  fertility:      '#639922',
  cuisine:        '#E8593C',
  animals:        '#EF9F27',
  transformation: '#7a5a9a',
};

const FLOW_IDS: Record<string, string[]> = {
  water:          ['fw1', 'fw2', 'fw3'],
  fertility:      ['ff1', 'ff2', 'ff3', 'ff4'],
  cuisine:        ['fh1', 'fh2', 'fh3', 'fh4'],
  animals:        ['fa1', 'fa2', 'fa3', 'fa4'],
  transformation: ['ft1'],
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

const CATEGORY_LABELS: Record<string, string> = {
  'légume-feuille': 'Feuille',
  'légume-racine':  'Racine',
  'légume-fruit':   'Fruit légume',
  'légumineuse':    'Légum.',
  'aromatique':     'Arom.',
  'fruit':          'Fruit',
  'vivace':         'Vivace',
  'engrais-vert':   'Engrais vert',
  'sauvage':        'Sauvage',
  'mellifère':      'Mellifère',
  'champignon':     'Champignon',
};

const BAC_COLORS = ['#c8a068', '#6895b8', '#7ab878', '#6ab8a0', '#8868b8', '#b86898'];
const BAC_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const BAC_SUBS   = ['Médit.', 'Fraîches', 'Basilics', 'Menthes', 'Gastro.', 'Épices'];

function isHedge(zone: Zone): boolean {
  return zone.id.startsWith('haie');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? line + ' ' + word : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

interface Props {
  zones: Zone[];
  flows: Flow[];
  selectedZoneId: string | null;
  selectedItemId?: string | null;
  filters: FlowFilters;
  onSelect: (id: string | null) => void;
  onItemSelect?: (id: string, type: 'plant' | 'animal' | 'mushroom' | 'beehive') => void;
  viewMode?: 'zones' | 'content';
  plants?: Plant[];
  animals?: Animal[];
  mushroomBeds?: MushroomBed[];
  beehives?: BeeHive[];
}

const SECTION_LABELS = [
  { y: 210, text: 'ZONE 2 — Cœur maraîcher + poulailler central' },
  { y: 502, text: 'ZONE 3 — Extensif · vaches · noyers · biodiversité' },
];

function getPathMidpoint(path: string): { x: number; y: number } {
  const nums = (path.match(/-?\d+\.?\d*/g) ?? []).map(Number);
  if (nums.length < 4) return { x: nums[0] ?? 0, y: nums[1] ?? 0 };
  return { x: (nums[0] + nums[2]) / 2, y: (nums[1] + nums[3]) / 2 };
}

const FarmMap: React.FC<Props> = ({
  zones, flows, selectedZoneId, selectedItemId, filters, onSelect, onItemSelect,
  viewMode = 'zones', plants = [], animals = [], mushroomBeds = [], beehives = [],
}) => {
  const zoneById = new Map(zones.map(z => [z.id, z]));
  const [hoveredFlowId, setHoveredFlowId] = useState<string | null>(null);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);

  const isFlowVisible = (flow: Flow): boolean => {
    if (flow.type === 'water') return filters.water;
    if (flow.type === 'fertility') return filters.fertility;
    if (flow.type === 'cuisine') return filters.cuisine;
    if (flow.type === 'animals') return filters.animals;
    if (flow.type === 'transformation') return filters.transformation;
    return true;
  };

  const flowsByType = Object.entries(FLOW_IDS);

  /* ── Special zone renderers ─────────────────────────────────────────── */

  const renderEarthship = (zone: Zone) => {
    const selected = zone.id === selectedZoneId;
    const { x, y, width, height } = zone;
    const colors = COLORS[zone.type];
    const W = width - 2;
    const top = y + 12;
    type Room = { rx: number; ry: number; rw: number; rh: number; color: string; label: string; sub: string };
    const rooms: Room[] = [
      { rx: x+1, ry: top,     rw: 67,   rh: 30, color: '#f5ebd4', label: 'Salon',                              sub: 'inertie thermique massive' },
      { rx: x+68, ry: top,    rw: W-67, rh: 30, color: '#d4eaf5', label: 'SDB',                                sub: 'chauffe-eau solaire' },
      { rx: x+1, ry: top+30,  rw: 60,   rh: 26, color: '#f5d8d0', label: 'Chambre 1',                         sub: '' },
      { rx: x+61, ry: top+30, rw: W-60, rh: 26, color: '#f5d8d0', label: 'Chambre 2',                         sub: '' },
      { rx: x+1, ry: top+56,  rw: 70,   rh: 22, color: '#f5e8c0', label: 'Cuisine',                           sub: "table d'hôtes" },
      { rx: x+71, ry: top+56, rw: W-70, rh: 22, color: '#d8f5d8', label: 'WC sèches',                         sub: '→ compost' },
      { rx: x+1, ry: top+78,  rw: W,    rh: 13, color: '#d8d8e8', label: 'Garde-manger · cave enterrée T° 10°C', sub: '' },
      { rx: x+1, ry: top+91,  rw: W,    rh: 24, color: '#7bc47a', label: 'Serre tropicale — figuier · kumquat · bananier', sub: 'max bois · plein sud' },
      { rx: x+1, ry: top+115, rw: W,    rh: 18, color: '#8aa8c0', label: 'Puits canadien 40m · 8×400Wc · 10kWh LiFePO₄', sub: '' },
    ];
    return (
      <g key={zone.id} onClick={e => { e.stopPropagation(); onSelect(zone.id); }} style={{ cursor: 'pointer' }}>
        <rect x={x} y={y} width={width} height={height} rx={5}
          fill={colors.fill} stroke={selected ? '#333' : colors.stroke} strokeWidth={selected ? 2.5 : 1}/>
        <text x={x+3} y={y+9} fontSize="6.5" fontFamily="system-ui" fill="#555" fontWeight="700" pointerEvents="none">
          Zone 0 — Earthship
        </text>
        {rooms.map((r, i) => (
          <g key={i} pointerEvents="none">
            <rect x={r.rx} y={r.ry} width={r.rw} height={r.rh} rx={1.5}
              fill={r.color} stroke="#c0b0a0" strokeWidth="0.5" opacity="0.92"/>
            <text x={r.rx+2} y={r.ry+7} fontSize="5.5" fontFamily="system-ui" fill="#333" fontWeight="600">
              {r.label.slice(0, Math.floor(r.rw / 3.6))}
            </text>
            {r.sub && r.rh >= 18 && (
              <text x={r.rx+2} y={r.ry+13} fontSize="5" fontFamily="system-ui" fill="#555">
                {r.sub.slice(0, Math.floor(r.rw / 3.4))}
              </text>
            )}
          </g>
        ))}
      </g>
    );
  };

  const renderAromatiques = (zone: Zone) => {
    const selected = zone.id === selectedZoneId;
    const { x, y, width, height } = zone;
    const colors = COLORS[zone.type];
    const bacW = (width - 2) / 6;
    const bacY = y + 13;
    const bacH = height - 14;

    const BAC_PLANT_IDS: string[][] = [
      ['thym', 'romarin'],
      ['persil_plat', 'ciboulette'],
      ['basilic_genovese'],
      ['menthe_verte'],
      ['lavande', 'bourrache'],
      [],
    ];

    return (
      <g key={zone.id} onClick={e => { e.stopPropagation(); onSelect(zone.id); }} style={{ cursor: 'pointer' }}>
        <rect x={x} y={y} width={width} height={height} rx={5}
          fill={colors.fill} stroke={selected ? '#333' : colors.stroke} strokeWidth={selected ? 2.5 : 1}/>
        <text x={x+3} y={y+9} fontSize="6.5" fontFamily="system-ui" fill="#444" fontWeight="500" pointerEvents="none">
          Aromatiques — 6 bacs
        </text>
        {BAC_LABELS.map((label, i) => {
          const bx = x + 1 + i * bacW;
          const bw = bacW - 0.5;
          const bacPlants = BAC_PLANT_IDS[i].map(id => plants.find(p => p.id === id)).filter(Boolean) as Plant[];
          const totalYield = Math.max(1, bacPlants.reduce((s, p) => s + p.yieldKgPerM2, 0));
          const stripTop = bacY + 12;
          const availH = bacH - 12;
          let py = stripTop;
          return (
            <g key={i}>
              <rect x={bx} y={bacY} width={bw} height={bacH} rx={2}
                fill={BAC_COLORS[i]} opacity="0.50" stroke="#fff" strokeWidth="0.5"/>
              <text x={bx + bw / 2} y={bacY + 9} textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#fff" fontWeight="700" pointerEvents="none">
                {label}
              </text>
              {bacPlants.length === 0 && bacH >= 26 && (
                <text x={bx + bw / 2} y={bacY + 18} textAnchor="middle" fontSize="5" fontFamily="system-ui" fill="#fff" opacity="0.9" pointerEvents="none">
                  {BAC_SUBS[i]}
                </text>
              )}
              {bacPlants.map(p => {
                const ph = Math.max(1, (p.yieldKgPerM2 / totalYield) * availH);
                const isSelected = p.id === selectedItemId;
                const ry = py;
                py += ph;
                return (
                  <g key={p.id} onClick={e => { e.stopPropagation(); onItemSelect?.(p.id, 'plant'); }} style={{ cursor: 'pointer' }}>
                    <rect x={bx} y={ry} width={bw} height={ph} rx={1}
                      fill={CATEGORY_COLORS[p.category] ?? '#888'}
                      opacity={isSelected ? 1 : 0.85}
                      stroke={isSelected ? '#fff' : 'none'}
                      strokeWidth={isSelected ? 0.5 : 0}
                    />
                    {bw >= 6 && ph >= 14 && (
                      <text
                        x={bx + bw / 2} y={ry + ph / 2}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize="5" fontFamily="system-ui" fill="#fff" fontWeight="500"
                        pointerEvents="none" style={{ userSelect: 'none' }}
                        transform={`rotate(-90, ${bx + bw / 2}, ${ry + ph / 2})`}
                      >
                        {p.name.slice(0, Math.floor(ph / 3.5))}
                      </text>
                    )}
                    <title>{p.name} — {p.yieldKgPerM2} kg/m²</title>
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  };

  const renderAquaponie = (zone: Zone) => {
    const selected = zone.id === selectedZoneId;
    const { x, y, width, height } = zone;
    const colors = COLORS[zone.type];
    const bW = (width - 2) / 4;
    const bY = y + 13;
    const bH = height - 14;
    const bassinColors = ['#1a5276', '#2e86c1', '#5dade2', '#7fb3d3'];
    const truiteAnimal = animals.find(a => a.id === 'truites');
    const aquaPlants = plants.filter(p => p.zones.includes('aquaponie'));
    const totalYield = Math.max(1, aquaPlants.reduce((s, p) => s + p.yieldKgPerM2, 0));

    return (
      <g key={zone.id} onClick={e => { e.stopPropagation(); onSelect(zone.id); }} style={{ cursor: 'pointer' }}>
        <rect x={x} y={y} width={width} height={height} rx={5}
          fill={colors.fill} stroke={selected ? '#333' : colors.stroke} strokeWidth={selected ? 2.5 : 1}/>
        <text x={x+3} y={y+9} fontSize="6.5" fontFamily="system-ui" fill="#444" fontWeight="500" pointerEvents="none">
          Aquaponie — 4 bassins
        </text>

        {/* B1 — Truites (clickable animal) */}
        {(() => {
          const bx = x + 1;
          const bw = bW - 0.5;
          return (
            <g onClick={e => { e.stopPropagation(); truiteAnimal && onItemSelect?.(truiteAnimal.id, 'animal'); }} style={{ cursor: 'pointer' }}>
              <rect x={bx} y={bY} width={bw} height={bH} rx={2}
                fill={bassinColors[0]} opacity="0.88" stroke="#8ecae6" strokeWidth="0.5"/>
              <text x={bx + bw / 2} y={bY + 9} textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#fff" fontWeight="700" pointerEvents="none">
                B1
              </text>
              {bH >= 22 && (
                <text x={bx + bw / 2} y={bY + 18} textAnchor="middle" fontSize="5" fontFamily="system-ui" fill="#fff" opacity="0.85" pointerEvents="none">
                  Truites fario
                </text>
              )}
            </g>
          );
        })()}

        {/* B2 — Filtre biologique (info) */}
        {(() => {
          const bx = x + 1 + bW;
          const bw = bW - 0.5;
          return (
            <g>
              <rect x={bx} y={bY} width={bw} height={bH} rx={2}
                fill={bassinColors[1]} opacity="0.75" stroke="#8ecae6" strokeWidth="0.5"/>
              <text x={bx + bw / 2} y={bY + 9} textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#fff" fontWeight="700" pointerEvents="none">
                B2
              </text>
              {bH >= 22 && (
                <text x={bx + bw / 2} y={bY + 18} textAnchor="middle" fontSize="5" fontFamily="system-ui" fill="#fff" opacity="0.85" pointerEvents="none">
                  filtre bio
                </text>
              )}
            </g>
          );
        })()}

        {/* B3 + B4 — Plant strips */}
        {[2, 3].map(bi => {
          const bx = x + 1 + bi * bW;
          const bw = bW - 0.5;
          const stripTop = bY + 12;
          const availH = bH - 12;
          let py = stripTop;
          return (
            <g key={bi}>
              <rect x={bx} y={bY} width={bw} height={bH} rx={2}
                fill={bassinColors[bi]} opacity="0.55" stroke="#8ecae6" strokeWidth="0.5"/>
              <text x={bx + bw / 2} y={bY + 9} textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#fff" fontWeight="700" pointerEvents="none">
                B{bi + 1}
              </text>
              {aquaPlants.map(p => {
                const ph = Math.max(1, (p.yieldKgPerM2 / totalYield) * availH);
                const isSelected = p.id === selectedItemId;
                const ry = py;
                py += ph;
                return (
                  <g key={p.id} onClick={e => { e.stopPropagation(); onItemSelect?.(p.id, 'plant'); }} style={{ cursor: 'pointer' }}>
                    <rect x={bx} y={ry} width={bw} height={ph} rx={1}
                      fill={CATEGORY_COLORS[p.category] ?? '#888'}
                      opacity={isSelected ? 1 : 0.85}
                      stroke={isSelected ? '#fff' : 'none'}
                      strokeWidth={isSelected ? 0.5 : 0}
                    />
                    {bw >= 6 && ph >= 4 && (
                      <text
                        x={bx + bw / 2} y={ry + ph / 2}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize="4.5" fontFamily="system-ui" fill="#fff" fontWeight="600"
                        pointerEvents="none" style={{ userSelect: 'none' }}
                      >
                        {p.name.slice(0, Math.floor(bw / 2.8))}
                      </text>
                    )}
                    <title>{p.name} — {p.yieldKgPerM2} kg/m²</title>
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  };

  const renderRuches = (zone: Zone) => {
    const selected = zone.id === selectedZoneId;
    const { x, y, width, height } = zone;
    const colors = COLORS[zone.type];
    const n = beehives.length || 1;
    const hiveW = (width - 2) / n;
    const startY = y + 13;
    const hiveH = height - 14;
    const COVER_H = 8;
    const BODY_H = hiveH - COVER_H - 3;
    const hiveBodyColors = ['#f5c842', '#f5d878'];

    return (
      <g key={zone.id} onClick={e => { e.stopPropagation(); onSelect(zone.id); }} style={{ cursor: 'pointer' }}>
        <rect x={x} y={y} width={width} height={height} rx={5}
          fill={colors.fill} stroke={selected ? '#333' : colors.stroke} strokeWidth={selected ? 2.5 : 1}/>
        <text x={x + 3} y={y + 9} fontSize="6.5" fontFamily="system-ui" fill="#444" fontWeight="500" pointerEvents="none">
          Ruches Warré
        </text>
        {beehives.map((hive, i) => {
          const hx = x + 1 + i * hiveW;
          const hw = hiveW - 1;
          const isSelectedItem = hive.id === selectedItemId;
          return (
            <g key={hive.id} onClick={e => { e.stopPropagation(); onItemSelect?.(hive.id, 'beehive'); }} style={{ cursor: 'pointer' }}>
              {/* Toit */}
              <rect x={hx} y={startY} width={hw} height={COVER_H} rx={2}
                fill="#7a5010" opacity="0.88"
                stroke={isSelectedItem ? '#333' : '#5a3800'} strokeWidth={isSelectedItem ? 1.5 : 0.5}/>
              {/* Corps */}
              <rect x={hx} y={startY + COVER_H} width={hw} height={BODY_H} rx={0}
                fill={hiveBodyColors[i % 2]}
                opacity={isSelectedItem ? 1 : 0.88}
                stroke={isSelectedItem ? '#333' : '#cc9a00'} strokeWidth={isSelectedItem ? 1.5 : 0.5}/>
              {/* Séparations hausse */}
              {[0.35, 0.65].map((f, si) => (
                <line key={si}
                  x1={hx} y1={startY + COVER_H + BODY_H * f}
                  x2={hx + hw} y2={startY + COVER_H + BODY_H * f}
                  stroke="#cc9a00" strokeWidth="0.6" opacity="0.5" pointerEvents="none"/>
              ))}
              {/* Entrée */}
              <rect x={hx + hw * 0.2} y={startY + COVER_H + BODY_H} width={hw * 0.6} height={3} rx={0}
                fill="#3a1a00" opacity="0.7" pointerEvents="none"/>
              {/* Nom */}
              <text x={hx + hw / 2} y={startY + COVER_H + 9} textAnchor="middle" fontSize="5.5" fontFamily="system-ui" fill="#333" fontWeight="700" pointerEvents="none">
                {`Warré ${i + 1}`}
              </text>
              {BODY_H >= 25 && (
                <text x={hx + hw / 2} y={startY + COVER_H + 19} textAnchor="middle" fontSize="4.5" fontFamily="system-ui" fill="#555" pointerEvents="none">
                  {`~${hive.yearlyHoneyKg}kg`}
                </text>
              )}
              <title>{hive.name} — {hive.yearlyHoneyKg} kg miel · {hive.yearlyWaxG} g cire/an</title>
            </g>
          );
        })}
      </g>
    );
  };

  const renderSaladesHiver = (zone: Zone) => {
    const selected = zone.id === selectedZoneId;
    const { x, y, width, height } = zone;
    const colors = COLORS[zone.type];
    const zonePlants = plants.filter(p => p.zones.includes('salades_hiver'));
    const totalYield = Math.max(1, zonePlants.reduce((s, p) => s + p.yieldKgPerM2, 0));
    const stripTop = y + 13;
    const availH = height - 14;
    let py = stripTop;
    return (
      <g key={zone.id} onClick={e => { e.stopPropagation(); onSelect(zone.id); }} style={{ cursor: 'pointer' }}>
        <rect x={x} y={y} width={width} height={height} rx={5}
          fill={colors.fill} stroke={selected ? '#333' : colors.stroke} strokeWidth={selected ? 2.5 : 1}/>
        <text x={x+3} y={y+9} fontSize="6.5" fontFamily="system-ui" fill="#444" fontWeight="500" pointerEvents="none">
          Salades hiver
        </text>
        {zonePlants.map(p => {
          const ph = Math.max(1, (p.yieldKgPerM2 / totalYield) * availH);
          const isSelected = p.id === selectedItemId;
          const ry = py;
          py += ph;
          return (
            <g key={p.id} onClick={e => { e.stopPropagation(); onItemSelect?.(p.id, 'plant'); }} style={{ cursor: 'pointer' }}>
              <rect x={x + 1} y={ry} width={width - 2} height={ph} rx={1}
                fill={CATEGORY_COLORS[p.category] ?? '#888'}
                opacity={isSelected ? 1 : 0.78}
                stroke={isSelected ? '#111' : 'none'}
                strokeWidth={isSelected ? 0.5 : 0}
              />
              {ph >= 4 && (
                <text
                  x={x + width / 2} y={ry + ph / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="4.5" fontFamily="system-ui" fill="#fff" fontWeight="600"
                  pointerEvents="none" style={{ userSelect: 'none' }}
                >
                  {p.name.slice(0, Math.floor((width - 4) / 2.8))}
                </text>
              )}
              <title>{p.name} — {p.yieldKgPerM2} kg/m²</title>
            </g>
          );
        })}
      </g>
    );
  };

  /* ── Generic content renderer ────────────────────────────────────────── */

  const renderZoneContent = (zone: Zone) => {
    if (zone.id === 'earthship')    return renderEarthship(zone);
    if (zone.id === 'aromatiques')  return renderAromatiques(zone);
    if (zone.id === 'aquaponie')    return renderAquaponie(zone);
    if (zone.id === 'salades_hiver') return renderSaladesHiver(zone);
    if (zone.id === 'ruches')        return renderRuches(zone);

    const colors = COLORS[zone.type] ?? { fill: '#ddd', stroke: '#999' };
    const selected = zone.id === selectedZoneId;
    const zonePlantList = plants.filter(p => p.zones.includes(zone.id));
    const zoneAnimalList = animals.filter(a => a.zoneId === zone.id);
    const zoneMushList = mushroomBeds.filter(b => b.zoneId === zone.id);

    const BADGE_W = (zoneAnimalList.length > 0 || zoneMushList.length > 0) ? 14 : 0;
    const nameMaxChars = Math.floor((zone.width - BADGE_W) / 4.5);
    const displayName = zone.name.length > nameMaxChars
      ? zone.name.substring(0, nameMaxChars - 1) + '…'
      : zone.name;

    const totalYield = Math.max(1, zonePlantList.reduce((s, p) => s + p.yieldKgPerM2, 0));
    const STRIP_TOP = zone.y + 24;
    const STRIP_H = Math.max(0, zone.height - 26);
    const STRIP_W = zone.width - BADGE_W - 6;

    let cx = zone.x + 3;
    const plantRects: { x: number; w: number; plant: Plant }[] = [];
    for (const p of zonePlantList) {
      const pw = Math.max(1, (p.yieldKgPerM2 / totalYield) * STRIP_W);
      plantRects.push({ x: cx, w: pw, plant: p });
      cx += pw;
    }

    const badgeX = zone.x + zone.width - 12;
    const animalOffY = zone.y + 10;
    const mushOffY = zoneAnimalList.length > 0 ? zone.y + 23 : zone.y + 10;

    return (
      <g key={zone.id} onClick={e => { e.stopPropagation(); onSelect(zone.id); }} style={{ cursor: 'pointer' }}>
        <rect
          x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx={5}
          fill={colors.fill} stroke={selected ? '#333' : colors.stroke} strokeWidth={selected ? 2.5 : 1}
        />
        <text x={zone.x + 4} y={zone.y + 9} fontSize="7" fontFamily="system-ui" fill="#444" fontWeight="500" pointerEvents="none">
          {displayName}
        </text>
        {zone.surfaceM2 && zone.height >= 32 && (
          <text x={zone.x + 4} y={zone.y + 19} fontSize="6.5" fontFamily="system-ui" fill="#888" pointerEvents="none">
            {zone.surfaceM2.toLocaleString('fr')} m²
          </text>
        )}

        {/* Plant yield strips */}
        {STRIP_H >= 5 && zonePlantList.length > 0 && plantRects.map(({ x: rx, w: rw, plant }) => {
          const isSelected = plant.id === selectedItemId;
          return (
            <g key={plant.id} onClick={e => { e.stopPropagation(); onItemSelect?.(plant.id, 'plant'); }} style={{ cursor: 'pointer' }}>
              <rect
                x={rx} y={STRIP_TOP} width={rw} height={STRIP_H} rx={1}
                fill={CATEGORY_COLORS[plant.category] ?? '#888'}
                opacity={isSelected ? 1 : 0.78}
                stroke={isSelected ? '#111' : 'none'}
                strokeWidth={isSelected ? 1 : 0}
              />
              {rw > 38 && STRIP_H > 8 && (
                <text
                  x={rx + 2} y={STRIP_TOP + STRIP_H / 2 + 3}
                  fontSize="6" fontFamily="system-ui" fill="#fff" fontWeight="500"
                  pointerEvents="none" style={{ userSelect: 'none' }}
                >
                  {plant.name.slice(0, Math.floor(rw / 5))}
                </text>
              )}
              {rw >= 8 && rw <= 38 && STRIP_H >= 30 && (
                <text
                  x={rx + rw / 2} y={STRIP_TOP + STRIP_H / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="6" fontFamily="system-ui" fill="#fff" fontWeight="500"
                  pointerEvents="none" style={{ userSelect: 'none' }}
                  transform={`rotate(-90, ${rx + rw / 2}, ${STRIP_TOP + STRIP_H / 2})`}
                >
                  {plant.name.slice(0, Math.floor(STRIP_H / 4.5))}
                </text>
              )}
              <title>{plant.name} — {plant.yieldKgPerM2} kg/m²</title>
            </g>
          );
        })}

        {/* Animal badge */}
        {zoneAnimalList.length > 0 && (
          <g onClick={e => { e.stopPropagation(); onItemSelect?.(zoneAnimalList[0].id, 'animal'); }} style={{ cursor: 'pointer' }}>
            <circle cx={badgeX} cy={animalOffY} r="5.5" fill="#EF9F27" opacity="0.9"/>
            <text x={badgeX} y={animalOffY + 2.5} textAnchor="middle" fontSize="5" fill="#fff" fontWeight="600" pointerEvents="none">A</text>
            <title>{zoneAnimalList.map(a => a.name).join(', ')}</title>
          </g>
        )}

        {/* Mushroom badge */}
        {zoneMushList.length > 0 && (
          <g onClick={e => { e.stopPropagation(); onItemSelect?.(zoneMushList[0].id, 'mushroom'); }} style={{ cursor: 'pointer' }}>
            <circle cx={badgeX} cy={mushOffY} r="5.5" fill="#7a5a9a" opacity="0.9"/>
            <text x={badgeX} y={mushOffY + 2.5} textAnchor="middle" fontSize="5" fill="#fff" fontWeight="600" pointerEvents="none">M</text>
            <title>{zoneMushList.map(b => b.name).join(', ')}</title>
          </g>
        )}
      </g>
    );
  };

  const renderZoneStandard = (zone: Zone) => {
    const colors = COLORS[zone.type] ?? { fill: '#ddd', stroke: '#999' };
    const selected = zone.id === selectedZoneId;

    const cx = zone.x + zone.width / 2;
    const cy = zone.y + zone.height / 2;
    const maxChars = Math.max(8, Math.floor(zone.width / 5.8));
    const lines = wrapText(zone.name, maxChars);
    const fontSize = zone.width < 90 ? 8 : 9.5;
    const lineH = fontSize + 3;
    const startY = cy - ((lines.length - 1) * lineH) / 2;

    return (
      <g key={zone.id} onClick={e => { e.stopPropagation(); onSelect(zone.id); }} style={{ cursor: 'pointer' }}>
        <rect
          x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx={5}
          fill={colors.fill} fillOpacity={selected ? 0.55 : 0.35}
          stroke={selected ? '#333' : colors.stroke}
          strokeWidth={selected ? 2.5 : 1.2}
        />
        {lines.map((line, i) => (
          <text
            key={i} x={cx} y={startY + i * lineH}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={fontSize} fontWeight="600" fontFamily="system-ui"
            fill="#111" stroke="#fff" strokeWidth="2.5" paintOrder="stroke"
            pointerEvents="none"
          >
            {line}
          </text>
        ))}
        {zone.outputs && zone.outputs[0] && zone.height >= 58 && (
          <text
            x={cx} y={startY + lines.length * lineH + 3}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={6.5} fontFamily="system-ui" fill={colors.stroke}
            stroke="#fff" strokeWidth="2" paintOrder="stroke"
            pointerEvents="none"
          >
            {zone.surfaceM2 ? `↗ ${zone.surfaceM2.toLocaleString('fr')} m²` : `↗ ${zone.outputs[0]}`}
          </text>
        )}
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 760 860"
      style={{ display: 'block', width: '100%', minWidth: '520px' }}
      onClick={e => { if ((e.target as SVGElement).tagName === 'svg') { onSelect(null); setSelectedFlowId(null); } }}
    >
      <defs>
        {flowsByType.map(([type]) => (
          <marker
            key={type}
            id={`arrow-${type}`}
            viewBox="0 0 10 10"
            refX="8" refY="5"
            markerWidth="5" markerHeight="5"
            orient="auto-start-reverse"
          >
            <path
              d="M2 1L8 5L2 9"
              fill="none"
              stroke={FLOW_COLORS[type]}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        ))}
      </defs>

      {/* Realistic background photo — zones view only */}
      {viewMode === 'zones' && (
        <image
          href="/zones-background.jpg"
          x="0" y="0" width="760" height="860"
          preserveAspectRatio="none"
        />
      )}

      {/* Zone 0 — Earthship header (content view) */}
      {viewMode === 'content' && (
        <>
          <rect x={0} y={0} width={128} height={172} fill="#d4c5a9" opacity="0.12" rx="0"/>
          <text x="10" y="12" fontSize="8" fontFamily="system-ui" fill="#a89070" fontWeight="700">
            ZONE 0 — Earthship
          </text>
          <line x1="128" y1="0" x2="128" y2="172" stroke="#a89070" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5"/>
          <text x="133" y="12" fontSize="8" fontFamily="system-ui" fill="#999" fontWeight="500">
            ZONE 1 — Systèmes intensifs
          </text>
        </>
      )}
      {viewMode === 'zones' && (
        <text x="10" y="12" fontSize="8.5" fontFamily="system-ui" fill="#999" fontWeight="500">
          ZONE 0 — Earthship  ·  ZONE 1 — Systèmes intensifs
        </text>
      )}

      {/* Section labels */}
      {SECTION_LABELS.map(({ y, text }) => (
        <text key={y} x="10" y={y} fontSize="8.5" fontFamily="system-ui" fill="#999" fontWeight="500">
          {text}
        </text>
      ))}

      {/* Champignons bordure verticale droite */}
      <g style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onSelect('champignons_haie'); }}>
        <rect x="628" y="178" width="86" height="18" rx="4" fill="#c8b8d8" opacity={selectedZoneId === 'champignons_haie' ? 0.9 : 0.7}
          stroke={selectedZoneId === 'champignons_haie' ? '#7a5a9a' : 'none'} strokeWidth="1.5"/>
        <text x="671" y="190" textAnchor="middle" fontSize="7.5" fontFamily="system-ui" fill="#7a5a9a" fontWeight="500">
          champignons — rondins
        </text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onSelect('champignons_haie'); }}>
        <rect x="626" y="218" width="88" height="270" rx="4" fill="#c8b8d8"
          opacity={selectedZoneId === 'champignons_haie' ? 0.65 : 0.45}
          stroke={selectedZoneId === 'champignons_haie' ? '#7a5a9a' : 'none'} strokeWidth="1.5"/>
        <text x="670" y="310" textAnchor="middle" fontSize="8.5" fontFamily="system-ui" fill="#7a5a9a" fontWeight="500"
          style={{ writingMode: 'vertical-rl', userSelect: 'none' }}>
          shiitake · pleurote
        </text>
        <text x="670" y="390" textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#7a5a9a">
          rondins percés
        </text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onSelect('champignons_haie'); }}>
        <rect x="626" y="490" width="88" height="175" rx="4" fill="#c8b8d8"
          opacity={selectedZoneId === 'champignons_haie' ? 0.55 : 0.38}
          stroke={selectedZoneId === 'champignons_haie' ? '#7a5a9a' : 'none'} strokeWidth="1.5"/>
        <text x="670" y="550" textAnchor="middle" fontSize="7.5" fontFamily="system-ui" fill="#7a5a9a" fontWeight="500">
          champignons
        </text>
        <text x="670" y="564" textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#7a5a9a">
          bordure terrain
        </text>
        <text x="670" y="578" textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#7a5a9a">
          palissades bois
        </text>
      </g>

      {/* Portes du poulailler */}
      {[
        { x: 238, y: 322 }, { x: 238, y: 356 },
        { x: 380, y: 322 }, { x: 380, y: 356 },
        { x: 298, y: 258 }, { x: 298, y: 400 },
      ].map((pos, i) => (
        <rect key={i} x={pos.x} y={pos.y} width={i >= 4 ? 34 : 12} height={i >= 4 ? 12 : 16}
          rx="2" fill="#EF9F27" opacity={i >= 4 ? 0.5 : 0.7} />
      ))}
      {[
        { x: 234, y: 264 }, { x: 234, y: 386 },
        { x: 380, y: 264 }, { x: 380, y: 386 },
      ].map((pos, i) => (
        <rect key={i} x={pos.x} y={pos.y} width="12" height="18" rx="2" fill="#EF9F27" opacity="0.5" />
      ))}

      {/* Flux */}
      {flows.map(flow => {
        const visible = isFlowVisible(flow);
        const isHovered = flow.id === hoveredFlowId;
        const isSelected = flow.id === selectedFlowId;
        const color = FLOW_COLORS[flow.type];
        return (
          <g key={flow.id}>
            <path
              d={flow.path}
              fill="none"
              stroke={color}
              strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
              strokeDasharray={isSelected ? 'none' : '5,3'}
              opacity={visible ? (isSelected || isHovered ? 1 : 0.8) : 0}
              style={{ transition: 'stroke-width 0.15s, opacity 0.3s', pointerEvents: 'none' }}
              markerEnd={`url(#arrow-${flow.type})`}
            />
            {visible && (
              <path
                d={flow.path}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredFlowId(flow.id)}
                onMouseLeave={() => setHoveredFlowId(null)}
                onClick={e => {
                  e.stopPropagation();
                  const next = flow.id === selectedFlowId ? null : flow.id;
                  setSelectedFlowId(next);
                  if (next && flow.fromZoneId) onSelect(flow.fromZoneId);
                  else if (!next) onSelect(null);
                }}
              />
            )}
          </g>
        );
      })}

      {/* Zones */}
      {zones.map(zone => {
        if (zone.id === 'champignons_haie') return null;
        const hedge = isHedge(zone);

        if (hedge) {
          const selected = zone.id === selectedZoneId;
          return (
            <g key={zone.id} onClick={e => { e.stopPropagation(); onSelect(zone.id); }} style={{ cursor: 'pointer' }}>
              <rect
                x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx="4"
                fill="#3d6b2c" opacity={selected ? 0.35 : 0.15}
                stroke={selected ? '#3d6b2c' : 'none'} strokeWidth="1.5"
              />
              <text
                x={zone.x + zone.width / 2} y={zone.y + 11}
                textAnchor="middle" fontSize="7.5" fontFamily="system-ui"
                fill="#3d6b2c" fontWeight="600"
                stroke="#fff" strokeWidth="2" paintOrder="stroke"
                pointerEvents="none"
              >
                {zone.name === 'Haie fruitière Z1 → Z2'
                  ? 'haie fruitière — mûres · framboises · cassis · groseilles · sureau · caseille'
                  : zone.name === 'Haie fruitière Z2 → Z3'
                    ? 'haie fruitière — prunellier · argousier · sureau · groseilles · caseille · haies défensives'
                    : 'haie défensive sud — prunellier · épine noire · ronces · argousier'}
              </text>
            </g>
          );
        }

        return viewMode === 'content' && zone.height >= 25
          ? renderZoneContent(zone)
          : renderZoneStandard(zone);
      })}

      {/* Zone selection highlight */}
      {selectedZoneId && zoneById.has(selectedZoneId) && (
        <rect
          x={(zoneById.get(selectedZoneId)!).x - 2}
          y={(zoneById.get(selectedZoneId)!).y - 2}
          width={(zoneById.get(selectedZoneId)!).width + 4}
          height={(zoneById.get(selectedZoneId)!).height + 4}
          rx={6}
          fill="none"
          stroke="#333"
          strokeWidth="1"
          strokeDasharray="4,2"
          opacity="0.4"
          pointerEvents="none"
        />
      )}

      {/* Tooltip flux sélectionné — rendu en dernier pour passer au-dessus des zones */}
      {selectedFlowId && (() => {
        const flow = flows.find(f => f.id === selectedFlowId);
        if (!flow?.name) return null;
        const mid = getPathMidpoint(flow.path);
        const TW = 240;
        const TH = 64;
        const tx = Math.min(Math.max(mid.x - TW / 2, 4), 760 - TW - 4);
        const ty = mid.y < 80 ? mid.y + 12 : mid.y - TH - 10;
        const color = FLOW_COLORS[flow.type];
        const desc = flow.description ?? '';
        const line1 = desc.slice(0, 44);
        const line2 = desc.length > 44 ? desc.slice(44, 88) : '';
        const line3 = desc.length > 88 ? desc.slice(88, 132) + (desc.length > 132 ? '…' : '') : '';
        return (
          <g pointerEvents="none">
            <rect x={tx} y={ty} width={TW} height={TH} rx={4}
              fill="#fff" stroke={color} strokeWidth={1.5} opacity={0.97}
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"/>
            <rect x={tx} y={ty} width={TW} height={13} rx={4} fill={color} opacity={0.15}/>
            <text x={tx + 7} y={ty + 9.5} fontSize="8.5" fontWeight="700" fill={color} fontFamily="system-ui">
              {flow.name}
            </text>
            <text x={tx + 7} y={ty + 22} fontSize="7" fill="#555" fontFamily="system-ui">{line1}</text>
            {line2 && <text x={tx + 7} y={ty + 32} fontSize="7" fill="#555" fontFamily="system-ui">{line2}</text>}
            {line3 && <text x={tx + 7} y={ty + 42} fontSize="7" fill="#555" fontFamily="system-ui">{line3}</text>}
            <text x={tx + 7} y={ty + 57} fontSize="6.5" fill="#aaa" fontFamily="system-ui">
              Cliquer ailleurs pour fermer
            </text>
          </g>
        );
      })()}

      {/* Légende */}
      <rect x="10" y="704" width="590" height="22" rx="4" fill="#fff" opacity="0.85"/>

      {viewMode === 'zones' ? (
        /* Légende flux */
        <>
          {Object.entries(FLOW_COLORS).map(([type, color], i) => {
            const labels: Record<string, string> = { water: 'Eau', fertility: 'Fertilité', cuisine: 'Cuisine', animals: 'Animaux', transformation: 'Transformation' };
            const xOff = 14 + i * 112;
            return (
              <g key={type}>
                <line x1={xOff} y1="716" x2={xOff + 24} y2="716" stroke={color} strokeWidth="1.5" strokeDasharray="4,2"/>
                <text x={xOff + 28} y="719" fontSize="8" fontFamily="system-ui" fill="#666">{labels[type]}</text>
              </g>
            );
          })}
          <rect x="580" y="708" width="18" height="8" rx="2" fill="#3d6b2c" opacity="0.3"/>
          <text x="602" y="719" fontSize="8" fontFamily="system-ui" fill="#666">Haies</text>
          <rect x="628" y="708" width="18" height="8" rx="2" fill="#c8b8d8" opacity="0.7"/>
          <text x="650" y="719" fontSize="8" fontFamily="system-ui" fill="#666">Champignons</text>
        </>
      ) : (
        /* Légende catégories plantes */
        <>
          {Object.entries(CATEGORY_LABELS).slice(0, 9).map(([cat, label], i) => {
            const xOff = 14 + i * 64;
            return (
              <g key={cat}>
                <rect x={xOff} y="709" width="8" height="8" rx="1.5" fill={CATEGORY_COLORS[cat]} opacity="0.85"/>
                <text x={xOff + 11} y="717" fontSize="7.5" fontFamily="system-ui" fill="#666">{label}</text>
              </g>
            );
          })}
          <circle cx="590" cy="713" r="5" fill="#EF9F27" opacity="0.9"/>
          <text x="597" y="717" fontSize="7.5" fontFamily="system-ui" fill="#666">Animaux</text>
          <circle cx="630" cy="713" r="5" fill="#7a5a9a" opacity="0.9"/>
          <text x="637" y="717" fontSize="7.5" fontFamily="system-ui" fill="#666">Champis</text>
        </>
      )}
    </svg>
  );
};

export default FarmMap;
