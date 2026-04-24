import React from 'react';
import type { Plant } from '../types/domain';

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

function weekLabel(w: number): string {
  const months = ['Jan','Jan','Fév','Fév','Mar','Mar','Avr','Avr','Mai','Mai','Juin','Juin','Juil','Juil','Août','Août','Sep','Sep','Oct','Oct','Nov','Nov','Déc','Déc','Jan','Jan','Jan','Jan'];
  return months[Math.min(w - 1, 27)] ?? '';
}

interface WeekBarProps {
  sowWeeks?: number[];
  directSowWeeks?: number[];
  plantWeeks?: number[];
  harvestWeeks: number[];
}

const WeekBar: React.FC<WeekBarProps> = ({ sowWeeks, directSowWeeks, plantWeeks, harvestWeeks }) => {
  const totalWeeks = 56;
  const cellW = 100 / totalWeeks;

  const inSet = (week: number, set?: number[]) => set?.includes(week) ?? false;

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', marginBottom: '2px', fontSize: '9px', color: '#999', justifyContent: 'space-between' }}>
        {[1, 8, 16, 24, 32, 40, 48, 56].map(w => (
          <span key={w}>{weekLabel(w)}</span>
        ))}
      </div>
      <div style={{ display: 'flex', height: '14px', borderRadius: '3px', overflow: 'hidden', background: '#f0f0f0' }}>
        {Array.from({ length: totalWeeks }, (_, i) => {
          const w = i + 1;
          let bg = 'transparent';
          if (inSet(w, harvestWeeks)) bg = '#E8593C';
          else if (inSet(w, plantWeeks)) bg = '#3B8BD4';
          else if (inSet(w, sowWeeks) || inSet(w, directSowWeeks)) bg = '#639922';
          return (
            <div
              key={w}
              style={{ width: `${cellW}%`, background: bg, opacity: bg === 'transparent' ? 0 : 0.85 }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '3px', fontSize: '9px', color: '#666' }}>
        {(sowWeeks || directSowWeeks) && <span><span style={{ color: '#639922' }}>■</span> Semis</span>}
        {plantWeeks && <span><span style={{ color: '#3B8BD4' }}>■</span> Plant</span>}
        <span><span style={{ color: '#E8593C' }}>■</span> Récolte</span>
      </div>
    </div>
  );
};

interface Props {
  plant: Plant;
}

const PlantCard: React.FC<Props> = ({ plant }) => {
  const color = CATEGORY_COLORS[plant.category] ?? '#888';

  return (
    <div style={{
      border: `1px solid ${color}30`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '5px',
      padding: '8px 10px',
      marginBottom: '8px',
      background: '#fff',
      fontSize: '11px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div>
          <span style={{ fontWeight: 600, color: '#222', fontSize: '12px' }}>{plant.name}</span>
          {plant.variety && <span style={{ color: '#888', fontSize: '10px', marginLeft: '5px' }}>{plant.variety}</span>}
        </div>
        <span style={{
          fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
          background: `${color}20`, color,
        }}>
          {plant.category}
        </span>
      </div>

      <WeekBar
        sowWeeks={plant.sowWeeks}
        directSowWeeks={plant.directSowWeeks}
        plantWeeks={plant.plantWeeks}
        harvestWeeks={plant.harvestWeeks}
      />

      <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: '#555', marginBottom: '4px' }}>
        <span>Espacement : <strong>{plant.spacingM2} m²</strong></span>
        <span>Rendement : <strong>{plant.yieldKgPerM2} kg/m²</strong></span>
        {plant.storageMonths !== undefined && plant.storageMonths > 0 && (
          <span>Conservation : <strong>{plant.storageMonths} mois</strong></span>
        )}
      </div>

      {plant.culinaryUses && plant.culinaryUses.length > 0 && (
        <div style={{ fontSize: '10px', color: '#777' }}>
          {plant.culinaryUses.join(' · ')}
        </div>
      )}

      {plant.notes && (
        <div style={{ fontSize: '10px', color: '#aaa', fontStyle: 'italic', marginTop: '3px' }}>
          {plant.notes}
        </div>
      )}
    </div>
  );
};

export default PlantCard;
