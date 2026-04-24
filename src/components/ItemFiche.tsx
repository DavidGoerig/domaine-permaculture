import React from 'react';
import type { Plant, Animal, MushroomBed, BeeHive, WeekRange } from '../types/domain';

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

const MONTHS = ['Jan','Jan','Fév','Fév','Mar','Mar','Avr','Avr','Mai','Mai','Juin','Juin',
  'Juil','Juil','Août','Août','Sep','Sep','Oct','Oct','Nov','Nov','Déc','Déc','Jan','Jan','Jan','Jan'];

function weekLabel(w: number): string {
  return MONTHS[Math.min(w - 1, 27)] ?? '';
}

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

/* ---- WeekBar ---- */
const WeekBar: React.FC<{
  sowWeeks?: number[]; directSowWeeks?: number[];
  plantWeeks?: number[]; harvestWeeks: number[];
}> = ({ sowWeeks, directSowWeeks, plantWeeks, harvestWeeks }) => {
  const totalWeeks = 56;
  const cellW = 100 / totalWeeks;
  const inSet = (w: number, s?: number[]) => s?.includes(w) ?? false;

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#aaa', marginBottom: '2px' }}>
        {[1, 8, 16, 24, 32, 40, 48, 56].map(w => <span key={w}>{weekLabel(w)}</span>)}
      </div>
      <div style={{ display: 'flex', height: '16px', borderRadius: '3px', overflow: 'hidden', background: '#f0f0f0' }}>
        {Array.from({ length: totalWeeks }, (_, i) => {
          const w = i + 1;
          let bg = 'transparent';
          if (inSet(w, harvestWeeks)) bg = '#E8593C';
          else if (inSet(w, plantWeeks)) bg = '#3B8BD4';
          else if (inSet(w, sowWeeks) || inSet(w, directSowWeeks)) bg = '#639922';
          return <div key={w} style={{ width: `${cellW}%`, background: bg, opacity: bg === 'transparent' ? 0 : 0.85 }} />;
        })}
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '9px', color: '#777' }}>
        {(sowWeeks || directSowWeeks) && <span><span style={{ color: '#639922' }}>■</span> Semis</span>}
        {plantWeeks && <span><span style={{ color: '#3B8BD4' }}>■</span> Repiquage</span>}
        <span><span style={{ color: '#E8593C' }}>■</span> Récolte</span>
      </div>
    </div>
  );
};

