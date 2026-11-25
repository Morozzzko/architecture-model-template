---
name: context-mapping
description: Use when discovering or documenting bounded contexts, conflicting domain language, upstream and downstream dependencies, integration patterns between teams, or which LikeC4 elements implement each domain context.
---

# Context mapping

Map the models and relationships that exist now across the organization. Do not redesign them during discovery: proposed boundaries and migrations belong under **Where it's heading** on affected system pages and in ADRs.

The context map answers:

- Where does one domain model and language stop and another begin?
- Whose model influences an integration, and how does the other side protect or conform itself?
- Which LikeC4 elements implement each context?
- Which boundary-changing questions still need another person?

## Start or resume

1. Read `src/content/docs/contexts.mdx` when it exists, the involved system pages and model elements, and `model/metadata.json`. Inspect top-level files under `docs/questions/` whose name equals `contexts.md` ignoring case before reading the reserved lowercase path as the context backlog; preserve and move system-question rows as [model.md](model.md) directs.
2. If there are open context questions, ask which have been answered. Write each answer into the page or model and remove its row.
3. Name the systems and teams in scope. A context map can describe several models inside one system or span several systems. A participant can confirm only what they know; record another team's side as a question until someone from that team confirms it.
4. Ask one topic at a time. Stop when the confirmed map is useful; it does not need to cover the whole organization in one session.

## Discover the current contexts

Use the participant's language and evidence in the existing pages, model and repositories. Ask only what is not already answered.

1. **Outcomes and decisions.** What business outcome does this area produce, and which rules or decisions belong together?
2. **Language boundaries.** Which important words mean different things to different teams? For each meaning, ask who uses it and where it applies.
3. **Authority.** Which context is authoritative for each important fact or decision? Data storage alone does not establish authority.
4. **Change and ownership.** Which model can change independently, who changes it, and which other teams must coordinate when it changes?
5. **Points of contact.** What crosses each boundary, in which direction, and where is it translated?

Summarize each candidate context with its purpose, owner and distinctive language. Ask the participant to confirm or correct it before writing it. Never turn a team, service or database into a bounded context merely because it is separately owned or deployed.

## Write confirmed results

Before naming relationships or writing files, read [model.md](model.md) completely. It defines the allowed relationship combinations, page and metadata shapes, placement rules, and the actionable question backlog.

Write only what a participant confirmed. When an unanswered question could change a boundary or relationship, add it to the private backlog with why it matters and who can answer; do not publish it or invent an answer.

## Finish

Run `npm run validate`, `npm test` and `npm run build`. `MetadataElements` makes the build fail when `implementsContext` uses an identifier missing from the configured options. A configured context with no implementation is valid and remains visible through its empty-state text.

## References

- Bounded Context, Context Map and the relationship patterns: Eric Evans, [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Which relationship roles can be combined: [Context Mapper language semantics](https://contextmapper.org/docs/language-model/)
- Why bounded contexts are not another C4 abstraction level: Simon Brown, [C4 model abstractions FAQ](https://c4model.com/abstractions/faq)
- The page, metadata, navigation and private-question file shapes are this toolkit's own design.
