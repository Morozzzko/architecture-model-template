# Architecture model

Documentation of an organization's software architecture: a [LikeC4](https://likec4.dev/) model of its systems, and a documentation site generated from it.

The site is built with [Astro Starlight](https://starlight.astro.build/). It has an overview of all systems, a page per system that says why it exists and what it is made of, and Architecture Decision Records. Its diagrams and tables are derived from the model, so they stay in step with it.

## Quick start

You need Node 24 (see `.nvmrc`).

```bash
npm install
npm run dev
```

The site is then at http://localhost:4321.

## Commands

* `npm run dev` – serve the site locally with live reload
* `npm run build` – build the static site into `dist/`, with LikeC4's diagram viewer at `dist/diagrams/`
* `npm run preview` – serve the built site, including the diagram viewer, which `npm run dev` doesn't serve
* `npm test` – test the scripts in `bin/`
* `npm run validate` – check the model for errors and formatting
* `npm run export -- json -o output/model.json` – export the model; `npx likec4 export --help` lists formats
* `bin/adr new <title>` – create an Architecture Decision Record (requires [adr-tools](https://github.com/npryce/adr-tools): `brew install adr-tools`)

PNG export needs Playwright, which is not installed by default; `likec4` prints the install command when you ask for it.

## Layout

```
.
├── model
│   ├── model.c4            # the architecture model
│   └── conventions.md      # how this repository settled modeling questions
├── src
│   ├── content/docs        # documentation pages (MDX)
│   │   └── systems         # one page per system
│   ├── components          # components that render the model
│   └── lib/model.ts        # loads the model at build time
├── docs
│   ├── decisions           # ADRs, plain adr-tools markdown
│   └── questions           # each system's open questions, created on first use, not published
├── bin
│   ├── adr                 # adr-tools wrapper
│   └── add-documentation-link.js  # adds a link back to the docs to the diagram viewer
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
* `Systems` lists every system with a link to its page.

The build fails if a page references an element, kind or view that the model doesn't have, or if a system has no page.

## System pages

Each software system in the model has a page in `src/content/docs/systems/`, named after its element id. `systems/system.mdx` is the outline: why the system exists (purpose, quality goals and scenarios, key concepts), then what it's made of (views and tables from the model), then its principles, decisions and direction. The prose explains why; the model says what.

To derive something else from the model, add a component in `src/components/` that imports `model` from `src/lib/model.ts`. See the [LikeC4 model API](https://likec4.dev/tooling/model-api/).

## Architecture Decision Records

ADRs live in `docs/decisions/` and are managed with adr-tools through `bin/adr`. Each one appears in the site's sidebar under Decisions, and `<Decisions />` renders a table of them with status and date on any page. Keep them free of frontmatter: adr-tools reads an ADR's title from the first line of the file.

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

## License

This code is licensed under the [MIT license](LICENSE).

The Quality goals and Quality scenarios sections of a system page build on the idea of ranked quality goals with scenarios from [arc42](https://arc42.org/), by Gernot Starke and Peter Hruschka, licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The wording here is this template's own; no arc42 text is copied.
