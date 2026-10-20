---
'@architecture-model/editable-metadata': minor
---

`<Property name="links">` shows and edits only links whose URL has a scheme, such as `https:`. Relative links, such as an element's link to its own page, are no longer shown or offered in the editor, and a save keeps them, moving them into the element's declaration.
