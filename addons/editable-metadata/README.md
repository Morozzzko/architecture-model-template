# @architecture-model/editable-metadata

Shows the metadata and properties of [LikeC4](https://likec4.dev/) elements in [Astro](https://astro.build/) pages. In the dev server the values are click-to-edit and save back to the model; in the built site they are plain text.

Made for repositories created with `npm create @architecture-model`, and works in any Astro site that has a LikeC4 model.

## Install

```bash
npx astro add @architecture-model/editable-metadata
```

or by hand:

```bash
npm install @architecture-model/editable-metadata @astrojs/react react react-dom
```

```js
// astro.config.mjs
import editableMetadata from '@architecture-model/editable-metadata'

export default defineConfig({
  integrations: [editableMetadata()],
})
```

## Use

Give an element metadata in the model:

```
system = system 'Shop' {
  metadata {
    owner 'igor'
  }
}
```

and show it in a page:

```mdx
import Metadata from '@architecture-model/editable-metadata/Metadata.astro'

Owner: <Metadata of="system" name="owner" />
```

`of` is the element's fully qualified name, `name` is the metadata key. Keep the component on the same line as its label.

Run `npm run dev` and click the value to edit it. A select saves the option you choose, text saves the value you choose or add, and a multiselect, number, date or url saves when its editor closes. Escape closes without saving, and Clear or an empty value removes the key from the model.

The editors are React components built on [Radix](https://www.radix-ui.com/) and [cmdk](https://cmdk.paco.me/). The addon adds Astro's React integration if the site doesn't have it, and the built site contains none of the editor code.

## Field types

Without configuration every key is text, except the [people keys](#people). To give keys other types, create `model/metadata.json`:

```json
{
  "lifecycle": { "type": "select", "options": ["experimental", "production", "deprecated"] },
  "languages": { "type": "multiselect", "options": ["TypeScript", "Go", "Python"] },
  "launched": { "type": "date" }
}
```

| Type | Editor | Stored in the model as |
| --- | --- | --- |
| `text` | searchable list of the values already used for the key, and adds what you type | string |
| `number`, `date`, `url` | the browser's input for that type | string |
| `boolean` | switch | `'true'` or `'false'`, shown as Yes or No |
| `select` | searchable list of the options | string |
| `multiselect` | searchable list of the options, several can be checked | list of strings |
| `people` | searchable list of the people in `model/people.json`, several can be checked | list of handles |

The options of `select` and `multiselect` are the ones listed plus every value already in use in the model. A `url` is a link in the built site.

An option can have a label that pages and editors show in place of the stored value:

```json
{
  "owners": { "type": "multiselect", "options": [{ "value": "igor", "label": "Igor Morozov" }, "platform-team"] }
}
```

## Derived values

A value that follows from the model, such as whether an external system calls you back, is asked in the page instead of stored in the model. Define a function of the [element](https://likec4.dev/tooling/model-api/) and the model, and show its answer with `Derived`:

```mdx
import Derived from '@architecture-model/editable-metadata/Derived.astro'

export const ours = (element, model) => element.id === 'shop' || element.isDescendantOf(model.element('shop'))
export const callsBack = (element, model) => [...element.outgoing()].some(({ target }) => ours(target, model))

Payments calls us back: <Derived of="payments" value={callsBack} />
```

A function returns a string, a number, a list, or a boolean, shown as Yes or No. A derived value is never editable.

## People

"Owner" rarely tells you whom to ask. Each system, internal or external, can say whom to go to for which job:

| Key | Who | Ask them when |
| --- | --- | --- |
| `integratedBy` | integrated it originally | you need to know why it works the way it does |
| `experts` | know best how it works and how its integration is changed | there is an incident, an API or contract change, an upgrade, or a change to review |
| `contributors` | have worked on it | you need reviewers or extra hands, or the experts are away |
| `administrators` | manage it: for an external service, the vendor account, keys, billing and support; for our own, its accounts and access | credentials need rotating, someone needs access, or a support ticket or plan change is due |
| `peopleConfirmed` | | the date someone last checked these; older than about six months, check again |

The four people keys are `people` fields without any configuration. Each stores handles from one shared list, `model/people.json`, so a person is added once and every field picks from it:

```json
[
  { "value": "igor", "label": "Igor Morozov" },
  { "value": "dana", "label": "Dana Kim" }
]
```

```
stripe = external 'Stripe' {
  metadata {
    integratedBy 'igor'
    experts 'dana'
    contributors ['igor', 'dana']
    administrators 'dana'
    peopleConfirmed '2026-10-17'
  }
}
```

`People` shows them for one system, with the systems and containers that reference it, worked out from the model's relationships. `PeopleTable` shows the same for every system:

```mdx
import People from '@architecture-model/editable-metadata/People.astro'
import PeopleTable from '@architecture-model/editable-metadata/PeopleTable.astro'

<People of="stripe" />

<PeopleTable />
```

In the dev server the people fields are click-to-edit, picking from the list. A new person is added to `model/people.json` first. Someone who has left keeps their entry, with `"left": "2026-05-01"`, so their handle still shows as their name and you can [find the systems whose people have left](https://arch.morozov.is/recipes/people-who-left/). [Model who knows and manages each system](https://arch.morozov.is/people/) says which questions the people fields let the model answer, and why.

## Properties

`Property` shows and edits an element's own `title`, `summary`, `description`, `technology` or `links`:

```mdx
import Property from '@architecture-model/editable-metadata/Property.astro'

<Property of="system" name="description" />
```

| Property | Editor | In the built site |
| --- | --- | --- |
| `title`, `technology` | one-line input | text |
| `summary`, `description` | text area; ⌘ or Ctrl + Enter saves, line breaks are saved as a Markdown string | Markdown rendered as HTML |
| `links` | a URL and a label per row | links |

A title can't be emptied. Links replace the element's own links, and a row without a URL is dropped.

Only links whose URL has a scheme, such as `https:` or `mailto:`, are shown and edited. Relative links, such as an element's link to its own page, are kept when the links are saved, and move into the element's declaration if they were in an `extend` block.

## Options

```js
editableMetadata({
  model: 'model', // folder with the .c4 files
  fields: 'model/metadata.json', // field types
  people: 'model/people.json', // the people the people fields pick from
})
```

The paths are relative to the Astro project root.

## How it saves

The dev server gets an endpoint that rewrites the edited metadata key or property of the element with [likec4-mutator](https://github.com/rebaseandpanic/likec4-mutator), leaving the rest of the file as it was. It only accepts requests from the page itself, and it does not exist in the built site.
