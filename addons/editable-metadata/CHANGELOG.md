# @architecture-model/editable-metadata

## 0.4.0

### Minor Changes

- a64516a: Add people fields for every system: who integrated it, its experts, contributors and administrators, picked from a shared `model/people.json`. `People` shows them for one system with the systems that reference it, and `PeopleTable` for all systems.

### Patch Changes

- b23eee8: Keep people who have left in `model/people.json`, marked with the date they left. The template's `AGENTS.md` asks for precise, plain prose instead of metaphors and slogans.

## 0.3.0

### Minor Changes

- f795a0e: Add a `Derived` component that shows the answer of a function of the model, such as whether an external system calls you back, defined in the page.
- 1964cf7: Add a `Property` component that shows and edits an element's title, summary, description, technology and links, and let `select` and `multiselect` options have labels.

## 0.2.0

### Minor Changes

- 7107606: The dev-server editors are now searchable popovers built on Radix and cmdk, styled with the site's theme, with a switch for booleans. The addon adds Astro's React integration when the site doesn't have it, and the built site contains none of the editor code.
