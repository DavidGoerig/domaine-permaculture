import React from 'react';
import type { Zone, Animal, BeeHive, MushroomBed, WeekRange, Task } from '../types/domain';

function getWeekRange(week: number): WeekRange {
  if (week <= 8)  return '1-8';
  if (week <= 16) return '9-16';
  if (week <= 24) return '17-24';
  if (week <= 32) return '25-32';
  if (week <= 40) return '33-40';
  if (week <= 48) return '41-48';
  return '49-56';
}

interface CalendarTask {
  text: string;
  priority: 'high' | 'med' | 'low';
  source: string;
}

const PRIORITY_COLORS: Record<string, { bg: string; border: string }> = {
  high: { bg: '#fff0ee', border: '#E8593C' },
  med:  { bg: '#fffbe8', border: '#EF9F27' },
  low:  { bg: '#f0f4ff', border: '#3B8BD4' },
};

const PRIORITY_ORDER = { high: 0, med: 1, low: 2 };
const PRIORITY_LABELS: Record<string, string> = { high: 'Urgent', med: 'Cette semaine', low: 'Si temps' };

interface Props {
  currentWeek: number;
  zones: Zone[];
  animals: Animal[];
  beehives: BeeHive[];
  mushroomBeds: MushroomBed[];
  filterZoneId?: string | null;
}

const WeekCalendar: React.FC<Props> = ({ currentWeek, zones, animals, beehives, mushroomBeds, filterZoneId }) => {
  const range = getWeekRange(currentWeek);
  const tasks: CalendarTask[] = [];

  const filteredZones = filterZoneId ? zones.filter(z => z.id === filterZoneId) : zones;
  const filteredAnimals = filterZoneId ? animals.filter(a => a.zoneId === filterZoneId) : animals;
  const filteredHives = filterZoneId ? beehives.filter(h => h.zoneId === filterZoneId) : beehives;
  const filteredBeds = filterZoneId ? mushroomBeds.filter(b => b.zoneId === filterZoneId) : mushroomBeds;

  for (const zone of filteredZones) {
    if (!zone.tasks) continue;
    const rangeTasks: Task[] = [
      ...(zone.tasks[range] ?? []),
      ...(zone.tasks['1-56'] ?? []),
    ];
    for (const t of rangeTasks) {
      tasks.push({ text: t.text, priority: t.priority, source: zone.name });
    }
  }

  for (const animal of filteredAnimals) {
    const rangeTasks = [
      ...(animal.schedule['1-56'] ?? []),
      ...(animal.schedule[range] ?? []),
    ];
    for (const t of rangeTasks) {
      tasks.push({ text: t.text, priority: t.priority, source: animal.name });
    }
  }

  for (const hive of filteredHives) {
    const rangeTasks = hive.schedule[range] ?? [];
    for (const t of rangeTasks) {
      tasks.push({ text: t.text, priority: t.priority, source: hive.name });
    }
  }

  for (const bed of filteredBeds) {
    const careItems = bed.careSchedule[range] ?? [];
    for (const item of careItems) {
      tasks.push({ text: item, priority: 'med', source: bed.name });
    }
  }

  const sorted = [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const byPriority: Record<string, CalendarTask[]> = { high: [], med: [], low: [] };
  for (const t of sorted) byPriority[t.priority].push(t);

  const filterZone = filterZoneId ? zones.find(z => z.id === filterZoneId) : null;

  return (
    <div style={{ padding: '12px', fontSize: '11px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#222' }}>
          Agenda — Sem. {currentWeek}
        </h2>
        {filterZone && (
          <span style={{ fontSize: '10px', color: '#3B8BD4', background: '#e8f0ff', padding: '2px 7px', borderRadius: '3px' }}>
            {filterZone.name}
          </span>
        )}
      </div>

      {filterZoneId && !filterZone && (
        <p style={{ color: '#bbb', fontSize: '10px', marginBottom: '8px' }}>Aucune donnée pour cette zone.</p>
      )}

      {sorted.length === 0 && (
        <p style={{ color: '#bbb' }}>Aucune tâche pour cette période.</p>
      )}

      {(['high', 'med', 'low'] as const).map(priority => {
        const group = byPriority[priority];
        if (group.length === 0) return null;
        const { bg, border } = PRIORITY_COLORS[priority];
        return (
          <div key={priority} style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              {PRIORITY_LABELS[priority]}
            </div>
            {group.map((t, i) => (
              <div key={i} style={{
                padding: '4px 8px 4px 10px',
                borderRadius: '4px',
                marginBottom: '3px',
                background: bg,
                borderLeft: `2px solid ${border}`,
                display: 'flex',
                justifyContent: 'space-between',
                gap: '8px',
              }}>
                <span style={{ color: '#333' }}>{t.text}</span>
                <span style={{ color: '#aaa', fontSize: '10px', whiteSpace: 'nowrap' }}>{t.source}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default WeekCalendar;
