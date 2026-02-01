
export interface FolderNode {
  name: string;
  description?: string;
  subfolders?: FolderNode[];
  isTopLevel?: boolean;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  details: string[];
  category: 'Desktop' | 'Downloads' | 'QuickAccess' | 'Automation';
}

export interface AIAnalysisResult {
  categories: { name: string; count: number; percentage: number }[];
  problems: string[];
  proposedStructure: string;
  namingExamples: { old: string; new: string }[];
  powershellScript: string;
}