/* ---- Plant fiche ---- */
const PlantFiche: React.FC<{ plant: Plant }> = ({ plant }) => {
  const color = CATEGORY_COLORS[plant.category] ?? '#888';
  const nbPlants100 = Math.floor(100 / plant.spacingM2);
  const yield100 = Math.round(nbPlants100 * plant.yieldKgPerPlant);

  const calTasks: { label: string; weeks: number[]; color: string }[] = [];
  if (plant.sowWeeks && plant.sowWeeks.length > 0)
    calTasks.push({ label: 'Semis intérieur', weeks: plant.sowWeeks, color: '#639922' });
  if (plant.directSowWeeks && plant.directSowWeeks.length > 0)
    calTasks.push({ label: 'Semis direct', weeks: plant.directSowWeeks, color: '#3aaa5a' });
  if (plant.plantWeeks && plant.plantWeeks.length > 0)
    calTasks.push({ label: 'Repiquage', weeks: plant.plantWeeks, color: '#3B8BD4' });
  calTasks.push({ label: 'Récolte', weeks: plant.harvestWeeks, color: '#E8593C' });

  return (
    <div style={{ padding: '10px 12px', fontSize: '11px', color: '#333' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#222' }}>{plant.name}</div>
        {plant.variety && <div style={{ fontSize: '11px', color: '#888' }}>{plant.variety}</div>}
        <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: `${color}20`, color }}>
            {plant.category}
          </span>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: '#f0f0f0', color: '#555' }}>
            {plant.family}
          </span>
        </div>
      </div>

      {/* Calendrier */}
      <Section title="Calendrier cultural">
        <WeekBar
          sowWeeks={plant.sowWeeks}
          directSowWeeks={plant.directSowWeeks}
          plantWeeks={plant.plantWeeks}
          harvestWeeks={plant.harvestWeeks}
        />
        <div style={{ fontSize: '10px', color: '#666', lineHeight: 1.6 }}>
          {calTasks.map(t => (
            <div key={t.label}>
              <span style={{ color: t.color, fontWeight: 600 }}>{t.label} : </span>
              sem. {t.weeks[0]}–{t.weeks[t.weeks.length - 1]}
            </div>
          ))}
        </div>
      </Section>

      {/* Rendement */}
      <Section title="Rendement">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
          <InfoBox label="Espacement" value={`${plant.spacingM2} m²/plant`} />
          <InfoBox label="Rendement" value={`${plant.yieldKgPerM2} kg/m²`} accent="#3a7a3a" />
          <InfoBox label="Rendement / plant" value={`${plant.yieldKgPerPlant} kg`} />
          <InfoBox label="Sur 100 m²" value={`~${yield100} kg/an`} accent="#3a7a3a" />
          {plant.storageMonths && plant.storageMonths > 0 && (
            <InfoBox label="Conservation" value={`${plant.storageMonths} mois`} />
          )}
        </div>
      </Section>

      {/* Comment utiliser */}
      {plant.culinaryUses && plant.culinaryUses.length > 0 && (
        <Section title="Comment utiliser">
          <ul style={{ padding: 0, listStyle: 'none', lineHeight: 1.7 }}>
            {plant.culinaryUses.map((u, i) => (
              <li key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ color: '#E8593C', flexShrink: 0 }}>·</span>
                {u}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Transformer / conserver */}
      {plant.processingMethods && plant.processingMethods.length > 0 && (
        <Section title="Transformer / Conserver">
          <ul style={{ padding: 0, listStyle: 'none', lineHeight: 1.7 }}>
            {plant.processingMethods.map((m, i) => (
              <li key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ color: '#7a5a9a', flexShrink: 0 }}>→</span>
                {m}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Zones */}
      {plant.zones && plant.zones.length > 0 && (
        <Section title="Présent dans les zones">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {plant.zones.map(z => (
              <span key={z} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: '#e8f4e8', color: '#3a7a3a' }}>{z}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Notes */}
      {plant.notes && (
        <div style={{ fontSize: '10px', color: '#aaa', fontStyle: 'italic', marginTop: '6px', lineHeight: 1.6, borderTop: '1px solid #eee', paddingTop: '8px' }}>
          ⚠ {plant.notes}
        </div>
      )}
    </div>
  );
};

/* ---- Animal fiche ---- */
const AnimalFiche: React.FC<{ animal: Animal; currentWeek: number }> = ({ animal, currentWeek }) => {
  const range = getWeekRange(currentWeek);
  const tasks = [...(animal.schedule['1-56'] ?? []), ...(animal.schedule[range] ?? [])];

  return (
    <div style={{ padding: '10px 12px', fontSize: '11px', color: '#333' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: '#222', marginBottom: '2px' }}>{animal.name}</div>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>{animal.species} · {animal.count} individus</div>

      {animal.yearlyProduction && animal.yearlyProduction.length > 0 && (
        <Section title="Productions annuelles">
          {animal.yearlyProduction.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>
              <span>{p.item}</span>
              <strong style={{ color: '#3a7a3a' }}>~{p.quantity.toLocaleString('fr')} {p.unit}</strong>
            </div>
          ))}
        </Section>
      )}

      {animal.dailyProduction && animal.dailyProduction.length > 0 && (
        <Section title="Productions quotidiennes">
          {animal.dailyProduction.map((p, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#555' }}>
              {p.item} : <strong>{p.quantity} {p.unit}</strong>
            </div>
          ))}
        </Section>
      )}

      <Section title={`Tâches — Sem. ${currentWeek}`}>
        {tasks.length === 0 ? (
          <p style={{ color: '#bbb' }}>Aucune tâche cette période.</p>
        ) : tasks.map((t, i) => {
          const pc = PRIORITY_COLORS[t.priority];
          return (
            <div key={i} style={{ padding: '3px 8px 3px 10px', borderLeft: `2px solid ${pc.border}`, background: pc.bg, borderRadius: '3px', marginBottom: '3px' }}>
              <span style={{ color: '#333' }}>{t.text}</span>
              <span style={{ color: '#bbb', fontSize: '9px', marginLeft: '8px' }}>{t.frequency}</span>
            </div>
          );
        })}
      </Section>

      {animal.inputs && animal.inputs.length > 0 && (
        <Section title="Inputs">
          <ul style={{ padding: 0, listStyle: 'none', lineHeight: 1.7, fontSize: '11px', color: '#555' }}>
            {animal.inputs.map((inp, i) => <li key={i}>· {inp}</li>)}
          </ul>
        </Section>
      )}

      {animal.notes && (
        <div style={{ fontSize: '10px', color: '#aaa', fontStyle: 'italic', marginTop: '6px', lineHeight: 1.6, borderTop: '1px solid #eee', paddingTop: '8px' }}>
          {animal.notes}
        </div>
      )}
    </div>
  );
};

/* ---- Mushroom fiche ---- */
const MushroomFiche: React.FC<{ bed: MushroomBed; currentWeek: number }> = ({ bed, currentWeek }) => {
  const range = getWeekRange(currentWeek);
  const careItems = bed.careSchedule[range] ?? [];
  const isHarvesting = bed.harvestWeeks.includes(currentWeek);

  const SUBSTRATE_LABELS: Record<string, string> = {
    rondin_chene: 'Rondin chêne', rondin_hetre: 'Rondin hêtre',
    rondin_peuplier: 'Rondin peuplier', paille: 'Paille', sciure: 'Sciure',
  };

  return (
    <div style={{ padding: '10px 12px', fontSize: '11px', color: '#333' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: '#222', marginBottom: '2px' }}>{bed.name}</div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: '#f0ebf8', color: '#7a5a9a' }}>{bed.species}</span>
        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: '#f0f0f0', color: '#555' }}>{SUBSTRATE_LABELS[bed.substrate]}</span>
        {isHarvesting && (
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: '#e8f4e8', color: '#3a7a3a', fontWeight: 600 }}>↗ Récolte maintenant</span>
        )}
      </div>

      <Section title="Cycle de production">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <InfoBox label="Inoculation" value={`Semaine ${bed.inoculationWeek}`} />
          <InfoBox label="1ère récolte" value={`Semaine ${bed.firstHarvestWeek}`} />
          <InfoBox label="Rendement" value={`~${bed.yieldKgPerYear} kg/an`} accent="#3a7a3a" />
          <InfoBox label="Périodes récolte" value={`${bed.harvestWeeks.length} semaines`} />
        </div>
      </Section>

      <Section title="Comment utiliser">
        <ul style={{ padding: 0, listStyle: 'none', lineHeight: 1.7 }}>
          <li>· Frais : sauté beurre + ail, soupe, risotto</li>
          <li>· Séchés : réhydrater 20 min eau chaude, utiliser eau de trempage comme bouillon</li>
          <li>· Séchoir solaire : tranches 3–5mm, 40°C, 3–4h</li>
          <li>· Conservation séché : bocal hermétique, 12 mois</li>
        </ul>
      </Section>

      <Section title={`Soins — Sem. ${currentWeek}`}>
        {careItems.length === 0 ? (
          <p style={{ color: '#bbb' }}>Pas de soin spécifique cette période.</p>
        ) : careItems.map((item, i) => (
          <div key={i} style={{ padding: '3px 8px 3px 10px', borderLeft: '2px solid #c8b8d8', background: '#faf8ff', borderRadius: '3px', marginBottom: '3px', color: '#555' }}>
            {item}
          </div>
        ))}
      </Section>

      {bed.notes && (
        <div style={{ fontSize: '10px', color: '#aaa', fontStyle: 'italic', marginTop: '6px', lineHeight: 1.6, borderTop: '1px solid #eee', paddingTop: '8px' }}>
          {bed.notes}
        </div>
      )}
    </div>
  );
};

