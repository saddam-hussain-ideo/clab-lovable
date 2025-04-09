
import type { RoadmapContent, RoadmapPhase } from "@/lib/types/cms";

export const isRoadmapContent = (content: any): content is RoadmapContent => {
  if (!content) return false;
  
  // Updated to focus on phases as the main structure
  return typeof content === 'object' && Array.isArray(content.phases);
};

export const TEXT_COLOR_OPTIONS = [
  { label: 'Default', value: 'text-white' },
  { label: 'Primary', value: 'text-blue-500' },
  { label: 'Success', value: 'text-green-500' },
  { label: 'Warning', value: 'text-yellow-500' },
  { label: 'Danger', value: 'text-red-500' },
  { label: 'Info', value: 'text-cyan-500' },
  { label: 'Muted', value: 'text-gray-400' },
  { label: 'Accent', value: 'text-purple-500' },
];

export const BACKGROUND_COLOR_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Primary', value: 'bg-blue-500/20' },
  { label: 'Success', value: 'bg-green-500/20' },
  { label: 'Warning', value: 'bg-yellow-500/20' },
  { label: 'Danger', value: 'bg-red-500/20' },
  { label: 'Info', value: 'bg-cyan-500/20' },
  { label: 'Dark', value: 'bg-zinc-800' },
];

export const ICON_OPTIONS = [
  { label: 'Target', value: 'Target' },
  { label: 'Check Circle', value: 'CheckCircle2' },
  { label: 'Clock', value: 'Clock' },
  { label: 'Rocket', value: 'Rocket' },
  { label: 'Star', value: 'Star' },
  { label: 'Flag', value: 'Flag' },
  { label: 'Award', value: 'Award' },
  { label: 'Shield', value: 'Shield' },
  { label: 'Lightning', value: 'Zap' },
  { label: 'Lightbulb', value: 'Lightbulb' },
];

export const createEmptyPhase = (): RoadmapPhase => ({
  id: `phase-${Date.now()}`,
  name: 'New Phase',
  description: 'Enter phase description here',
  status: 'upcoming',
  items: []
});

export const STATUS_OPTIONS = [
  { label: 'Completed', value: 'completed' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Upcoming', value: 'upcoming' }
];

// Completely removed EDITOR_EXTENSIONS to avoid any eval() usage
export const EDITOR_EXTENSIONS = [];
