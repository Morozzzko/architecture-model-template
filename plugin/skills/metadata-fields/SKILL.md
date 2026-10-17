---
name: metadata-fields
description: Use when adding, changing or showing element metadata in this architecture model - a new metadata field such as owner or lifecycle, a new option for a select or multiselect field, a value on an element, a value derived from relationships, or a metadata value or element property embedded in a documentation page.
---

# Metadata fields

This needs the `@architecture-model/editable-metadata` addon. If `astro.config.mjs` does not use it, install it first:

```bash
npx astro add @architecture-model/editable-metadata
```

Element metadata has these parts. Change only the ones the task needs.

| Part | File | Holds |
| --- | --- | --- |
| Field definition | `model/metadata.json` (create it when missing) | The input type of each key and the options of select types |
| Value | `model/model.c4` | The value of a key on one element |
| Display | `src/content/docs/*.mdx` | Where a value appears in the documentation |

## Define a field or add an option

Add or edit the key in `model/metadata.json`:

```json
{
  "owner": { "type": "text" },
  "lifecycle": { "type": "select", "options": ["experimental", "production", "deprecated"] },
  "languages": { "type": "multiselect", "options": ["TypeScript", "Go", "Python"] }
}
```

- Types: `text`, `number`, `date`, `url`, `boolean`, `select`, `multiselect`, `people`. A key that is not listed is `text`, except the people keys below.
- `people` picks from the shared list in `model/people.json` (`[{ "value": "dana", "label": "Dana Kim" }]`) and stores handles. The keys `integratedBy`, `experts`, `contributors` and `administrators` are `people` fields, and `peopleConfirmed` a `date`, without being listed; each holds one handle or a list. What each is for, and which job goes to whom, is in the repository's `AGENTS.md`. Add a person to `model/people.json`, creating it if missing, before using their handle anywhere. When someone leaves, add `"left": "2026-05-01"` to their entry; don't delete it or their handles.
- Keys are identifiers: letters, digits, `_` and `-`, not starting with a digit.
- `options` applies to `select` and `multiselect`. To add an option, append it to the array.
- An option that should read differently from what the model stores is `{ "value": "igor", "label": "Igor Morozov" }`. Elements store the value; pages show the label.
- Do not remove or rename an option that elements still use. Values in use are offered as options anyway, so the old value stays selectable until every element is changed. Find the users with the `likec4` MCP tool `query-by-metadata`.

## Set a value on an element

Edit the element's `metadata` block in `model/model.c4`. Create the block if the element has none; it goes after the tags and properties, before nested elements.

```
system = system 'Software System' {
  description 'A software system.'
  metadata {
    owner 'igor'
    lifecycle 'production'
    languages [
      'TypeScript',
      'Go'
    ]
  }
}
```

- Every value is a single-quoted string. Write a `boolean` as `'true'` or `'false'`, a `date` as `'2026-01-31'`, a `number` as `'42'`.
- A `multiselect` value is a list of strings.
- To clear a value, delete its line. Delete the `metadata` block when it becomes empty.

## Derive a value

When the answer follows from the model, such as whether an external system calls us back, derive it in the page instead of storing it in the model. Export a function of the element and the model, using the [LikeC4 model API](https://likec4.dev/tooling/model-api/), and show it with `Derived`:

```mdx
import Derived from '@architecture-model/editable-metadata/Derived.astro'

export const ours = (element, model) => element.id === 'system' || element.isDescendantOf(model.element('system'))
export const callsBack = (element, model) => [...element.outgoing()].some(({ target }) => ours(target, model))

Calls us back: <Derived of="payments" value={callsBack} />
```

- Return a string, a number, a list, or a boolean (shown as Yes or No).
- A derived value is never editable. Don't also store it as metadata.

## Show a value in a page

```mdx
import Metadata from '@architecture-model/editable-metadata/Metadata.astro'

Owner: <Metadata of="system" name="owner" />
```

- `of` is the element's fully qualified name (`system.webapp`), `name` is the metadata key.
- Keep the component on the same line as its label. On a line of its own it renders outside the paragraph.
- An unknown element or type fails the build; an unset value renders empty.

An element's own `title`, `summary`, `description`, `technology` or `links` is shown with `Property`:

```mdx
import Property from '@architecture-model/editable-metadata/Property.astro'

<Property of="system" name="description" />
```

A system's people, with the systems and containers that reference it, are shown with `People`, and every system's with `PeopleTable`:

```mdx
import People from '@architecture-model/editable-metadata/People.astro'
import PeopleTable from '@architecture-model/editable-metadata/PeopleTable.astro'

<People of="stripe" />

<PeopleTable />
```

In `npm run dev` the rendered value is click-to-edit and saves to `model/model.c4`. That is for people using the browser. As an agent, edit the files.

## Finish

```
npm run validate
npm run build
```

## References

- Metadata, links and Markdown descriptions in LikeC4: the [model DSL](https://likec4.dev/dsl/model/)
- The element and model objects a derived value receives: the [LikeC4 model API](https://likec4.dev/tooling/model-api/)
- Field types, `Property` and `Derived`: the [editable-metadata README](https://github.com/Morozzzko/architecture-model-template/tree/main/addons/editable-metadata)
