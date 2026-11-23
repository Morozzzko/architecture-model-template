# Context map format

## Relationship names

Record a relationship and its applicable roles only after the concrete coordination and translation behavior is confirmed:

| Kind | Name | Use when |
| --- | --- | --- |
| Relationship | Partnership | Both contexts' delivery succeeds or fails together and the teams coordinate planning and integration. |
| Relationship | Shared Kernel | The contexts deliberately share a small part of their model and its code or database design, changed by agreement. |
| Relationship | Customer–Supplier | The downstream's priorities are part of the upstream's planning commitments. |
| Relationship | Upstream–Downstream | The upstream influences the downstream, without the customer commitment above. |
| Downstream role | Conformist | The downstream adopts the upstream model instead of translating it. |
| Downstream role | Anticorruption Layer | The downstream translates the upstream model into its own model. |
| Upstream role | Open Host Service | The upstream exposes one general service for several consumers. |
| Upstream role | Published Language | The upstream and its consumers exchange a documented common language. |

The allowed roles depend on the relationship:

- Upstream–Downstream can have Open Host Service, Published Language, both or neither upstream, and Conformist, Anticorruption Layer or neither downstream. Never record both downstream roles.
- Customer–Supplier can have Published Language upstream. It cannot have Open Host Service or Conformist. Anticorruption Layer is allowed but unusual; record it only after confirming that the customer really translates the supplier's model despite influencing its priorities.
- Partnership and Shared Kernel are symmetric and take no directional roles.

## Page

Create `src/content/docs/contexts.mdx` when the first context is confirmed. When creating it, add `{ label: 'Bounded contexts', link: '/contexts/' }` to the existing Starlight sidebar or use the repository's equivalent navigation mechanism. Start the page with the questions the map answers, then include:

1. A table of confirmed relationships: contexts, relationship and direction, confirmed roles, what crosses the boundary, and where translation happens. Write a directional relationship as `Orders upstream → Fulfilment downstream (Customer–Supplier)` and attribute each role to its context. Write a symmetric relationship as `Orders ↔ Inventory (Partnership)` with no directional roles.
2. One `##` section per context, with its purpose, owner, terms whose meanings differ from neighbouring contexts, and confirmed relationships.
3. An implementation table under each context:

```mdx
import MetadataElements from '@architecture-model/editable-metadata/MetadataElements.astro'

<MetadataElements name="implementsContext" value="orders" empty="No software element is mapped to this context." />
```

This requires `@architecture-model/editable-metadata` 0.6.0 or later. Check that `node_modules/@architecture-model/editable-metadata/package.json` exports `./MetadataElements.astro`. If `astro.config.mjs` does not use the integration, install the latest release with `npx astro add @architecture-model/editable-metadata@latest`. If the integration is present but the export is missing, upgrade it with `npm install @architecture-model/editable-metadata@latest` before importing the component.

## Model references

Define context identifiers and page links in `model/metadata.json`:

```json
{
  "implementsContext": {
    "type": "multiselect",
    "options": [
      { "value": "orders", "label": "Orders", "href": "/contexts/#orders" }
    ]
  }
}
```

Set `implementsContext` on a LikeC4 element that directly realizes the context's domain behavior. It is explicit and never inherited:

- Map a system when the whole system implements the context.
- When a system spans contexts, map the relevant containers instead.
- Never map both an element and its descendant to the same context.
- An element may implement several contexts when that is the current architecture; record the resulting coupling as an open question only when it may change a boundary.
- Do not map actors, databases, queues or infrastructure merely because they use or store context data.

Show a system or container's contexts on its page with `<Metadata of="<id>" name="implementsContext" />`; the configured `href` links each label back to the context section.

## Useful open questions

`docs/questions/contexts.md` is reserved for the organization-wide context map. Treat system ids equal to `contexts` ignoring case as reserved. Before using the map path, inspect any top-level question file whose name equals `contexts.md` ignoring case: when its header is `Question | Section | Who might know | Asked`, move its rows to `docs/questions/systems/<original-id>.md`, merging without dropping or duplicating rows when that file already exists. Then create the context backlog only when an unanswered question could change a boundary or relationship. Keep it unpublished and use this exact shape:

```markdown
# Open questions: Context map

| Question | Why it matters | Contexts affected | Who can answer | Asked |
| --- | --- | --- | --- | --- |
| Which service owns the canonical order state? | Determines whether Fulfilment is downstream of Orders | Orders, Fulfilment | Orders team | 2026-11-23 |
```

Do not add questions the repository can answer, vague research tasks, or optional detail. Ask who can answer from the people and teams already mentioned. At the next session, resolve these first, update the map, and remove the rows. Delete the file when no rows remain.
