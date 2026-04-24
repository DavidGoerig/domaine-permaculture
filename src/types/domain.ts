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
