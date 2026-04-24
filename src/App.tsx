import React, { useState } from 'react';
import type { Zone, Flow, FlowFilters, Animal, BeeHive, MushroomBed, Plant } from './types/domain';
import zonesData from './data/zones.json';
import flowsData from './data/flows.json';
import plantsData from './data/plants.json';
import animalsData from './data/animals.json';
import mushroomsData from './data/mushrooms.json';
import beehivesData from './data/beehives.json';
import FarmMap from './components/FarmMap';
import ProportionalMap from './components/ProportionalMap';
import IsometricMap from './components/IsometricMap';
import SidePanel from './components/SidePanel';
import WeekCalendar from './components/WeekCalendar';
import AnimalDashboard from './components/AnimalDashboard';
import MushroomTracker from './components/MushroomTracker';
import ItemFiche from './components/ItemFiche';

const zones: Zone[] = zonesData.zones as Zone[];
const flows: Flow[] = flowsData.flows as Flow[];
const plants: Plant[] = plantsData.plants as Plant[];
const animals: Animal[] = animalsData.animals as Animal[];
const mushroomBeds: MushroomBed[] = mushroomsData.mushroomBeds as MushroomBed[];
const beehives: BeeHive[] = beehivesData.beehives as BeeHive[];

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

type RightTab = 'zone' | 'agenda' | 'animaux' | 'champignons';
type MapView = 'zones' | 'content' | 'proportionnel' | 'isometrique';

const TAB_LABELS: { id: RightTab; label: string }[] = [
  { id: 'zone',        label: 'Zone' },
  { id: 'agenda',      label: 'Agenda' },
  { id: 'animaux',     label: 'Animaux' },
  { id: 'champignons', label: 'Champis' },
];

const MAP_VIEW_LABELS: { id: MapView; label: string }[] = [
  { id: 'zones',         label: 'Zones' },
  { id: 'content',       label: 'Contenu' },
  { id: 'proportionnel', label: '∝ m²' },
  { id: 'isometrique',   label: '3D' },
];

