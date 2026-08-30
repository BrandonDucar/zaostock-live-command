# Agent Runtime Model

ZAOstock Live Command has two separate layers:

- **Backend command layer:** Cloudflare Pages Functions plus D1 own shared state, policy, attribution, the Blackboard, and deterministic event coordination.
- **Optional agent clients:** Hermes, Zoe, Zaal, Codex, OpenClaw, a shell script, or any HTTP-capable runtime may connect with a scoped bearer token.

ZAO does not need to install Hermes on a desktop to use the application. A local Hermes install is useful only if ZAO wants a private always-on process with local files or tools. It is not required for team members, administrators, or external agents to use the hosted product.

The backend currently provides coordination and deterministic reverse prompts; it does not claim an always-running general-purpose LLM. External cognition remains replaceable behind the public contract.
