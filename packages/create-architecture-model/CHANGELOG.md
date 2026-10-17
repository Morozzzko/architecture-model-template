# @architecture-model/create

## 0.3.0

### Minor Changes

- cf330e9: The built site includes LikeC4's diagram viewer at `/diagrams/`, linked from the sidebar, with a link back to the documentation.

### Patch Changes

- d813676: The template's README credits arc42 for the idea behind the Quality goals and Quality scenarios sections.
- a64516a: The template's `AGENTS.md` describes the people keys for every system (`integratedBy`, `experts`, `contributors`, `administrators`, `peopleConfirmed`) and the shared `model/people.json`.
- b23eee8: Keep people who have left in `model/people.json`, marked with the date they left. The template's `AGENTS.md` asks for precise, plain prose instead of metaphors and slogans.
- fc3a5ff: New repositories keep each system's open questions in `docs/questions/<id>.md`, unpublished. Every section of the starter system page has a placeholder, and `AGENTS.md` names the sections, asks for views named after their system, and allows a container's technology to stay open while it is a recorded question.

## 0.2.0

### Minor Changes

- 3332268: New repositories have a page per system instead of an arc42 document: the starter system's page in `src/content/docs/systems/`, an overview listing every system, and a build check that fails when a system has no page.

### Patch Changes

- 846d297: The starter model labels its relationships, declares an `external` kind with an example, and ships `model/conventions.md`; `AGENTS.md` gives agents the modeling rules.

## 0.1.1

### Patch Changes

- 34b4e29: Put the ADR and LikeC4 string rules in the template's AGENTS.md on separate lines.
- 34b4e29: `--yes` without a directory now fails with an explanation instead of asking for one.
