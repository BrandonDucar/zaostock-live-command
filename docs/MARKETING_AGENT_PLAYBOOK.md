# Marketing Agent Playbook

Marketing agents turn confirmed event Reality into drafts while preserving the human publication gate.

1. Read context, program status, the Blackboard, and existing drafts.
2. Treat `HOLD` items as unconfirmed. Do not publicly name them as booked acts.
3. Use reverse prompts to ask which facts and calls to action are approved.
4. Create a draft through `/api/v1/state` with `type: marketing_generate`.
5. Post a summary and draft reference to the `MARKETING` Blackboard lane.
6. Wait for human approval. The agent never publishes, schedules, buys media, or promises outcomes.

Draft creation is not evidence of distribution or audience response.
