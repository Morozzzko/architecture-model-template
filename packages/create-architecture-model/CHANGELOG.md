# @architecture-model/create

## 0.2.0

### Minor Changes

- 3332268: New repositories have a page per system instead of an arc42 document: the starter system's page in `src/content/docs/systems/`, an overview listing every system, and a build check that fails when a system has no page.

### Patch Changes

- 846d297: The starter model labels its relationships, declares an `external` kind with an example, and ships `model/conventions.md`; `AGENTS.md` gives agents the modeling rules.

## 0.1.1

### Patch Changes

- 34b4e29: Put the ADR and LikeC4 string rules in the template's AGENTS.md on separate lines.
- 34b4e29: `--yes` without a directory now fails with an explanation instead of asking for one.
