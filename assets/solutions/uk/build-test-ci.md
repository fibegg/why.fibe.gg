# Build & test in CI

Full-stack environments wired into your pipeline — not green-box theatre.

Most CI runs prove your code compiles. Fibe CI runs prove your *system* works: every PR spins up a real environment with real services, runs your tests against it, and tears it down when it's done. The green check on your PR actually means something.

## What it looks like

- Each PR gets its own ephemeral stack — same shape as production
- Tests run against the real services, not mocks
- Failed runs leave the environment around for 30 minutes so you can poke at it
- A web URL is posted to the PR so reviewers can click

## What changes

- Bugs that only show up "in prod" surface in CI instead
- Integration tests stop being aspirational
- Reviewers can *use* the change before approving it

## When to pick it

If your test suite passes but your deploys still scare you, this is the layer you're missing.
