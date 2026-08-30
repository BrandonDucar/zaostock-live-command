export type EventMode = 'LIVE' | 'REHEARSAL';
export type Severity = 'INFO' | 'WATCH' | 'ACTION' | 'CRITICAL';
export type SystemName = 'STAGE' | 'CREW' | 'BATTLE' | 'MEDIA' | 'TASKS' | 'PROOF';
export type SystemStatus = 'HEALTHY' | 'WATCH' | 'DEGRADED' | 'OFFLINE';
export type ScenarioId = 'artist-delay' | 'volunteer-no-show' | 'stream-down' | 'vote-delay';

export interface ProgramItem {
  id: string;
  title: string;
  venue: string;
  startMinute: number;
  durationMinutes: number;
  kind: 'MUSIC' | 'BATTLE' | 'STORY' | 'COMMUNITY';
}

export interface CrewMember {
  id: string;
  name: string;
  capability: string;
  checkedIn: boolean;
  available: boolean;
}

export interface CrewTask {
  id: string;
  title: string;
  location: string;
  dueMinute: number;
  durationMinutes: number;
  capability: string;
  status: 'OPEN' | 'CLAIMED' | 'DONE';
  assignee?: string;
}

export interface WireEvent {
  id: string;
  atMinute: number;
  source: 'HERMES' | SystemName | 'HUMAN';
  severity: Severity;
  message: string;
  proofClass: 'OBSERVED' | 'SIMULATED' | 'HUMAN_APPROVED';
}

export interface RecoveryOption {
  id: string;
  label: string;
  detail: string;
  projectedStartMinute: number;
  interventionLevel: 2 | 3;
}

export interface HermesState {
  statement: string;
  riskSummary: string[];
  recommendation?: string;
  recoveryOptions: RecoveryOption[];
  awaitingApproval: boolean;
}

export interface EventState {
  eventId: string;
  eventName: string;
  eventDate: string;
  mode: EventMode;
  clockMinute: number;
  clockSecond: number;
  scheduleDriftMinutes: number;
  pulse: number;
  streamHealthy: boolean;
  voteDelayMinutes: number;
  program: ProgramItem[];
  crew: CrewMember[];
  tasks: CrewTask[];
  systems: Record<SystemName, SystemStatus>;
  hermes: HermesState;
  wire: WireEvent[];
  lastScenario?: ScenarioId;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  shortLabel: string;
  description: string;
  accent: 'red' | 'gold' | 'denim' | 'olive';
}

