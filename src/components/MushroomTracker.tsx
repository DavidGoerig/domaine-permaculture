import React from 'react';
import type { MushroomBed, WeekRange } from '../types/domain';

const SPECIES_COLORS: Record<string, string> = {
  shiitake: '#8a6a6a',
  pleurote: '#6a8a9a',
  autre: '#888',
};

const SPECIES_LABELS: Record<string, string> = {
  shiitake: 'Shiitake',
  pleurote: 'Pleurote',
  autre: 'Autre',
};

const SUBSTRATE_LABELS: Record<string, string> = {
  rondin_chene: 'Rondin chêne',
  rondin_hetre: 'Rondin hêtre',
  rondin_peuplier: 'Rondin peuplier',
  paille: 'Paille',
  sciure: 'Sciure',
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

function nextHarvest(bed: MushroomBed, currentWeek: number): string {
  const future = bed.harvestWeeks.filter(w => w >= currentWeek);
  if (future.length > 0) return `Sem. ${future[0]}`;
  const nextYear = bed.harvestWeeks[0];
  return nextYear ? `Sem. ${nextYear} (an prochain)` : '—';
}

interface Props {
  mushroomBeds: MushroomBed[];
  currentWeek: number;
  filterZoneId?: string | null;
  onItemSelect?: (id: string, type: 'plant' | 'animal' | 'mushroom') => void;
}

const MushroomTracker: React.FC<Props> = ({ mushroomBeds, currentWeek, filterZoneId, onItemSelect }) => {
  const range = getWeekRange(currentWeek);
  const filtered = filterZoneId ? mushroomBeds.filter(b => b.zoneId === filterZoneId) : mushroomBeds;

  return (
    <div style={{ padding: '12px', fontSize: '11px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#222' }}>Champignons</h2>
        {filterZoneId && (
          <span style={{ fontSize: '10px', color: '#7a5a9a', background: '#f5f0ff', padding: '2px 7px', borderRadius: '3px' }}>
            Filtre zone actif
          </span>
        )}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: '#bbb', fontSize: '11px' }}>
          {filterZoneId ? 'Aucun lot dans cette zone.' : 'Aucun lot enregistré.'}
        </p>
      )}

      {filtered.map(bed => {
        const color = SPECIES_COLORS[bed.species];
        const isHarvesting = bed.harvestWeeks.includes(currentWeek);
        const careItems = bed.careSchedule[range] ?? [];

        return (
          <div key={bed.id} style={{ marginBottom: '12px', border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: '5px', overflow: 'hidden' }}>
            <div
              style={{ padding: '6px 10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: onItemSelect ? 'pointer' : 'default' }}
              onClick={() => onItemSelect?.(bed.id, 'mushroom')}
              title="Voir la fiche"
            >
              <span style={{ fontWeight: 600, color: '#333', fontSize: '11px' }}>{bed.name}</span>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', background: `${color}20`, color, padding: '1px 6px', borderRadius: '3px' }}>
                  {SPECIES_LABELS[bed.species]}
                </span>
                {isHarvesting && (
                  <span style={{ fontSize: '10px', background: '#e8f4e8', color: '#3a7a3a', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                    ↗ Récolte
                  </span>
                )}
              </div>
            </div>

            <div style={{ padding: '6px 10px', display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '10px', color: '#666', borderBottom: '1px solid #eee' }}>
              <span>Substrat : <strong style={{ color: '#444' }}>{SUBSTRATE_LABELS[bed.substrate]}</strong></span>
              <span>Inoculation : <strong style={{ color: '#444' }}>Sem. {bed.inoculationWeek}</strong></span>
              <span>1ère récolte : <strong style={{ color: '#444' }}>Sem. {bed.firstHarvestWeek}</strong></span>
              <span>Rendement : <strong style={{ color: '#3a7a3a' }}>~{bed.yieldKgPerYear} kg/an</strong></span>
            </div>

            <div style={{ padding: '6px 10px' }}>
              <div style={{ fontSize: '10px', color: '#999', marginBottom: '3px', fontWeight: 600 }}>
                Prochaine récolte : <span style={{ color: '#555' }}>{nextHarvest(bed, currentWeek)}</span>
              </div>
              {careItems.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '9px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                    Soins cette période
                  </div>
                  {careItems.map((item, i) => (
                    <div key={i} style={{ padding: '2px 7px 2px 9px', borderLeft: '2px solid #c8b8d8', background: '#faf8ff', borderRadius: '3px', marginBottom: '2px', color: '#555' }}>
                      {item}
                    </div>
                  ))}
                </div>
              )}
              {bed.notes && (
                <div style={{ fontSize: '10px', color: '#bbb', fontStyle: 'italic', marginTop: '4px' }}>
                  {bed.notes}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MushroomTracker;
