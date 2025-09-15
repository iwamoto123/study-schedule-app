export type UnitType = 'pages' | 'problems' | 'words' | 'chapters' | 'none';
export type Subject = 'math' | 'english' | 'japanese' | 'chemistry' | 'physics' | 'biology' | 'geology' | 'social' | 'informatics';

export interface Material {
  id: string;
  title: string;
  unitType: UnitType;
  totalCount: number;
  startDate: string; // YYYY-MM-DD
  deadline: string;  // YYYY-MM-DD
  dailyPlan: number;
  subject: Subject;
  completed: number;
}

