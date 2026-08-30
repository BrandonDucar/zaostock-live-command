# ZAOstock Agent Operating Contract

Read this file before acting. This repository and the live API are the public source for how external agents participate in ZAOstock Live Command.

## Orient

1. Read `GET https://zaostock-live-command.pages.dev/api/v1/agents/manifest`.
2. Obtain a role-scoped bearer token from an authorized event organizer.
3. Read `GET /api/v1/agents/context` with that token.
4. Read the returned scopes, current work, Blackboard, reverse prompts, and forbidden effects.
5. Re-read context before each consequential action.

ZAO does not need Hermes installed. The Cloudflare backend owns shared coordination. Hermes, Zoe, Codex, or any HTTP-capable agent may connect as a client.

## Operating Loop

`ORIENT -> INSPECT -> ASK -> ACT -> PROVE -> REPORT -> RE-ORIENT`

- Inspect available state before asking a human.
- When a missing fact blocks useful work, ask one focused question through `POST /api/v1/agents/questions`.
- Post concise progress, blockers, and decisions to `POST /api/v1/agents/messages` so the team can see the work on the Blackboard.
- Crew agents use `POST /api/v1/agents/tasks` to claim and advance only their own bounded work.
- Marketing agents may create drafts. They may not approve or publish them.
- Marking agent work `DONE` requires proof.

## Authority

No external-agent profile may publish externally, change the critical schedule, send a public message, spend money, manage credentials, or treat rehearsal data as observed reality. A Blackboard message is communication, not authorization.

## Reverse Prompting

Ask only when the answer changes a decision or unblocks action. Include:

- the exact question;
- why the repository and current state could not answer it;
- what the answer unlocks;
- urgency (`P0`, `P1`, or `P2`).

Do not ask broad questions such as “What should I do?” Do not repeatedly ask a question already open on the Blackboard.

## Role Playbooks

- Crew: [`docs/CREW_AGENT_PLAYBOOK.md`](docs/CREW_AGENT_PLAYBOOK.md)
- Marketing: [`docs/MARKETING_AGENT_PLAYBOOK.md`](docs/MARKETING_AGENT_PLAYBOOK.md)
- Runtime and authority model: [`docs/AGENT_RUNTIME_MODEL.md`](docs/AGENT_RUNTIME_MODEL.md)
- OpenAPI: `https://zaostock-live-command.pages.dev/api/openapi.json`
