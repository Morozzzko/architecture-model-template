# Architecture model toolkit

Tools for documenting software architecture as a [LikeC4](https://likec4.dev/) model with a documentation site generated from it.

| Folder | What it is |
| --- | --- |
| [`template/`](template/) | A ready-to-use architecture repository: model, [Astro Starlight](https://starlight.astro.build/) site, [arc42](https://arc42.org/) document and Architecture Decision Records |
| [`packages/create-architecture-model/`](packages/create-architecture-model/) | The `npm create @architecture-model` generator, which copies the template and sets it up |
| [`plugin/`](plugin/) | A [Claude Code](https://claude.com/claude-code) plugin with skills for working in such a repository |
| [`addons/`](addons/) | Optional features for the template, published as npm packages |

## Start a new architecture repository

You need Node 24.

```bash
npm create @architecture-model my-architecture
cd my-architecture
npm run dev
```

The generator asks for a name and an optional description, writes them into the model and the site, installs dependencies and initialises a git repository. The site is then at http://localhost:4321.

Options go after `--`: `--yes` skips the questions and names the project after the directory, `--no-install` and `--no-git` skip those steps.

[`template/README.md`](template/README.md) describes the result and becomes the README of your repository.

## Install the skills

In Claude Code:

```
/plugin marketplace add Morozzzko/architecture-model-template
/plugin install architecture-model@architecture-model
```

| Skill | Use |
| --- | --- |
| `new-architecture-repo` | Scaffold a new repository from the template |
| `metadata-fields` | Define, set and show element metadata with the editable-metadata addon |

## Addons

Addons are npm packages that add a feature to a repository made from the template.

| Addon | What it adds |
| --- | --- |
| [`@architecture-model/editable-metadata`](addons/editable-metadata/) | Element metadata in pages, click-to-edit in the dev server and saved back to the model |

Install one from inside your architecture repository:

```bash
npx astro add @architecture-model/editable-metadata
```

## Working on this repository

The template is a self-contained project with its own lockfile, so run its commands from `template/`:

```bash
cd template
npm install
npm run validate
npm run build
```

Everything under `packages/` and `addons/` is a [pnpm](https://pnpm.io/) workspace, with [Turborepo](https://turborepo.dev/) running the tasks:

```bash
pnpm install
pnpm build
pnpm test
```

The generator copies `template/` when run from this repository, and a bundled copy when published:

```bash
node packages/create-architecture-model/index.js /tmp/my-architecture
```

CI runs both sets of commands on every pull request.

### Releasing

Packages are versioned and published with [Changesets](https://github.com/changesets/changesets). A change to a published package comes with a changeset, created by `pnpm changeset`. Merging to `main` opens a "Version Packages" pull request; merging that one publishes to npm. Publishing needs an `NPM_TOKEN` repository secret.

## License

This code is licensed under the [MIT license](LICENSE). The template contains a derivative of the arc42 template under a different license; see [`template/README.md`](template/README.md#license-and-considerations).
