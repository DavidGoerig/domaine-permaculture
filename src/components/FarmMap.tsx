import React from 'react';
import type { Zone, Flow, FlowFilters, ZoneType } from '../types/domain';

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
  filters: FlowFilters;
  onSelect: (id: string | null) => void;
}

const SECTION_LABELS = [
  { y: 14, text: 'ZONE 1 — Earthship + systèmes intensifs' },
  { y: 210, text: 'ZONE 2 — Cœur maraîcher + poulailler central' },
  { y: 502, text: 'ZONE 3 — Extensif · vaches · noyers · biodiversité' },
];

const FarmMap: React.FC<Props> = ({ zones, flows, selectedZoneId, filters, onSelect }) => {
  const zoneById = new Map(zones.map(z => [z.id, z]));

  const isFlowVisible = (flow: Flow): boolean => {
    if (flow.type === 'water') return filters.water;
    if (flow.type === 'fertility') return filters.fertility;
    if (flow.type === 'cuisine') return filters.cuisine;
    if (flow.type === 'animals') return filters.animals;
    if (flow.type === 'transformation') return filters.transformation;
    return true;
  };

  const flowsByType = Object.entries(FLOW_IDS);

  return (
    <svg
      viewBox="0 0 760 860"
      style={{ display: 'block', width: '100%', minWidth: '520px' }}
      onClick={e => { if ((e.target as SVGElement).tagName === 'svg') onSelect(null); }}
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

      {/* Section labels */}
      {SECTION_LABELS.map(({ y, text }) => (
        <text key={y} x="10" y={y} fontSize="8.5" fontFamily="system-ui" fill="#999" fontWeight="500">
          {text}
        </text>
      ))}

      {/* Champignons — bordures verticales droite (hardcodé, même data que champignons_haie) */}
      {/* Bordure Z1→Z2 (petite bande à côté de haie1) */}
      <g
        style={{ cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); onSelect('champignons_haie'); }}
      >
        <rect x="628" y="178" width="86" height="18" rx="4" fill="#c8b8d8" opacity={selectedZoneId === 'champignons_haie' ? 0.9 : 0.7}
          stroke={selectedZoneId === 'champignons_haie' ? '#7a5a9a' : 'none'} strokeWidth="1.5"/>
        <text x="671" y="190" textAnchor="middle" fontSize="7.5" fontFamily="system-ui" fill="#7a5a9a" fontWeight="500">
          champignons — rondins
        </text>
      </g>

      {/* Bordure verticale droite Zone 2 */}
      <g
        style={{ cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); onSelect('champignons_haie'); }}
      >
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

      {/* Bordure verticale droite Zone 3 */}
      <g
        style={{ cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); onSelect('champignons_haie'); }}
      >
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

      {/* Portes du poulailler vers les 4 parcelles */}
      {[
        { x: 238, y: 322 }, { x: 238, y: 356 },
        { x: 380, y: 322 }, { x: 380, y: 356 },
        { x: 298, y: 258 }, { x: 298, y: 400 },
      ].map((pos, i) => (
        <rect key={i} x={pos.x} y={pos.y} width={i >= 4 ? 34 : 12} height={i >= 4 ? 12 : 16}
          rx="2" fill="#EF9F27" opacity={i >= 4 ? 0.5 : 0.7} />
      ))}

      {/* Ouvertures vers poulailler (sur les parcelles) */}
      {[
        { x: 234, y: 264 }, { x: 234, y: 386 },
        { x: 380, y: 264 }, { x: 380, y: 386 },
      ].map((pos, i) => (
        <rect key={i} x={pos.x} y={pos.y} width="12" height="18" rx="2" fill="#EF9F27" opacity="0.5" />
      ))}

      {/* Flux */}
      {flows.map(flow => {
        const visible = isFlowVisible(flow);
        return (
          <path
            key={flow.id}
            d={flow.path}
            fill="none"
            stroke={FLOW_COLORS[flow.type]}
            strokeWidth="1.5"
            strokeDasharray="5,3"
            opacity={visible ? 0.8 : 0}
            style={{ transition: 'opacity 0.3s', pointerEvents: 'none' }}
            markerEnd={`url(#arrow-${flow.type})`}
          />
        );
      })}

      {/* Zones */}
      {zones.map(zone => {
        if (zone.id === 'champignons_haie') return null; // rendu spécialement ci-dessus

        const colors = COLORS[zone.type] ?? { fill: '#ddd', stroke: '#999' };
        const selected = zone.id === selectedZoneId;
        const hedge = isHedge(zone);

        if (hedge) {
          return (
            <g key={zone.id} onClick={e => { e.stopPropagation(); onSelect(zone.id); }} style={{ cursor: 'pointer' }}>
              <rect
                x={zone.x} y={zone.y} width={zone.width} height={zone.height}
                rx="4"
                fill="#3d6b2c" opacity={selected ? 0.45 : 0.25}
                stroke={selected ? '#3d6b2c' : 'none'} strokeWidth="1.5"
              />
              <text
                x={zone.x + zone.width / 2} y={zone.y + 11}
                textAnchor="middle" fontSize="7.5" fontFamily="system-ui"
                fill="#3d6b2c" fontWeight="500" pointerEvents="none"
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

        const cx = zone.x + zone.width / 2;
        const cy = zone.y + zone.height / 2;
        const maxChars = Math.max(8, Math.floor(zone.width / 5.8));
        const lines = wrapText(zone.name, maxChars);
        const fontSize = zone.width < 90 ? 8 : 9.5;
        const lineH = fontSize + 3;
        const startY = cy - ((lines.length - 1) * lineH) / 2;

        return (
          <g
            key={zone.id}
            onClick={e => { e.stopPropagation(); onSelect(zone.id); }}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={zone.x} y={zone.y}
              width={zone.width} height={zone.height}
              rx={5}
              fill={colors.fill}
              stroke={selected ? '#333' : colors.stroke}
              strokeWidth={selected ? 2.5 : 1}
            />
            {lines.map((line, i) => (
              <text
                key={i}
                x={cx}
                y={startY + i * lineH}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight="500"
                fontFamily="system-ui"
                fill="#222"
                pointerEvents="none"
              >
                {line}
              </text>
            ))}
            {/* Sous-label : output principal ou surface */}
            {zone.outputs && zone.outputs[0] && zone.height >= 58 && (
              <text
                x={cx}
                y={startY + lines.length * lineH + 3}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={6.5}
                fontFamily="system-ui"
                fill={colors.stroke}
                pointerEvents="none"
              >
                {zone.surfaceM2 ? `↗ ${zone.surfaceM2.toLocaleString('fr')} m²` : `↗ ${zone.outputs[0]}`}
              </text>
            )}
          </g>
        );
      })}

      {/* Légende flux */}
      <rect x="10" y="704" width="590" height="22" rx="4" fill="#fff" opacity="0.8"/>
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

      {/* Zone highlight indicator (selected zone info can flow from here) */}
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
    </svg>
  );
};

export default FarmMap;
