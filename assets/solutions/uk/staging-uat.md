# Staging & UAT

Isolated copies of production where QA and acceptance can break things safely.

Fibe staging environments are full clones of your production setup — same services, same wiring, same shape — but with their own data, their own URLs, and their own blast radius. Nobody has to ask "is this *the* staging?" because each one is named, owned, and disposable.

## What it looks like

- A staging copy of every service that mirrors production behavior
- Seeded with synthetic data or a sanitized snapshot of prod
- Public URL you can hand to a customer, a tester, or a CEO
- Reset to a known state with one command

## When to pick it

- Regulated industries that require formal UAT
- A QA team that wants to break things on purpose
- Stakeholders who need to click around before sign-off
- Anyone tired of "but it worked in dev"

## What it isn't

It's not just a `--env=staging` flag. It's a full environment with its own database, its own queues, its own secrets — wired together by Fibe so nothing leaks back to production.
