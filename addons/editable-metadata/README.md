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

Without configuration every key is text. To give keys other types, create `model/metadata.json`:

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

The options of `select` and `multiselect` are the ones listed plus every value already in use in the model. A `url` is a link in the built site.

An option can have a label that pages and editors show in place of the stored value:

```json
{
  "owners": { "type": "multiselect", "options": [{ "value": "igor", "label": "Igor Morozov" }, "platform-team"] }
}
```

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

## Options

```js
editableMetadata({
  model: 'model', // folder with the .c4 files
  fields: 'model/metadata.json', // field types
})
```

Both paths are relative to the Astro project root.

## How it saves

The dev server gets an endpoint that rewrites the edited metadata key or property of the element with [likec4-mutator](https://github.com/rebaseandpanic/likec4-mutator), leaving the rest of the file as it was. It only accepts requests from the page itself, and it does not exist in the built site.
