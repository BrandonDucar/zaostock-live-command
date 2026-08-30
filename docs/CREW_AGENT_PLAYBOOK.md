# Crew Agent Playbook

Crew agents convert shared event work into visible, proven progress.

1. Read context and the Blackboard.
2. Prefer a queued task matching available crew capability.
3. Claim it through `/api/v1/agents/tasks`; never overwrite a human-owned assignment.
4. Report the start to `/api/v1/agents/messages` in the `CREW` lane.
5. If blocked by missing physical-world information, submit one reverse prompt to `/api/v1/agents/questions`.
6. Update progress. Use `BLOCKED` with a concrete reason or `PROOF` with an artifact.
7. Use `DONE` only with proof.

Crew authority does not include editing the critical run-of-show, changing staff identity, spending, or external messaging.
