export type ZoneType =
  | 'habitat'
  | 'eau'
  | 'maraîchage'
  | 'verger'
  | 'animaux'
  | 'stockage'
  | 'transformation'
  | 'champignons'
  | 'mellifères';

export type WeekRange = '1-8' | '9-16' | '17-24' | '25-32' | '33-40' | '41-48' | '49-56' | '1-56';
export type TaskPriority = 'high' | 'med' | 'low';
export type FlowType = 'water' | 'fertility' | 'cuisine' | 'animals' | 'transformation';
export type PlantCategory = 'légume-feuille' | 'légume-racine' | 'légume-fruit' | 'légumineuse' | 'aromatique' | 'fruit' | 'vivace' | 'engrais-vert' | 'sauvage' | 'mellifère' | 'champignon';

export interface Task {
  text: string;
  priority: TaskPriority;
}

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  zoneNumber?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  surfaceM2?: number;
  yieldKgPerM2?: number;
  description: string;
  plants?: string[];
  animals?: string[];
  inputs?: string[];
  outputs?: string[];
  tools?: string[];
  tasks?: Partial<Record<WeekRange, Task[]>>;
  plantIds?: string[];
  animalIds?: string[];
  mushroomBedIds?: string[];
  hiveIds?: string[];
}

export interface Flow {
  id: string;
  type: FlowType;
  path: string;
}

export interface FlowFilters {
  water: boolean;
  fertility: boolean;
  cuisine: boolean;
  animals: boolean;
  transformation: boolean;
}

export interface Plant {
  id: string;
  name: string;
  variety?: string;
  family: string;
  category: PlantCategory;
  zones: string[];
  sowWeeks?: number[];
  directSowWeeks?: number[];
  plantWeeks?: number[];
  harvestWeeks: number[];
  spacingM2: number;
  yieldKgPerPlant: number;
  yieldKgPerM2: number;
  culinaryUses?: string[];
  storageMonths?: number;
  processingMethods?: string[];
  notes?: string;
}

export interface AnimalTask {
  text: string;
  priority: TaskPriority;
  frequency: 'daily' | 'weekly' | 'monthly' | 'seasonal';
}

export interface Animal {
  id: string;
  name: string;
  species: string;
  zoneId: string;
  count: number;
  schedule: Partial<Record<WeekRange, AnimalTask[]>>;
  dailyProduction?: { item: string; quantity: number; unit: string }[];
  yearlyProduction?: { item: string; quantity: number; unit: string }[];
  inputs: string[];
  tools: string[];
  notes?: string;
}

export interface MushroomBed {
  id: string;
  name: string;
  species: 'shiitake' | 'pleurote' | 'autre';
  substrate: 'rondin_chene' | 'rondin_hetre' | 'rondin_peuplier' | 'paille' | 'sciure';
  zoneId: string;
  inoculationWeek: number;
  firstHarvestWeek: number;
  harvestWeeks: number[];
  yieldKgPerYear: number;
  careSchedule: Partial<Record<WeekRange, string[]>>;
  notes?: string;
}

export interface HiveTask {
  text: string;
  priority: TaskPriority;
}

export interface BeeHive {
  id: string;
  name: string;
  type: 'warré' | 'dadant' | 'langstroth';
  zoneId: string;
  schedule: Partial<Record<WeekRange, HiveTask[]>>;
  yearlyHoneyKg: number;
  yearlyWaxG: number;
  notes?: string;
}

export interface ZoneYieldEntry {
  plantId: string;
  name: string;
  nbPlants: number;
  totalYieldKg: number;
  harvestPeriod: string;
}

export interface ZoneYieldResult {
  zoneId: string;
  plants: ZoneYieldEntry[];
  totalYieldKg: number;
}
