---
name: model-diff
description: Use when someone wants to compare or diff a LikeC4 architecture model between two states of the same repository, including a Git revision versus the current working tree with uncommitted or untracked model files.
---

# Compare two model states

Export the raw LikeC4 model from two states of one repository, then describe the net architectural change. Work locally and leave the repository untouched.

Compare repository states through the exports below. This workflow does not invoke LikeC4's `diff` command.

## Choose the states

A state is either:

- a Git revision accepted by `git rev-parse`, such as a commit, tag or branch;
- `working tree`, meaning the current `model/` directory, including committed files, tracked modifications and untracked files.

Ask for either state the user has not named. Reject two `working tree` states because they are the same snapshot.

Run `git rev-parse --show-toplevel` and use the returned repository root as the working directory for every command below. Stop if the current repository has no `model/` directory when either state is the working tree.

Resolve every revision with:

```bash
git rev-parse --verify --end-of-options '<revision>^{commit}'
```

Use the returned commit id from then on. Name an invalid revision in the error and stop; never fall back to `HEAD`. Inspect the `model` path at that revision:

```bash
git cat-file -t '<commit>:model'
```

If the command prints `tree`, snapshot and export the model normally. If the path does not exist, mark the revision as an absent model state. That is a valid empty state: it means the model had not been created yet. If the command prints another object type, stop and say that `model` is not a directory at that revision.

Before snapshotting, stop if either model state contains any symlink under `model/`, and name it. Copying or archiving a symlink can change what it resolves to and create a false diff.

## Snapshot without changing the repository

Create one private directory for the comparison:

```bash
mktemp -d
```

Keep both snapshots and exports there. Do not create a branch, checkout a revision, stash files or change the index.

For a revision whose `model` path is a tree, run these as separate commands. Do not create a snapshot directory for an absent model state.

```bash
git archive --format=tar --output='<temporary-directory>/<state>.tar' '<commit>' model
mkdir -p '<temporary-directory>/<state>'
tar -xf '<temporary-directory>/<state>.tar' -C '<temporary-directory>/<state>'
```

For the working tree, run these as separate commands. Copying the directory rather than asking Git for it is what includes modified and untracked model files.

```bash
mkdir -p '<temporary-directory>/<state>/model'
cp -R model/. '<temporary-directory>/<state>/model'
```

Use short filesystem-safe labels such as `before` and `after` for `<state>`, not the user's revision text.

## Export the raw models

Use the repository's installed LikeC4 for both states, so a dependency change between revisions cannot create a false model change. First require the local executable:

```bash
test -x node_modules/.bin/likec4
```

If that fails, stop and ask the user to install the repository's dependencies. Do not let a package runner download LikeC4.

Export each computed model:

```bash
npm exec --no -- likec4 export json '<temporary-directory>/<state>/model' --skip-layout --pretty --outfile '<temporary-directory>/<state>.json'
```

The computed export does not contain authored view rules. Export the parsed model too, using the same installed LikeC4 package. Use explicit disposal so the script works across the repository's supported Node versions:

```bash
node --input-type=module --eval '
import { writeFile } from "node:fs/promises"
import { LikeC4 } from "likec4"
const likec4 = await LikeC4.fromWorkspace(process.argv[1])
try {
  const parsed = await likec4.parsedModel()
  await writeFile(process.argv[2], JSON.stringify(parsed.$data, null, 2) + String.fromCharCode(10))
} finally {
  await likec4.dispose()
}
' '<temporary-directory>/<state>/model' '<temporary-directory>/<state>.parsed.json'
```

For an absent model state, do not invoke LikeC4. Create both marker files in one command:

```bash
node --input-type=module --eval '
import { writeFile } from "node:fs/promises"
for (const output of process.argv.slice(1)) {
  await writeFile(output, JSON.stringify({ absentModel: true }, null, 2) + String.fromCharCode(10))
}
' '<temporary-directory>/<state>.json' '<temporary-directory>/<state>.parsed.json'
```

Run every present-state export separately. The marker command replaces both exports for an absent state. Do not install or update dependencies automatically. If an export fails, stop, name the state, keep its diagnostic output and report the temporary directory.

## Calculate the net change

Read both computed JSON files and both parsed JSON files. Treat an `absentModel` marker as empty elements, relationships, deployments, views, specification, globals and project metadata. Compare model facts, not JSON text or generated diagram content.

Use the computed exports for elements, relationships and deployments. Use the parsed exports for authored views, specification, globals and project metadata. This separation prevents the same change from being reported twice.

### Elements

Match `elements` and `deployments.elements` by their object keys. A key found on one side is added or removed. For a key on both sides, report only fields whose values changed; do not count field order as a change.

### Relationships

Generated relationship IDs can change when source files move or are edited, so do not use them as identity.

For `relations` and `deployments.relations`:

1. group relationships by their source and target model references;
2. within each group, remove pairs whose semantic fields are equal after omitting `id`;
3. if exactly one unmatched relationship remains on each side, report it as modified and name its changed fields;
4. if either side has several unmatched relationships, report them as additions and removals and say that pairing them would be ambiguous.

Never infer that elements or endpoints with different model references are the same thing.

### Views and model definitions

Match `views` from the parsed exports by view id. Compare their authored definition fields, including `rules`, but omit `_stage`, `sourcePath` and layout fields. Do not compare `views` from the computed exports: their generated `nodes`, `edges` and `hash` repeat model changes and can hide how authored rules changed.

Compare changes to `specification`, `globals` and project metadata separately as model-definition changes. Ignore import bookkeeping and manual layout data in the default net diff, while leaving them available in the raw exports.

## Report

Start with the two requested states and their resolved commit ids where applicable. Then give the absolute paths of both computed JSON exports and both parsed JSON exports.

Report counts and concise lists for:

- elements added, removed and modified;
- relationships added, removed and modified;
- deployment elements and relationships changed;
- authored view definitions changed;
- specification, globals or project metadata changed.

For a modification, name the fields and show the before and after values. End with relationship ambiguities, export warnings or validation limits. If there is no semantic change, say so plainly.

Keep the raw exports after the summary so the user can ask for regular follow-up analysis. Say that the temporary files may contain internal architecture data and give their directory; do not delete them without being asked.

## References

- JSON export, including `--skip-layout` and `--pretty`: [LikeC4 CLI](https://likec4.dev/tooling/cli/)
- Reading the model before view computation with `parsedModel()`: [LikeC4 Model API](https://likec4.dev/tooling/model-api/edit/#reading-the-parsed-model)
- Inspecting the type of a path in a Git tree: [git-cat-file](https://git-scm.com/docs/git-cat-file)
- Creating an archive from a named Git tree without checking it out: [git-archive](https://git-scm.com/docs/git-archive)
- Accepted revision syntax: [gitrevisions](https://git-scm.com/docs/gitrevisions)
- Treating an absent model as empty, rejecting model symlinks and pairing relationships by endpoints are this toolkit's own comparison rules.
