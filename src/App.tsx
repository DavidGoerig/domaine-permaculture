import React, { useState } from 'react';
import type { Zone, Flow, FlowFilters } from './types/domain';
import zonesData from './data/zones.json';
import flowsData from './data/flows.json';
import FarmMap from './components/FarmMap';
import SidePanel from './components/SidePanel';

const zones: Zone[] = zonesData.zones as Zone[];
const flows: Flow[] = flowsData.flows as Flow[];

function getSeason(week: number): string {
  if (week <= 8)  return 'Hiver — Préparation';
  if (week <= 16) return 'Semis intensifs';
  if (week <= 24) return 'Plantation / Mise en place';
  if (week <= 32) return 'Pleine croissance';
  if (week <= 40) return "Récoltes d'été / Transformation";
  if (week <= 48) return 'Automne / Stockage';
  return 'Hiver — Bilan / Maintenance';
}

const FLOW_LABELS: Record<keyof FlowFilters, string> = {
  water:          'Eau',
  fertility:      'Fertilité',
  cuisine:        'Cuisine',
  animals:        'Animaux',
  transformation: 'Transformation',
};

const FLOW_COLORS: Record<keyof FlowFilters, string> = {
  water:          '#3B8BD4',
  fertility:      '#639922',
  cuisine:        '#E8593C',
  animals:        '#EF9F27',
  transformation: '#7a5a9a',
};

const App: React.FC = () => {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(22);
  const [filters, setFilters] = useState<FlowFilters>({
    water: true, fertility: true, cuisine: true, animals: true, transformation: true,
  });

  const selectedZone = zones.find(z => z.id === selectedZoneId) ?? null;

  const toggleFilter = (key: keyof FlowFilters) => {
    setFilters(f => ({ ...f, [key]: !f[key] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '9px 14px',
        background: '#fff',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: '14px', fontWeight: 500, flex: 1, whiteSpace: 'nowrap', color: '#222' }}>
          Domaine Permaculture
        </h1>

        {/* Slider semaine */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#555' }}>
          <span>Sem.</span>
          <input
            type="range" min={1} max={56} value={currentWeek}
            onChange={e => setCurrentWeek(Number(e.target.value))}
            style={{ width: '110px' }}
          />
          <strong style={{ minWidth: '80px', fontWeight: 500, color: '#222' }}>
            Semaine {currentWeek}
          </strong>
          <span style={{ color: '#999', fontSize: '11px', whiteSpace: 'nowrap' }}>
            — {getSeason(currentWeek)}
          </span>
        </div>
      </header>

      {/* Main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Carte */}
        <div style={{ flex: 1, overflow: 'auto', background: '#f0ece4', padding: '4px' }}>
          <FarmMap
            zones={zones}
            flows={flows}
            selectedZoneId={selectedZoneId}
            filters={filters}
            onSelect={setSelectedZoneId}
          />
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #ddd' }}>
          <SidePanel zone={selectedZone} currentWeek={currentWeek} />

          {/* Filtres flux */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid #eee',
            background: '#fafafa',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#999', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Afficher les flux
            </div>
            {(Object.keys(FLOW_LABELS) as (keyof FlowFilters)[]).map(key => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#555', cursor: 'pointer', marginBottom: '3px' }}>
                <input
                  type="checkbox"
                  checked={filters[key]}
                  onChange={() => toggleFilter(key)}
                  style={{ accentColor: FLOW_COLORS[key] }}
                />
                <span style={{ color: FLOW_COLORS[key], fontWeight: 500 }}>■</span>
                {FLOW_LABELS[key]}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
