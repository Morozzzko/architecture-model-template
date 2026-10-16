---
name: c4-modeling
description: Use when adding, changing or reviewing elements, relationships or views in a LikeC4 architecture model, or when asked whether something is a software system, container or component, or how to model a database, S3 bucket, queue or topic, external service, interchangeable provider such as blockchain RPC or observability, or an environment.
---

# C4 modeling

Follow the C4 model as defined at c4model.com. Every element sits at exactly one level, and every choice of level is answered by a fixed question, so the same thing gets the same answer every time.

## Before deciding anything

Read `model/conventions.md` if it exists. It holds this repository's settled answers, and they win over everything below. When a case is not covered there or here, decide it with the questions below and add the decision to `model/conventions.md` (create it, one line per case: the case, the answer, why).

## Which element is it

Ask in order and stop at the first yes. Name the question in your answer, e.g. "a container: it runs as its own process (5)".

| # | Question | Model it as |
| --- | --- | --- |
| 1 | Is it a person or role? | actor |
| 2 | Is it owned by another team or company, or used without being configured by us? | external software system, with no internals |
| 3 | Is it a domain, bounded context, capability, squad or tribe? | not an element: a tag, metadata or a group in a view |
| 4 | Is it what one team builds, owns and usually deploys together? | software system |
| 5 | Must it run, or hold data, for that system to work: a separate process (web app, SPA, mobile app, function, job) or a store we own, hosted or not? | container |
| 6 | Is it functionality behind an interface inside one process? | component |
| 7 | Is it a library, package, module or Docker image? | not an element: put it in `technology` or a link |

External systems use an `external` element kind. If `specification` has none, add it:

```
element external {
  style {
    color muted
  }
}
```

Size and importance never decide the level; ownership and runtime do. Microservices owned by one team are containers of one system; once separate teams own them, each is a system.

## Recurring cases

- **Database:** one container per schema or store with its own purpose, inside the system that owns it. `technology 'PostgreSQL schema'`. The database server is infrastructure: it appears only in deployment.
- **S3 bucket, blob store, CDN:** a container per bucket with its own purpose, `technology 'S3 bucket'`. "S3" itself is never an element.
- **Queue or topic:** a container per queue or topic when its ownership matters, `technology 'Kafka topic'`; otherwise name it on the relationship. Never one box for "the message bus". Messages use an `async` relationship kind.
- **Interchangeable provider** (blockchain RPC, observability, email): one external system named for the role, `rpc = external 'Blockchain RPC'`; providers go in its `technology` or metadata. Which provider serves which environment, including a primary and a failover, is deployment. Model each provider as its own system only when readers ask about that provider itself: its contract, its outages, where it keeps data.
- **Cross-cutting infrastructure** (observability, logging, feature flags): one external system named for the role with the vendor as its `technology`, e.g. `observability = external 'Observability' { technology 'Datadog' }`. Relate it once, from the system, not with an arrow from every container. Per-container detail goes in metadata.
- **Shared infrastructure** (a cluster, a database server several teams use): deployment only.

## Writing elements and relationships

- Every element has a description saying what it does; every container and component has a `technology`.
- Every relationship goes one way and has a label that reads in that direction: `'Submits orders to'`, never `'Uses'`.
- Relationships between containers name the protocol: `technology 'HTTPS/JSON'`.
- A two-way exchange is two relationships, each with its own label.

## Views

- Context and container views are enough for most systems. Add a component view only when a container's insides are discussed often, and a dynamic view for one important flow.
- Every view title names its type and scope: `'Shop: containers'`.
- One environment per deployment view.
- Colours, shapes and line styles mean the same in every view; give them meaning in `specification`, not per view.

## Environments and deployment

When something varies by environment or is about infrastructure (regions, clusters, replicas, which provider runs where), it belongs in the deployment model. See `deployment.md` in this skill.

## System pages

Every `system` in the model has a page, `src/content/docs/systems/<id>.mdx`, following the outline of the starter page. When you add a system, add its page; when you rename one, rename its page. Fill in what the model says through components, and leave the why sections (purpose, quality goals, key concepts, principles) for the people who know: ask them, or use the `quality-goals` skill for the goals.

## Finish

```bash
npm run validate
npm run build
```

Then check each changed view: does every element and relationship pass the rules above?
