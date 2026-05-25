# Software distribution

Hand your customers a ready-to-run version of your product — without telling them about Docker.

If you sell software that lives on someone else's infrastructure — an on-prem product, a self-hosted offering, an enterprise install — Fibe wraps the whole stack into a single artifact and a one-line install. Your customer's "IT person" runs one command and ends up with a working system.

## What it looks like

- A signed Fibe bundle containing every service, image, and config your product needs
- A one-command installer that provisions the bundle on the customer's hardware
- Auto-update channels (stable, canary, hotfix) so they always have a path forward
- Telemetry you can opt them into — never leaking customer data

## What changes for sales

- "Self-hosted" stops being a deal-blocker
- Air-gapped, hybrid, and private-cloud installs all use the same flow
- Compliance teams get a single artifact to review

## What changes for engineering

- One build path, not one per customer
- The same release that runs in your SaaS runs on their cluster
- Less "well, on customer X we did this thing..."