/* ---- BeeHive fiche ---- */
const BeeHiveFiche: React.FC<{ hive: BeeHive; currentWeek: number }> = ({ hive, currentWeek }) => {
  const range = getWeekRange(currentWeek);
  const currentTasks = [...(hive.schedule['1-56'] ?? []), ...(hive.schedule[range] ?? [])];

  const PERIODS: WeekRange[] = ['1-8', '9-16', '17-24', '25-32', '33-40', '41-48', '49-56'];
  const PERIOD_LABELS: Partial<Record<WeekRange, string>> = {
    '1-8':   'Hiver — grappe',
    '9-16':  'Printemps — réveil',
    '17-24': 'Essaimage',
    '25-32': 'Grande miellée',
    '33-40': 'Récolte automne',
    '41-48': 'Hivernage',
    '49-56': 'Hiver profond',
  };
  const PERIOD_SHORT = ['Hiver', 'Prnt.', 'Essaim', 'Miellée', 'Réc.', 'Hivern.', 'Hiver'];
  const PERIOD_COLORS: Partial<Record<WeekRange, string>> = {
    '1-8':   '#b0c4d8',
    '9-16':  '#7bc47a',
    '17-24': '#f5a623',
    '25-32': '#f5c842',
    '33-40': '#e8a030',
    '41-48': '#8aa8c0',
    '49-56': '#b0c4d8',
  };

  return (
    <div style={{ padding: '10px 12px', fontSize: '11px', color: '#333' }}>
      {/* Header */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#222', marginBottom: '4px' }}>{hive.name}</div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: '#fff8e0', color: '#aa7700' }}>
            {hive.type}
          </span>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: '#e8f4e8', color: '#3a7a3a', fontWeight: 600 }}>
            ~{hive.yearlyHoneyKg} kg miel/an
          </span>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: '#f5f0e8', color: '#887755' }}>
            ~{hive.yearlyWaxG} g cire/an
          </span>
        </div>
      </div>

      {/* Calendrier apicole */}
      <Section title="Calendrier apicole">
        <div style={{ display: 'flex', borderRadius: '3px', overflow: 'hidden', height: '14px', marginBottom: '3px' }}>
          {PERIODS.map(p => (
            <div key={p} style={{
              flex: 1,
              background: PERIOD_COLORS[p],
              opacity: p === range ? 1 : 0.45,
              outline: p === range ? '2px solid #333' : 'none',
              outlineOffset: '-1px',
            }}/>
          ))}
        </div>
        <div style={{ display: 'flex', fontSize: '7.5px', color: '#999', marginBottom: '6px' }}>
          {PERIODS.map((p, i) => (
            <div key={p} style={{ flex: 1, textAlign: 'center', color: p === range ? '#333' : '#aaa', fontWeight: p === range ? 600 : 400 }}>
              {PERIOD_SHORT[i]}
            </div>
          ))}
        </div>
      </Section>

      {/* Tâches semaine courante */}
      <Section title={`Tâches — Sem. ${currentWeek} (${PERIOD_LABELS[range] ?? ''})`}>
        {currentTasks.length === 0 ? (
          <p style={{ color: '#bbb' }}>Aucune tâche cette période.</p>
        ) : currentTasks.map((t, i) => {
          const pc = PRIORITY_COLORS[t.priority];
          return (
            <div key={i} style={{ padding: '3px 8px 3px 10px', borderLeft: `2px solid ${pc.border}`, background: pc.bg, borderRadius: '3px', marginBottom: '3px', lineHeight: 1.5 }}>
              {t.text}
            </div>
          );
        })}
      </Section>

      {/* Toute l'année */}
      <Section title="Toute l'année — tâches par période">
        {PERIODS.map(p => {
          const tasks = hive.schedule[p] ?? [];
          if (tasks.length === 0) return null;
          return (
            <div key={p} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: PERIOD_COLORS[p], flexShrink: 0 }}/>
                <span style={{ fontSize: '10px', fontWeight: 600, color: p === range ? '#222' : '#666' }}>
                  Sem. {p} — {PERIOD_LABELS[p]}
                </span>
              </div>
              {tasks.map((t, i) => {
                const pc = PRIORITY_COLORS[t.priority];
                return (
                  <div key={i} style={{ padding: '2px 7px 2px 9px', borderLeft: `2px solid ${pc.border}`, background: pc.bg, borderRadius: '3px', marginBottom: '2px', fontSize: '10px', lineHeight: 1.5 }}>
                    {t.text}
                  </div>
                );
              })}
            </div>
          );
        })}
      </Section>

      {hive.notes && (
        <div style={{ fontSize: '10px', color: '#888', fontStyle: 'italic', lineHeight: 1.6, borderTop: '1px solid #eee', paddingTop: '8px' }}>
          {hive.notes}
        </div>
      )}
    </div>
  );
};

