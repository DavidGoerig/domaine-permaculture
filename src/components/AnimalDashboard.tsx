import React from 'react';
import type { Animal, WeekRange } from '../types/domain';

function getWeekRange(week: number): WeekRange {
  if (week <= 8)  return '1-8';
  if (week <= 16) return '9-16';
  if (week <= 24) return '17-24';
  if (week <= 32) return '25-32';
  if (week <= 40) return '33-40';
  if (week <= 48) return '41-48';
  return '49-56';
}

const PRIORITY_COLORS: Record<string, { bg: string; border: string }> = {
  high: { bg: '#fff0ee', border: '#E8593C' },
  med:  { bg: '#fffbe8', border: '#EF9F27' },
  low:  { bg: '#f0f4ff', border: '#3B8BD4' },
};

const FREQ_LABELS: Record<string, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdo',
  monthly: 'Mensuel',
  seasonal: 'Saison',
};

interface Props {
  animals: Animal[];
  currentWeek: number;
  filterZoneId?: string | null;
  onItemSelect?: (id: string, type: 'plant' | 'animal' | 'mushroom') => void;
}

const AnimalDashboard: React.FC<Props> = ({ animals, currentWeek, filterZoneId, onItemSelect }) => {
  const range = getWeekRange(currentWeek);
  const filtered = filterZoneId ? animals.filter(a => a.zoneId === filterZoneId) : animals;

  return (
    <div style={{ padding: '12px', fontSize: '11px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#222' }}>Animaux</h2>
        {filterZoneId && (
          <span style={{ fontSize: '10px', color: '#EF9F27', background: '#fff8e8', padding: '2px 7px', borderRadius: '3px' }}>
            Filtre zone actif
          </span>
        )}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: '#bbb', fontSize: '11px' }}>
          {filterZoneId ? 'Aucun animal dans cette zone.' : 'Aucun animal enregistré.'}
        </p>
      )}

      {filtered.map(animal => {
        const tasks = [
          ...(animal.schedule['1-56'] ?? []),
          ...(animal.schedule[range] ?? []),
        ];
        return (
          <div key={animal.id} style={{ marginBottom: '16px', border: '1px solid #eee', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{ background: '#fafafa', padding: '6px 10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: onItemSelect ? 'pointer' : 'default' }}
              onClick={() => onItemSelect?.(animal.id, 'animal')}
              title="Voir la fiche"
            >
              <div>
                <span style={{ fontWeight: 600, color: '#222' }}>{animal.name}</span>
                <span style={{ color: '#aaa', fontSize: '10px', marginLeft: '6px' }}>{animal.species}</span>
              </div>
              <span style={{ fontSize: '10px', color: '#666', background: '#f0f0f0', padding: '1px 6px', borderRadius: '3px' }}>
                {animal.count} individus
              </span>
            </div>

            {animal.yearlyProduction && animal.yearlyProduction.length > 0 && (
              <div style={{ padding: '6px 10px', borderBottom: '1px solid #eee', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {animal.yearlyProduction.map((p, i) => (
                  <span key={i} style={{ fontSize: '10px', color: '#3a7a3a', background: '#e8f4e8', padding: '1px 6px', borderRadius: '3px' }}>
                    {p.item} : ~{p.quantity.toLocaleString('fr')} {p.unit}
                  </span>
                ))}
              </div>
            )}

            <div style={{ padding: '6px 10px' }}>
              {tasks.length === 0 ? (
                <p style={{ color: '#bbb', fontSize: '10px' }}>Pas de tâche spécifique cette période.</p>
              ) : (
                tasks.map((t, i) => {
                  const pc = PRIORITY_COLORS[t.priority];
                  return (
                    <div key={i} style={{
                      padding: '3px 7px 3px 9px',
                      borderRadius: '4px',
                      marginBottom: '3px',
                      background: pc.bg,
                      borderLeft: `2px solid ${pc.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}>
                      <span style={{ color: '#333' }}>{t.text}</span>
                      <span style={{ color: '#bbb', fontSize: '9px', whiteSpace: 'nowrap' }}>{FREQ_LABELS[t.frequency]}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnimalDashboard;
