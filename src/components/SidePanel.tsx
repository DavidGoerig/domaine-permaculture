import React from 'react';
import type { Zone, ZoneType, WeekRange, Task, Plant, BeeHive } from '../types/domain';
import PlantCard from './PlantCard';
import ZoneYieldPanel from './ZoneYieldPanel';

const TYPE_LABELS: Record<ZoneType, string> = {
  habitat:        'Habitat passif',
  eau:            'Eau / Aquaponie',
  'maraîchage':   'Maraîchage',
  verger:         'Verger / Extensif',
  animaux:        'Animaux',
  stockage:       'Stockage / Atelier',
  transformation: 'Transformation / Semis',
  champignons:    'Champignons',
  'mellifères':   'Mellifères / Sauvage',
};

const PRIORITY_COLORS: Record<string, { bg: string; border: string }> = {
  high: { bg: '#fff0ee', border: '#E8593C' },
  med:  { bg: '#fffbe8', border: '#EF9F27' },
  low:  { bg: '#f0f4ff', border: '#3B8BD4' },
};

function getWeekRange(week: number): WeekRange {
  if (week <= 8)  return '1-8';
  if (week <= 16) return '9-16';
  if (week <= 24) return '17-24';
  if (week <= 32) return '25-32';
  if (week <= 40) return '33-40';
  if (week <= 48) return '41-48';
  return '49-56';
}

function getTasks(zone: Zone, week: number): Task[] {
  if (!zone.tasks) return [];
  const range = getWeekRange(week);
  const specific = zone.tasks[range];
  const always   = zone.tasks['1-56'];
  if (specific && always) return [...specific, ...always];
  return specific ?? always ?? [];
}

interface Props {
  zone: Zone | null;
  currentWeek: number;
  allPlants: Plant[];
  beehives?: BeeHive[];
  onItemSelect: (id: string, type: 'plant' | 'animal' | 'mushroom' | 'beehive') => void;
}