/* ---- Utilities ---- */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginBottom: '12px' }}>
    <h3 style={{ fontSize: '10px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
      {title}
    </h3>
    {children}
  </section>
);

const InfoBox: React.FC<{ label: string; value: string; accent?: string }> = ({ label, value, accent }) => (
  <div style={{ background: '#f8f8f8', borderRadius: '4px', padding: '5px 7px' }}>
    <div style={{ fontSize: '9px', color: '#aaa', marginBottom: '1px' }}>{label}</div>
    <div style={{ fontSize: '11px', fontWeight: 600, color: accent ?? '#333' }}>{value}</div>
  </div>
);

/* ---- Main export ---- */
interface Props {
  itemId: string;
  itemType: 'plant' | 'animal' | 'mushroom' | 'beehive';
  plants: Plant[];
  animals: Animal[];
  mushroomBeds: MushroomBed[];
  beehives: BeeHive[];
  currentWeek: number;
  onBack: () => void;
}

const ItemFiche: React.FC<Props> = ({ itemId, itemType, plants, animals, mushroomBeds, beehives, currentWeek, onBack }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Back bar */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #eee', background: '#fafafa', flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ fontSize: '11px', color: '#3B8BD4', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          ← Retour
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {itemType === 'plant' && (() => {
          const plant = plants.find(p => p.id === itemId);
          return plant ? <PlantFiche plant={plant} /> : <p style={{ padding: '12px', color: '#bbb' }}>Plante introuvable.</p>;
        })()}
        {itemType === 'animal' && (() => {
          const animal = animals.find(a => a.id === itemId);
          return animal ? <AnimalFiche animal={animal} currentWeek={currentWeek} /> : <p style={{ padding: '12px', color: '#bbb' }}>Animal introuvable.</p>;
        })()}
        {itemType === 'mushroom' && (() => {
          const bed = mushroomBeds.find(b => b.id === itemId);
          return bed ? <MushroomFiche bed={bed} currentWeek={currentWeek} /> : <p style={{ padding: '12px', color: '#bbb' }}>Lot introuvable.</p>;
        })()}
        {itemType === 'beehive' && (() => {
          const hive = beehives.find(h => h.id === itemId);
          return hive ? <BeeHiveFiche hive={hive} currentWeek={currentWeek} /> : <p style={{ padding: '12px', color: '#bbb' }}>Ruche introuvable.</p>;
        })()}
      </div>
    </div>
  );
};

export default ItemFiche;
