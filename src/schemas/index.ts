import { z } from 'zod';

// ==================== Teams ====================

export const CreateTeamSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  color: z.string().min(1),
  barColor: z.string().optional(),
  textColor: z.string().optional(),
});

export const UpdateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  shortName: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  barColor: z.string().optional(),
  textColor: z.string().optional(),
});

// ==================== Players ====================

export const CreatePlayerSchema = z.object({
  name: z.string().min(1),
  avatarUrl: z.string().optional(),
  phone: z.string().optional(),
  isReferee: z.boolean().optional(),
});

export const UpdatePlayerSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().optional(),
  phone: z.string().optional(),
  isReferee: z.boolean().optional(),
});

export const AssignTeamSchema = z.object({
  teamSeasonId: z.number().int().positive(),
  jerseyNumber: z.number().int().optional(),
  isCaptain: z.boolean().optional(),
});

// ==================== Seasons ====================

export const CreateSeasonSchema = z.object({
  number: z.number().int().positive(),
  name: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
});

export const UpdateSeasonSchema = z.object({
  name: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
});

// ==================== Weeks ====================

const PhaseEnum = z.enum(['PRESEASON', 'REGULAR', 'PLAYOFF']);
const WeekTypeEnum = z.enum(['GAME', 'SUSPENDED']);

export const CreateWeekSchema = z.object({
  seasonId: z.number().int().positive(),
  weekNum: z.number().int(),
  date: z.string().min(1),
  phase: PhaseEnum,
  venue: z.string().min(1),
  type: WeekTypeEnum.optional(),
  reason: z.string().optional(),
});

export const UpdateWeekSchema = z.object({
  date: z.string().optional(),
  phase: PhaseEnum.optional(),
  venue: z.string().optional(),
  type: WeekTypeEnum.optional(),
  reason: z.string().optional(),
});

export const GenerateGamesSchema = z.object({
  matchups: z.array(z.object({
    gameNum: z.number().int().positive(),
    homeTeamSeasonId: z.number().int().positive(),
    awayTeamSeasonId: z.number().int().positive(),
    scheduledTime: z.string().optional(),
  })),
});

// ==================== Games ====================

const GameStatusEnum = z.enum(['UPCOMING', 'LIVE', 'FINISHED']);

export const UpdateGameSchema = z.object({
  homeScore: z.number().int().optional(),
  awayScore: z.number().int().optional(),
  status: GameStatusEnum.optional(),
  scheduledTime: z.string().optional(),
  recorder: z.string().optional(),
});

// ==================== Boxscore ====================

const StatEntrySchema = z.object({
  playerSeasonId: z.number().int().positive(),
  isHome: z.boolean(),
  played: z.boolean().optional(),
  fg2Made: z.number().int().optional(),
  fg2Miss: z.number().int().optional(),
  fg3Made: z.number().int().optional(),
  fg3Miss: z.number().int().optional(),
  ftMade: z.number().int().optional(),
  ftMiss: z.number().int().optional(),
  oreb: z.number().int().optional(),
  dreb: z.number().int().optional(),
  ast: z.number().int().optional(),
  blk: z.number().int().optional(),
  stl: z.number().int().optional(),
  tov: z.number().int().optional(),
  pf: z.number().int().optional(),
});

export const SaveStatsSchema = z.object({
  stats: z.array(StatEntrySchema),
});

export const UpdateStatSchema = z.object({
  played: z.boolean().optional(),
  fg2Made: z.number().int().optional(),
  fg2Miss: z.number().int().optional(),
  fg3Made: z.number().int().optional(),
  fg3Miss: z.number().int().optional(),
  ftMade: z.number().int().optional(),
  ftMiss: z.number().int().optional(),
  oreb: z.number().int().optional(),
  dreb: z.number().int().optional(),
  ast: z.number().int().optional(),
  blk: z.number().int().optional(),
  stl: z.number().int().optional(),
  tov: z.number().int().optional(),
  pf: z.number().int().optional(),
});

// ==================== Attendance ====================

const AttStatusEnum = z.enum(['PRESENT', 'ABSENT', 'AWOL', 'UNKNOWN']);

export const SaveAttendanceSchema = z.object({
  entries: z.array(z.object({
    weekId: z.number().int().positive(),
    playerSeasonId: z.number().int().positive(),
    status: AttStatusEnum,
  })),
});

// ==================== Duties ====================

const DutyTypeEnum = z.enum(['REFEREE', 'COURT', 'PHOTO', 'EQUIPMENT', 'DATA']);

export const SaveDutiesSchema = z.object({
  entries: z.array(z.object({
    gameId: z.number().int().positive(),
    playerSeasonId: z.number().int().positive(),
    dutyType: DutyTypeEnum,
  })),
});

// ==================== Dragon ====================

export const RecalculateDragonSchema = z.object({
  seasonId: z.number().int().positive(),
});

export const UpdateDragonSchema = z.object({
  mopPoints: z.number().int().optional(),
  playoffPoints: z.number().int().optional(),
});

// ==================== Announcements ====================

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  isPinned: z.boolean().optional(),
});

export const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  isPinned: z.boolean().optional(),
});

// ==================== Users ====================

const RoleEnum = z.enum(['SUPER_ADMIN', 'ADMIN', 'TEAM_CAPTAIN', 'PLAYER', 'VIEWER']);

export const CreateUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  displayName: z.string().min(1),
  role: RoleEnum.optional(),
  email: z.string().email().optional(),
  playerId: z.number().int().positive().optional(),
});

export const UpdateUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  role: RoleEnum.optional(),
  email: z.string().email().optional(),
  playerId: z.number().int().positive().optional(),
  password: z.string().min(1).optional(),
});
