# Working in this repository

This is a monorepo of tools for documenting software architecture with LikeC4.

## Where things live

- `template/`: the architecture repository that users copy. It is a self-contained npm project: its own `package.json`, lockfile, workflows and `AGENTS.md`. Everything in it ships to users. It is not part of the pnpm workspace.
- `packages/create-architecture-model/`: the `npm create @architecture-model` generator, published as `@architecture-model/create`. It copies `template/` and writes the project's name and description over the placeholders in `model/model.c4` and `astro.config.mjs`. `pnpm pack` bundles a copy of the template into the package.
- `plugin/`: a Claude Code plugin. Skills are in `plugin/skills/<name>/SKILL.md`.
- `.claude-plugin/marketplace.json`: makes this repository a plugin marketplace that offers `plugin/`.
- `addons/`: optional features for the template, one npm package per folder. Each is an Astro integration that a user adds with `astro add`; the template does not depend on any of them.
- `site/`: the toolkit's documentation site, deployed to GitHub Pages. It is a repository made by the generator with the editable-metadata addon added, and its model describes the toolkit. Like `template/`, it is a self-contained npm project outside the pnpm workspace.
- `.github/workflows/`: CI, releases and the site deployment for this repository. The workflows under `template/.github/` are for users' repositories and do not run here.

## Tooling

- pnpm workspaces cover `packages/*` and `addons/*`. Use `pnpm`, not `npm`, everywhere except inside `template/`.
- Turborepo runs the `build` and `test` scripts of the workspace packages: `pnpm build`, `pnpm test`, or `pnpm turbo run test --filter <package>` for one.
- Changesets versions and publishes the packages. See `.changeset/README.md`.

## Rules

- When working inside `template/` or `site/`, follow its `AGENTS.md` and run commands from that folder.
- When a package, addon or skill changes what users do, update the matching page in `site/src/content/docs/` and, if its metadata changes, its element in `site/model/model.c4`.
- Keep the template free of references to this monorepo: a copy of `template/` must work on its own.
- The generator finds its placeholders by exact text. When changing the main system's title or description or the site title in the template, update the replacements in `packages/create-architecture-model/index.js`.
- A change to a published package needs a changeset: run `pnpm changeset` and commit the file. The generator ships the template, so a change to `template/` needs a changeset for `@architecture-model/create`. The plugin is not published to npm and needs none.
- An addon must work from its published files alone. Before finishing a change to one, pack it with `pnpm pack`, install the tarball into a project made by the generator, and run that project's `npm run build`.
- When an addon is added, removed or renamed, update the addons table in `README.md`.
- The pages under `site/src/content/docs/modeling/` publish the rules of the `c4-modeling` skill. When one changes, change the other to match.
- When a skill is added, removed or renamed, update the skills table in `README.md` and bump `version` in `plugin/.claude-plugin/plugin.json`.
- A skill ends with a References section listing the sources its rules come from. When you add a rule, add its source; when a rule rests on memory rather than a source you checked, say so.
- arc42 (by Gernot Starke and Peter Hruschka) and its Q42 quality model (by Gernot Starke) are licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Link to them and paraphrase in your own words, and where the template, a skill or the site builds on one of their ideas, such as ranked quality goals with scenarios, credit the source with its authors and license next to it, or, for something copied into every new page such as the template's system page outline, once in the README. Copy their text into the template, a skill or the site only with credit to the authors, a link to the license, a note of what changed, and the copied part kept under CC BY-SA 4.0.

## Writing

Documentation, skills and READMEs say things precisely and plainly: who does what to what. Plain colloquial words are fine; a metaphor, slogan or poetic phrase that a reader has to translate back into what happens ("find knowledge that left") is not. A page's title names the job the reader comes to it to do ("Find systems whose people have left", "Model who knows and manages each system"); a heading names what its section is about. A page about part of the model starts with the questions that part lets the model answer.

## Before finishing

For a change to the template, run from `template/` and fix anything reported:

    npm run validate
    npm test
    npm run build

For a change to the site, the same commands from `site/`.

For a change to the template or a package, from the repository root:

    pnpm test

For a change to the plugin or the marketplace:

    claude plugin validate .
