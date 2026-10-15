# Working in this repository

This repository is an architecture model and the documentation site generated from it.

## Where things live

- `model/model.c4`: the LikeC4 model. It is the source of truth for elements, relationships and views.
- `model/conventions.md`: how this repository settled modeling questions the rules below leave open.
- `src/content/docs/`: documentation pages (MDX). `arc42.mdx` follows the arc42 structure.
- `docs/decisions/`: Architecture Decision Records, plain adr-tools markdown.
- `src/components/`: components that render the model inside pages.

## Rules

- Describe elements in the model, not in prose. Titles, descriptions, technology and tags belong in `model/model.c4`; pages pull them in through components.
- To show model content in a page, use the existing components:
  - `<LikeC4View viewId="..." />` for an interactive diagram.
  - `<Elements of="..." kind="..." />` for a table of elements.
  - `<Relationships of="..." />` for a table of an element's relationships.
  - `<Decisions />` for a table of the ADRs with their status and date.
- For derived content those don't cover, add a component in `src/components/` that imports `model` from `src/lib/model.ts`. It runs at build time.
- Query the model through the `likec4` MCP server rather than reading `.c4` files by hand.
- Create ADRs with `bin/adr new <title>`. Do not add frontmatter to ADR files; adr-tools reads the title from the first line.
- LikeC4 strings use single quotes. Tags come first in an element body and must be declared in `specification`.

## Modeling

The model follows the C4 model (c4model.com).

- Read `model/conventions.md` before modeling; its answers win. When you settle a case it doesn't cover, add a row to it.
- Ownership and runtime decide what an element is, never size or importance: what another team or company owns is an `external` system with no internals; what this team builds and deploys together is a `system`; each process or data store of it that must run is a `container`. Domains, bounded contexts and libraries are not elements.
- One container per database schema, bucket or topic with its own purpose, not one per server or cluster. Servers, clusters and which provider serves which environment belong in a `deployment` block.
- Every element has a description, and every container a `technology`.
- Every relationship goes one way and has a label that reads in that direction (`'Submits orders to'`, never `'Uses'`). Relationships between containers name the protocol in `technology`.
- An external service that every container uses, such as observability, is related once, from the system.

## Before finishing

Run both and fix anything they report:

    npm run validate
    npm run build

A build failure naming an unknown element, kind or view means a page references something the model no longer has.
