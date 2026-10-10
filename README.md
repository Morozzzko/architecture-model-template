# Architecture model toolkit

A template repository for documenting software architecture: a [LikeC4](https://likec4.dev/) model, and a documentation site generated from it.

The site is built with [Astro Starlight](https://starlight.astro.build/). It holds an [arc42](https://arc42.org/) document and Architecture Decision Records, with interactive diagrams and tables that are derived from the model, so they stay in step with it.

## Quick start

You need Node 24 (see `.nvmrc`). After creating a repo from this template:

```bash
./setup
npm install
npm run dev
```

`./setup` renames the placeholder elements and the site title. The site is then at http://localhost:4321.

## Commands

* `npm run dev` – serve the site locally with live reload
* `npm run build` – build the static site into `dist/`
* `npm run validate` – check the model for errors and formatting
* `npm run export -- json -o output/model.json` – export the model; `npx likec4 export --help` lists formats
* `bin/adr new <title>` – create an Architecture Decision Record (requires [adr-tools](https://github.com/npryce/adr-tools): `brew install adr-tools`)

PNG export needs Playwright, which is not installed by default; `likec4` prints the install command when you ask for it.

## Layout

```
.
├── model
│   └── model.c4            # the architecture model
├── src
│   ├── content/docs        # documentation pages (MDX)
│   ├── components          # components that render the model
│   └── lib/model.ts        # loads the model at build time
├── docs
│   └── decisions           # ADRs, plain adr-tools markdown
└── astro.config.mjs
```

## Using the model in documentation

Pages are MDX and can render the model directly:

```mdx
import LikeC4View from '../../components/LikeC4View.astro'
import Elements from '../../components/Elements.astro'
import Relationships from '../../components/Relationships.astro'

<LikeC4View viewId="context" />

<Elements of="system" kind="container" />

<Relationships of="system" />
```

* `LikeC4View` embeds an interactive view by its id.
* `Elements` lists elements, optionally limited to the descendants of one element (`of`) and to one kind (`kind`).
* `Relationships` lists the relationships into and out of an element and its descendants.

The build fails if a page references an element, kind or view that the model doesn't have.

To derive something else from the model, add a component in `src/components/` that imports `model` from `src/lib/model.ts`. See the [LikeC4 model API](https://likec4.dev/tooling/model-api/).

## Architecture Decision Records

ADRs live in `docs/decisions/` and are managed with adr-tools through `bin/adr`. Each one appears in the site's sidebar under Decisions; restart `npm run dev` after adding one, because the list is read at startup. Keep them free of frontmatter: adr-tools reads an ADR's title from the first line of the file.

## Querying the model

`.mcp.json` registers the [LikeC4 MCP server](https://likec4.dev/tooling/mcp/), so AI tooling opened in this repository can search elements, trace relationships and read views. The [LikeC4 VS Code extension](https://marketplace.visualstudio.com/items?itemName=likec4.likec4-vscode) provides the same server, plus live previews and validation while editing.

`AGENTS.md` tells coding agents how to work in the repository.

## Deploying

`.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages. Enable Pages for the repository with "GitHub Actions" as the source, then run the workflow from the Actions tab.

To deploy on each push to `main`, uncomment these lines in the workflow:

```yaml
  # push:
  #   branches:
  #     - main
```

## License and considerations

This code is licensed under the [MIT license](LICENSE).

However, this repository distributes and incorporates other people's works.

### arc42

This repository contains a derivative of the [arc42](https://arc42.org/download#file-based-formats) template at `src/content/docs/arc42.mdx`.

Modifications:

* Removed images, config and root file
* Converted to a single MDX page, with headings shifted one level down
* Added embedded diagrams and tables generated from the model

This content is licensed under [Creative Commons Attribution-ShareAlike 4.0 International License.](https://github.com/arc42/arc42-template/blob/master/LICENSE.txt)