const SidePanel: React.FC<Props> = ({ zone, currentWeek, allPlants, beehives, onItemSelect }) => {
  const [showPlantCards, setShowPlantCards] = React.useState(false);

  if (!zone) {
    return (
      <aside style={base}>
        <p style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', padding: '24px 12px', lineHeight: 1.6 }}>
          Cliquez sur une zone pour afficher ses détails, plantes, tâches et outils.
        </p>
      </aside>
    );
  }

  const tasks = getTasks(zone, currentWeek);
  const range = getWeekRange(currentWeek);
  const zonePlants = allPlants.filter(p => p.zones.includes(zone.id));
  const hasYield = zone.surfaceM2 && zonePlants.length > 0;

  return (
    <aside style={base}>
      {/* En-tête */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee', flexShrink: 0 }}>
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#222', marginBottom: '4px', lineHeight: 1.3 }}>
          {zone.name}
        </h2>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={tag('#f0f0f0', '#555')}>
            {TYPE_LABELS[zone.type]}
            {zone.zoneNumber !== undefined ? ` · Z${zone.zoneNumber}` : ''}
          </span>
          {zone.surfaceM2 !== undefined && (
            <span style={tag('#e8f4e8', '#3a7a3a')}>
              {zone.surfaceM2.toLocaleString('fr')} m²
            </span>
          )}
          {zone.yieldKgPerM2 !== undefined && (
            <span style={tag('#fff8e0', '#aa7700')}>
              ~{zone.yieldKgPerM2} kg/m²
            </span>
          )}
        </div>
      </div>

      {/* Corps scrollable */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px', fontSize: '11px', lineHeight: 1.55, color: '#333' }}>

        {/* Description */}
        <p style={{ color: '#555', marginBottom: '12px', fontSize: '11px' }}>{zone.description}</p>

        {/* Rendements calculés */}
        {hasYield && (
          <ZoneYieldPanel zone={zone} allPlants={allPlants} />
        )}

        {/* Ruches — détail par ruche */}
        {zone.id === 'ruches' && beehives && beehives.length > 0 && (
          <Section title="Ruches — Détail" accent="#EF9F27">
            {beehives.map(hive => {
              const hiveTasks = [
                ...(hive.schedule['1-56'] ?? []),
                ...(hive.schedule[range] ?? []),
              ];
              return (
                <div key={hive.id} style={{ marginBottom: '8px', border: '1px solid #f0e0b0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ padding: '4px 8px', background: '#fff8e8', borderBottom: '1px solid #f0e0b0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '11px', color: '#333' }}>{hive.name}</span>
                    <span style={{ fontSize: '9px', color: '#cc9a3a', background: '#fff0d0', padding: '1px 5px', borderRadius: '3px' }}>{hive.type}</span>
                  </div>
                  <div style={{ padding: '4px 8px', fontSize: '10px', color: '#3a7a3a', display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: hiveTasks.length > 0 ? '1px solid #f0e0b0' : 'none' }}>
                    <span>~{hive.yearlyHoneyKg} kg miel/an</span>
                    <span>~{hive.yearlyWaxG} g cire/an</span>
                  </div>
                  {hiveTasks.length > 0 && (
                    <div style={{ padding: '4px 8px' }}>
                      {hiveTasks.map((t, i) => {
                        const pc = PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.low;
                        return (
                          <div key={i} style={{ padding: '2px 6px 2px 8px', borderLeft: `2px solid ${pc.border}`, background: pc.bg, borderRadius: '3px', marginBottom: '2px', fontSize: '10px', color: '#333' }}>
                            {t.text}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#3a7a3a', marginTop: '2px' }}>
              Total : ~{beehives.reduce((s, h) => s + h.yearlyHoneyKg, 0)} kg miel · ~{beehives.reduce((s, h) => s + h.yearlyWaxG, 0)} g cire / an
            </div>
          </Section>
        )}

        {/* Tâches semaine */}
        <Section title={`Tâches — Sem. ${currentWeek}`} accent="#E8593C">
          {tasks.length === 0
            ? <p style={{ color: '#bbb', fontSize: '11px' }}>Pas de tâche spécifique cette semaine.</p>
            : tasks.map((t, i) => {
                const pc = PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.low;
                return (
                  <div key={i} style={{
                    padding: '3px 7px 3px 9px',
                    borderRadius: '4px',
                    marginBottom: '3px',
                    background: pc.bg,
                    borderLeft: `2px solid ${pc.border}`,
                    fontSize: '11px',
                    color: '#333',
                  }}>
                    {t.text}
                  </div>
                );
              })
          }
        </Section>

        {/* Fiches plantes */}
        {zonePlants.length > 0 && (
          <section style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <h3 style={{ fontSize: '10px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Plantes ({zonePlants.length})
              </h3>
              <button
                onClick={() => setShowPlantCards(v => !v)}
                style={{ fontSize: '9px', color: '#3B8BD4', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
              >
                {showPlantCards ? 'Masquer' : 'Fiches détaillées'}
              </button>
            </div>
            {showPlantCards ? (
              zonePlants.map(p => (
                <div key={p.id} onClick={() => onItemSelect(p.id, 'plant')} style={{ cursor: 'pointer' }}>
                  <PlantCard plant={p} />
                </div>
              ))
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {zonePlants.map((p, i) => (
                  <li
                    key={i}
                    onClick={() => onItemSelect(p.id, 'plant')}
                    style={{ marginBottom: '2px', cursor: 'pointer', padding: '1px 4px', borderRadius: '3px' }}
                    title="Voir la fiche"
                  >
                    <span style={{ color: '#bbb', marginRight: '5px' }}>·</span>
                    <span style={{ color: '#3B8BD4' }}>{p.name}{p.variety ? ` (${p.variety})` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Plantes textuelles (données JSON zones sans fiche) */}
        {zone.plants && zone.plants.length > 0 && (
          <Section title="Notes plantes" accent="#3aaa5a">
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {zone.plants.map((p, i) => (
                <li key={i} style={{ marginBottom: '3px', lineHeight: 1.45 }}>
                  <span style={{ color: '#bbb', marginRight: '5px' }}>·</span>
                  {p}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Productions */}
        {zone.outputs && zone.outputs.length > 0 && (
          <Section title="Productions" accent="#3aaa5a">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              {zone.outputs.map((o, i) => (
                <span key={i} style={badge('#ddeeff', '#1155aa')}>{o}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Animaux */}
        {zone.animals && zone.animals.length > 0 && (
          <Section title="Animaux" accent="#cc9a3a">
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {zone.animals.map((a, i) => (
                <li key={i} style={{ marginBottom: '2px' }}>
                  <span style={{ color: '#bbb', marginRight: '5px' }}>·</span>
                  {a}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Inputs */}
        {zone.inputs && zone.inputs.length > 0 && (
          <Section title="Inputs" accent="#cc8f3a">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              {zone.inputs.map((inp, i) => (
                <span key={i} style={badge('#fff0d0', '#aa7700')}>{inp}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Outils */}
        {zone.tools && zone.tools.length > 0 && (
          <Section title="Outils / Équipements" accent="#888">
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {zone.tools.map((t, i) => (
                <li key={i} style={{ marginBottom: '2px', color: '#555' }}>
                  <span style={{ color: '#bbb', marginRight: '5px' }}>·</span>
                  {t}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </aside>
  );
};

/* Styles utilitaires */
const base: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

function tag(bg: string, color: string): React.CSSProperties {
  return { display: 'inline-block', fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: bg, color };
}

function badge(bg: string, color: string): React.CSSProperties {
  return { display: 'inline-block', fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: bg, color };
}

const Section: React.FC<{ title: string; accent: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginBottom: '12px' }}>
    <h3 style={{ fontSize: '10px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
      {title}
    </h3>
    {children}
  </section>
);

export default SidePanel;
