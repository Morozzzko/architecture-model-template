# @architecture-model/editable-metadata

Shows the metadata of [LikeC4](https://likec4.dev/) elements in [Astro](https://astro.build/) pages. In the dev server the values are click-to-edit and save back to the model; in the built site they are plain text.

Made for repositories created with `npm create @architecture-model`, and works in any Astro site that has a LikeC4 model.

## Install

```bash
npx astro add @architecture-model/editable-metadata
```

or by hand:

```bash
npm install @architecture-model/editable-metadata
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

Run `npm run dev` and click the value to edit it. Enter or a click elsewhere saves, Escape cancels, and an empty value removes the key from the model.

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
| `text` | text input that suggests values already used for the key | string |
| `number`, `date`, `url` | the browser's input for that type | string |
| `boolean` | checkbox | `'true'` or `'false'`, shown as Yes or No |
| `select` | dropdown | string |
| `multiselect` | a checkbox per option | list of strings |

The options of `select` and `multiselect` are the ones listed plus every value already in use in the model. A `url` is a link in the built site.

## Options

```js
editableMetadata({
  model: 'model', // folder with the .c4 files
  fields: 'model/metadata.json', // field types
})
```

Both paths are relative to the Astro project root.

## How it saves

The dev server gets an endpoint that rewrites the element's `metadata` block with [likec4-mutator](https://github.com/rebaseandpanic/likec4-mutator), leaving the rest of the file as it was. It only accepts requests from the page itself, and it does not exist in the built site.
