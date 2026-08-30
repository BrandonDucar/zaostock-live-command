import { describe, expect, it } from 'vitest';
import { canTeamAct, teamPermissions, type TeamIdentity } from './auth';

const identity = (role: TeamIdentity['role']): TeamIdentity => ({ id: role, name: role, role });

describe('team authority policy', () => {
  it('keeps Farcaster observers read-only', () => {
    const observer = identity('OBSERVER');
    expect(teamPermissions(observer)).toEqual([]);
    expect(canTeamAct(observer, 'blackboard_post')).toBe(false);
    expect(canTeamAct(observer, 'agent_connect')).toBe(false);
    expect(canTeamAct(observer, 'reset')).toBe(false);
  });

  it('limits agent credential issuance to owners and admins', () => {
    expect(canTeamAct(identity('OWNER'), 'agent_connect')).toBe(true);
    expect(canTeamAct(identity('ADMIN'), 'agent_connect')).toBe(true);
    expect(canTeamAct(identity('STAGE_MANAGER'), 'agent_connect')).toBe(false);
  });

  it('keeps specialist roles inside their lanes', () => {
    expect(canTeamAct(identity('MARKETING'), 'marketing_generate')).toBe(true);
    expect(canTeamAct(identity('MARKETING'), 'program_move')).toBe(false);
    expect(canTeamAct(identity('CREW_LEAD'), 'task_save')).toBe(true);
    expect(canTeamAct(identity('CREW_LEAD'), 'marketing_approve')).toBe(false);
  });
});
