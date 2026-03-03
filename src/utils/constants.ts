/** Shared constants used across multiple route files */

export const PHASE_MAP: Record<string, string> = {
  PRESEASON: '熱身賽',
  REGULAR: '例行賽',
  PLAYOFF: '季後賽',
};

export const STATUS_MAP: Record<string, string> = {
  FINISHED: 'finished',
  UPCOMING: 'upcoming',
  LIVE: 'live',
};

export const DUTY_LABEL: Record<string, string> = {
  REFEREE: '裁判',
  COURT: '場務',
  PHOTO: '攝影',
  EQUIPMENT: '器材',
  DATA: '數據',
};

export const DUTY_ICON: Record<string, string> = {
  REFEREE: '⚖️',
  COURT: '🏃',
  PHOTO: '📸',
  EQUIPMENT: '🔧',
  DATA: '📊',
};

export const DUTY_TYPES = ['REFEREE', 'COURT', 'PHOTO', 'EQUIPMENT', 'DATA'] as const;
