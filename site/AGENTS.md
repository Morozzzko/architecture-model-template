# Working in this repository

This repository is an architecture model and the documentation site generated from it.

## Where things live

- `model/model.c4`: the LikeC4 model. It is the source of truth for elements, relationships and views.
- `src/content/docs/`: documentation pages (MDX).
- `model/metadata.json`: the types of element metadata keys, for the editable-metadata addon.
- `examples/shop/`: a separate LikeC4 project, the example shop that the Modeling pages draw with `<ExampleView viewId="..." />`. It must follow the rules those pages state, and code they quote from it must match it.
- `docs/decisions/`: Architecture Decision Records, plain adr-tools markdown.
- `src/components/`: components that render the model inside pages.

## Rules

- Describe elements in the model, not in prose. Titles, descriptions, technology and tags belong in `model/model.c4`; pages pull them in through components.
- To show model content in a page, use the existing components:
  - `<LikeC4View viewId="..." />` for an interactive diagram of the toolkit's model.
  - `<Elements of="..." kind="..." />` for a table of elements.
  - `<Relationships of="..." />` for a table of an element's relationships.
  - `<Decisions />` for a table of the ADRs with their status and date.
  - `<Metadata of="..." name="..." />` from `@architecture-model/editable-metadata/Metadata.astro` for one metadata value of an element.
  - `<MetadataTable of="..." kind="..." keys={{ key: 'Column' }} />` for a table of metadata, one row per element of that kind.
- For derived content those don't cover, add a component in `src/components/` that imports `model` from `src/lib/model.ts`. It runs at build time.
- Query the model through the `likec4` MCP server rather than reading `.c4` files by hand.
- Create ADRs with `bin/adr new <title>`. Do not add frontmatter to ADR files; adr-tools reads the title from the first line.
- LikeC4 strings use single quotes. Tags come first in an element body and must be declared in `specification`.

## Before finishing

Run these and fix anything they report:

    npm run validate
    npm test
    npm run build

A build failure naming an unknown element, kind or view means a page references something the model no longer has.
