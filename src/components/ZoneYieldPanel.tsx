import React from 'react';
import type { Zone, Plant, ZoneYieldResult } from '../types/domain';

function harvestPeriod(weeks: number[]): string {
  if (weeks.length === 0) return '—';
  const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
  const toMonth = (w: number) => months[Math.floor(((w - 1) / 56) * 12)];
  const first = toMonth(Math.min(...weeks));
  const last = toMonth(Math.max(...weeks));
  return first === last ? first : `${first}–${last}`;
}

export function calculateZoneYield(zone: Zone, allPlants: Plant[]): ZoneYieldResult {
  const surfaceM2 = zone.surfaceM2 ?? 0;

  const zonePlants = zone.plantIds
    ? allPlants.filter(p => zone.plantIds!.includes(p.id))
    : allPlants.filter(p => p.zones.includes(zone.id));

  if (zonePlants.length === 0 || surfaceM2 === 0) {
    return { zoneId: zone.id, plants: [], totalYieldKg: 0 };
  }

  const sharePerPlant = surfaceM2 / zonePlants.length;

  const entries = zonePlants.map(p => {
    const nbPlants = Math.floor(sharePerPlant / p.spacingM2);
    const totalYieldKg = Math.round(nbPlants * p.yieldKgPerPlant);
    return {
      plantId: p.id,
      name: p.name,
      nbPlants,
      totalYieldKg,
      harvestPeriod: harvestPeriod(p.harvestWeeks),
    };
  });

  const totalYieldKg = entries.reduce((s, e) => s + e.totalYieldKg, 0);
  return { zoneId: zone.id, plants: entries, totalYieldKg };
}

interface Props {
  zone: Zone;
  allPlants: Plant[];
}

const ZoneYieldPanel: React.FC<Props> = ({ zone, allPlants }) => {
  const result = calculateZoneYield(zone, allPlants);

  if (result.plants.length === 0) return null;

  return (
    <section style={{ marginBottom: '12px' }}>
      <h3 style={{ fontSize: '10px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
        Rendements estimés
      </h3>
      <div style={{
        background: '#f8faf8', border: '1px solid #e0ead0',
        borderRadius: '5px', padding: '6px 8px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#3a7a3a', marginBottom: '5px' }}>
          ~{result.totalYieldKg.toLocaleString('fr')} kg/an au total
          {zone.surfaceM2 && (
            <span style={{ fontWeight: 400, color: '#888', marginLeft: '5px', fontSize: '10px' }}>
              ({zone.surfaceM2} m²)
            </span>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ color: '#999' }}>
              <th style={{ textAlign: 'left', paddingBottom: '2px', fontWeight: 500 }}>Plante</th>
              <th style={{ textAlign: 'right', paddingBottom: '2px', fontWeight: 500 }}>Plants</th>
              <th style={{ textAlign: 'right', paddingBottom: '2px', fontWeight: 500 }}>kg/an</th>
              <th style={{ textAlign: 'right', paddingBottom: '2px', fontWeight: 500 }}>Période</th>
            </tr>
          </thead>
          <tbody>
            {result.plants.map((p, i) => (
              <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '2px 0', color: '#333' }}>{p.name}</td>
                <td style={{ padding: '2px 0', textAlign: 'right', color: '#666' }}>{p.nbPlants}</td>
                <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 600, color: '#3a7a3a' }}>{p.totalYieldKg}</td>
                <td style={{ padding: '2px 0', textAlign: 'right', color: '#888' }}>{p.harvestPeriod}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ZoneYieldPanel;
