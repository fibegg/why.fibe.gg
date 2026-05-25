# Production deployment

Run live workloads with zero-downtime updates and a quiet pager.

Fibe gives every service the same simple deploy contract: push to your main branch and the next version is live, with health checks, rolling updates, and a rollback that takes under thirty seconds. No bespoke release script per project. No "the deploy person is on vacation" outage.

## What it looks like

- A single `fibe deploy` (or just a git push) per service
- Health checks gate traffic — a broken build never sees a user
- One-click rollback to the previous release
- Logs, metrics, and traces stitched together by request

## When to pick it

If you're shipping a real product to real users and you want uptime to be a property of the system, not a story you tell each other after the incident.

> "Boring" is exactly what production should feel like.
