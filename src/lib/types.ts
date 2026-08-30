export type EventMode = 'LIVE' | 'REHEARSAL';
export type Severity = 'INFO' | 'WATCH' | 'ACTION' | 'CRITICAL';
export type SystemName = 'STAGE' | 'CREW' | 'BATTLE' | 'MEDIA' | 'TASKS' | 'MARKETING' | 'PROOF';
export type SystemStatus = 'HEALTHY' | 'WATCH' | 'DEGRADED' | 'OFFLINE';
export type ScenarioId = 'artist-delay' | 'volunteer-no-show' | 'stream-down' | 'vote-delay';

export interface ProgramItem {
  id: string;
  title: string;
  venue: string;
  startMinute: number;
  durationMinutes: number;
  kind: 'MUSIC' | 'BATTLE' | 'STORY' | 'COMMUNITY';
  status: 'HOLD' | 'CONFIRMED' | 'ARRIVED' | 'LIVE' | 'COMPLETE';
  notes?: string;
}

export interface CrewMember {
  id: string;
  name: string;
  capability: string;
  checkedIn: boolean;
  available: boolean;
  role: string;
  shiftStartMinute: number;
  shiftEndMinute: number;
  assignment: string;
}

export interface MarketingDraft {
  id: string;
  programItemId?: string;
  platform: 'FARCASTER' | 'INSTAGRAM' | 'X' | 'EMAIL' | 'BIG_SCREEN';
  publishMinute: number;
  headline: string;
  body: string;
  status: 'DRAFT' | 'APPROVED' | 'SCHEDULED';
  createdBy: 'SIGNAL_MARKETING_AGENT' | 'HUMAN';
}

export interface AgentConnectionSummary {
  id: string;
  name: string;
  runtime: string;
  scopes: string[];
  status: 'CONNECTED' | 'REVOKED';
  connectedAt: string;
}

export interface CrewTask {
  id: string;
  title: string;
  location: string;
  dueMinute: number;
  durationMinutes: number;
  capability: string;
  status: 'QUEUED' | 'CLAIMED' | 'ACTIVE' | 'PROOF' | 'DONE' | 'BLOCKED';
  assignee?: string;
  assigneeType?: 'HUMAN' | 'AGENT';
  progress: number;
  proof?: string;
  blockedReason?: string;
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
  marketingDrafts: MarketingDraft[];
  agentConnections: AgentConnectionSummary[];
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
