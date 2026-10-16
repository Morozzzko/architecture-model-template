---
name: new-architecture-repo
description: Use when the user wants to start documenting a system's architecture in a new repository or folder - a LikeC4 model with a generated documentation site, a page per system and ADRs - and no such repository exists yet.
---

# New architecture repository

Use the `@architecture-model/create` generator. Do not clone `Morozzzko/architecture-model-template`: it is a monorepo, and only its template belongs in the user's project.

## Steps

1. Ask for anything not already given: the target directory and the name of the system. A one-line description is optional.

2. Run the generator. The target directory must not exist or must be empty. It reads two answers from standard input: the name, then the description.

   ```bash
   printf '%s\n' '<name>' '<description>' | npm create @architecture-model <dir>
   ```

   An empty line takes the default: the directory's name, and no description. The generator installs dependencies and initialises a git repository, unless `<dir>` is already inside one.

3. Check the result, from `<dir>`. Node 24 is required (see `.nvmrc`).

   ```bash
   npm run validate
   npm run build
   ```

4. Commit only if the user asks.

## After scaffolding

`AGENTS.md` in the new repository says how to work in it: where the model, pages and ADRs live, and which components render the model. Read it before changing anything.

Tell the user that `npm run dev` serves the site at http://localhost:4321 and that `.github/workflows/deploy.yml` publishes it to GitHub Pages once Pages is enabled with "GitHub Actions" as the source.
