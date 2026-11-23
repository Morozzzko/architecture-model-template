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

For a directional relationship, choose Customer–Supplier or Upstream–Downstream and add every confirmed upstream role. Add either Conformist or Anticorruption Layer when one is confirmed downstream; never add both. Partnership and Shared Kernel are symmetric relationships and take no directional roles.

## Page

Create `src/content/docs/contexts.mdx` when the first context is confirmed. Start with the questions the map answers, then include:

1. A table of confirmed relationships: contexts, relationship and direction, confirmed roles, what crosses the boundary, and where translation happens. Write a directional relationship as `Orders upstream → Fulfilment downstream (Customer–Supplier)` and attribute each role to its context. Write a symmetric relationship as `Orders ↔ Inventory (Partnership)` with no directional roles.
2. One `##` section per context, with its purpose, owner, terms whose meanings differ from neighbouring contexts, and confirmed relationships.
3. An implementation table under each context:

```mdx
import MetadataElements from '@architecture-model/editable-metadata/MetadataElements.astro'

<MetadataElements name="implementsContext" value="orders" empty="No software element is mapped to this context." />
```

This requires the `@architecture-model/editable-metadata` addon. If `astro.config.mjs` does not use it, install it with `npx astro add @architecture-model/editable-metadata`.

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

Create `docs/questions/contexts.md` only when an unanswered question could change a boundary or relationship. Keep it unpublished and use this exact shape:

```markdown
# Open questions: Context map

| Question | Why it matters | Contexts affected | Who can answer | Asked |
| --- | --- | --- | --- | --- |
| Which service owns the canonical order state? | Determines whether Fulfilment is downstream of Orders | Orders, Fulfilment | Orders team | 2026-11-23 |
```

Do not add questions the repository can answer, vague research tasks, or optional detail. Ask who can answer from the people and teams already mentioned. At the next session, resolve these first, update the map, and remove the rows. Delete the file when no rows remain.