const App: React.FC = () => {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(22);
  const [filters, setFilters] = useState<FlowFilters>({
    water: true, fertility: true, cuisine: true, animals: true, transformation: true,
  });
  const [activeTab, setActiveTab] = useState<RightTab>('zone');
  const [mapView, setMapView] = useState<MapView>('zones');
  const [filterByZone, setFilterByZone] = useState(false);
  const [showIsoFlows, setShowIsoFlows] = useState(false);

  // Item selection (plant / animal / mushroom clicked on map)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'plant' | 'animal' | 'mushroom' | 'beehive' | null>(null);

  const selectedZone = zones.find(z => z.id === selectedZoneId) ?? null;
  const filterZoneId = filterByZone ? selectedZoneId : null;

  const handleZoneSelect = (id: string | null) => {
    setSelectedZoneId(id);
    setSelectedItemId(null);
    setSelectedItemType(null);
    if (id) setActiveTab('zone');
  };

  const handleItemSelect = (id: string, type: 'plant' | 'animal' | 'mushroom' | 'beehive') => {
    setSelectedItemId(id);
    setSelectedItemType(type);
  };

  const handleItemBack = () => {
    setSelectedItemId(null);
    setSelectedItemType(null);
  };

  const toggleFilter = (key: keyof FlowFilters) => {
    setFilters(f => ({ ...f, [key]: !f[key] }));
  };

  const showFiche = selectedItemId !== null && selectedItemType !== null;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#555', flexShrink: 0 }}>
          <span>Sem.</span>
          <input
            type="range" min={1} max={56} value={currentWeek}
            onChange={e => setCurrentWeek(Number(e.target.value))}
            style={{ width: '110px' }}
          />
          <strong style={{ width: '80px', flexShrink: 0, fontWeight: 500, color: '#222' }}>
            Semaine {currentWeek}
          </strong>
          <span style={{ width: '216px', flexShrink: 0, color: '#999', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            — {getSeason(currentWeek)}
          </span>
        </div>

        {/* Toggle vue carte */}
        <div style={{ display: 'flex', gap: '2px', background: '#f0f0f0', borderRadius: '5px', padding: '2px' }}>
          {MAP_VIEW_LABELS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMapView(id)}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: mapView === id ? 600 : 400,
                color: mapView === id ? '#222' : '#888',
                background: mapView === id ? '#fff' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: mapView === id ? '0 1px 3px #0001' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Carte */}
        <div style={{ flex: 1, overflow: 'auto', background: mapView === 'isometrique' ? '#d8eaf0' : '#f0ece4', padding: '4px' }}>
          {mapView === 'proportionnel' ? (
            <ProportionalMap
              zones={zones}
              plants={plants}
              animals={animals}
              mushroomBeds={mushroomBeds}
              selectedZoneId={selectedZoneId}
              selectedItemId={selectedItemId}
              onSelect={handleZoneSelect}
              onItemSelect={handleItemSelect}
            />
          ) : mapView === 'isometrique' ? (
            <IsometricMap
              zones={zones}
              plants={plants}
              flows={flows}
              showFlows={showIsoFlows}
              selectedZoneId={selectedZoneId}
              selectedItemId={selectedItemId}
              onSelect={handleZoneSelect}
              onItemSelect={handleItemSelect}
            />
          ) : (
            <FarmMap
              zones={zones}
              flows={flows}
              selectedZoneId={selectedZoneId}
              selectedItemId={selectedItemId}
              filters={filters}
              onSelect={handleZoneSelect}
              onItemSelect={handleItemSelect}
              viewMode={mapView}
              plants={plants}
              animals={animals}
              mushroomBeds={mushroomBeds}
              beehives={beehives}
            />
          )}
        </div>

        {/* Panneau droit */}
        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #ddd', width: '260px', minWidth: '240px' }}>

          {/* Fiche item (plant / animal / mushroom) — overlay les onglets */}
          {showFiche ? (
            <ItemFiche
              itemId={selectedItemId!}
              itemType={selectedItemType!}
              plants={plants}
              animals={animals}
              mushroomBeds={mushroomBeds}
              beehives={beehives}
              currentWeek={currentWeek}
              onBack={handleItemBack}
            />
          ) : (
            <>
              {/* Onglets */}
              <div style={{ display: 'flex', borderBottom: '1px solid #ddd', flexShrink: 0, background: '#fafafa' }}>
                {TAB_LABELS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    style={{
                      flex: 1,
                      padding: '6px 2px',
                      fontSize: '10px',
                      fontWeight: activeTab === id ? 600 : 400,
                      color: activeTab === id ? '#222' : '#888',
                      background: activeTab === id ? '#fff' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === id ? '2px solid #E8593C' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Filtre par zone */}
              {activeTab !== 'zone' && (
                <div style={{ padding: '5px 12px', borderBottom: '1px solid #eee', background: '#fafafa', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#666', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={filterByZone}
                      onChange={() => setFilterByZone(v => !v)}
                      disabled={!selectedZoneId}
                      style={{ accentColor: '#E8593C' }}
                    />
                    Filtrer sur zone sélectionnée
                  </label>
                  {filterByZone && selectedZone && (
                    <span style={{ fontSize: '10px', color: '#E8593C', fontWeight: 500 }}>
                      {selectedZone.name}
                    </span>
                  )}
                </div>
              )}

              {/* Contenu onglets */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                {activeTab === 'zone' && (
                  <SidePanel zone={selectedZone} currentWeek={currentWeek} allPlants={plants} beehives={beehives} onItemSelect={handleItemSelect} />
                )}
                {activeTab === 'agenda' && (
                  <WeekCalendar
                    currentWeek={currentWeek}
                    zones={zones}
                    animals={animals}
                    beehives={beehives}
                    mushroomBeds={mushroomBeds}
                    filterZoneId={filterZoneId}
                  />
                )}
                {activeTab === 'animaux' && (
                  <AnimalDashboard animals={animals} currentWeek={currentWeek} filterZoneId={filterZoneId} onItemSelect={handleItemSelect} />
                )}
                {activeTab === 'champignons' && (
                  <MushroomTracker mushroomBeds={mushroomBeds} currentWeek={currentWeek} filterZoneId={filterZoneId} onItemSelect={handleItemSelect} />
                )}
              </div>

              {/* Filtres flux (uniquement vue zones/contenu) */}
              {mapView !== 'proportionnel' && mapView !== 'isometrique' && (
                <div style={{ padding: '8px 12px', borderTop: '1px solid #eee', background: '#fafafa', flexShrink: 0 }}>
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
              )}

              {/* Toggle flux 3D (vue isométrique) */}
              {mapView === 'isometrique' && (
                <div style={{ padding: '8px 12px', borderTop: '1px solid #eee', background: '#fafafa', flexShrink: 0 }}>
                  <button
                    onClick={() => setShowIsoFlows(v => !v)}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: showIsoFlows ? 600 : 400,
                      color: showIsoFlows ? '#fff' : '#555',
                      background: showIsoFlows ? '#3B8BD4' : '#eee',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    Flux 3D
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
