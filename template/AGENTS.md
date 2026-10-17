# Working in this repository

This repository is an architecture model of an organization's systems and the documentation site generated from it. It says why each system exists and what parts it has.

## Where things live

- `model/model.c4`: the LikeC4 model. It is the source of truth for elements, relationships and views.
- `model/conventions.md`: how this repository settled modeling questions the rules below leave open.
- `src/content/docs/`: documentation pages (MDX). `index.mdx` is the overview of all systems.
- `src/content/docs/systems/`: one page per software system in the model, named after its element id (`systems/payments.mdx` for `payments`). Every page has the same sections, in this order: Purpose, Quality goals, Quality scenarios, Key concepts, Context, Containers, Key flows, Principles and decisions, Where it's heading. Why the system exists is prose; what it is made of comes from the model through components. Each section starts with an italic placeholder line, which stays until the section's main point is written, and comes back if the section is emptied:
  - Purpose: *Why the system exists, who depends on it, and what each of them needs from it.*
  - Quality goals: *The three qualities the system is optimized for, in order, each with who needs it and why. When two conflict, the higher one wins.*
  - Quality scenarios: *For each goal, a check: when \<event\> under \<conditions\>, the system \<response\> within \<measure\>.*
  - Key concepts: *The few ideas the system is built around, which explain the structure below.*
  - Context: *Who uses the system and which systems it talks to, with who owns each.*
  - Containers: *The apps, jobs and data stores the system runs, and why it is split this way.*
  - Key flows: *The one or two flows people ask about most, step by step.*
  - Principles and decisions: *The principles behind the structure above, with links to the decisions in `docs/decisions/` that record them.*
  - Where it's heading: *What is being added, replaced or retired, and why.*

  The starter page `systems/system.mdx` describes the sample "Software System"; rename it for the first real system.
- `docs/decisions/`: Architecture Decision Records, plain adr-tools markdown.
- `docs/questions/<id>.md`: a system's open questions, one table row each (question, section, who might know, date asked). Not published. A question nobody could answer goes here, never into a page; when it is answered, write the answer where it belongs and remove the row.
- `src/components/`: components that render the model inside pages.

## Rules

- Describe elements in the model, not in prose. Titles, descriptions, technology and tags belong in `model/model.c4`; pages pull them in through components.
- To show model content in a page, use the existing components:
  - `<LikeC4View viewId="..." />` for an interactive diagram.
  - `<Elements of="..." kind="..." />` for a table of elements.
  - `<Relationships of="..." />` for a table of an element's relationships.
  - `<Decisions />` for a table of the ADRs with their status and date.
  - `<Systems />` for a table of all systems with links to their pages.
- When you add a system to the model, add its page. The build fails while a system has none.
- A system page's prose explains why; it never restates what the model already says.
- For derived content those don't cover, add a component in `src/components/` that imports `model` from `src/lib/model.ts`. It runs at build time.
- Query the model through the `likec4` MCP server rather than reading `.c4` files by hand.
- Create ADRs with `bin/adr new <title>`. Do not add frontmatter to ADR files; adr-tools reads the title from the first line.
- LikeC4 strings use single quotes. Tags come first in an element body and must be declared in `specification`.

## Modeling

The model follows the C4 model (c4model.com).

- Read `model/conventions.md` before modeling; its answers win. When you settle a case it doesn't cover, add a row to it.
- Ownership and runtime decide what an element is, never size or importance: what another team or company owns is an `external` system with no internals; what one team builds and deploys together is a `system`; each process or data store of it that must run is a `container`. Domains, bounded contexts and libraries are not elements.
- One container per database schema, bucket or topic with its own purpose, not one per server or cluster. Servers, clusters and which provider serves which environment belong in a `deployment` block.
- Every element has a description, and every container a `technology`: what it is built with, not how it is deployed. While nobody knows a container's technology, leave it out and keep the question in the system's questions file.
- Name views after their system (`paymentsContext`, `paymentsContainers`) so systems can't clash.
- Who owns a system goes in its metadata as `owner` (`owner 'payments-team'`), for internal and external systems alike.
- Every relationship goes one way and has a label that reads in that direction (`'Submits orders to'`, never `'Uses'`). Relationships between containers name the protocol in `technology`.
- An external service that every container uses, such as observability, is related once, from the system.

## Before finishing

Run these and fix anything they report:

    npm run validate
    npm test
    npm run build

A build failure naming an unknown element, kind or view means a page references something the model no longer has.
