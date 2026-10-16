import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const documentationLink = String.raw`
    <a data-documentation-link href="../">Back to Documentation</a>
    <script>
      (() => {
        const link = document.querySelector('[data-documentation-link]')
        const borrowed = ['class', 'style', 'data-variant', 'data-size']
        const corner =
          'position: fixed; bottom: 16px; right: 16px; z-index: 10000; padding: 6px 12px; border-radius: 6px; ' +
          'background: #1f2937; color: #fff; font: 14px system-ui, sans-serif; text-decoration: none'

        // The overview has no Share button, so the link waits in a corner until a view shows one.
        const placeLink = () => {
          const reference = [...document.querySelectorAll('button')]
            .find((button) => button.textContent?.trim() === 'Share')

          if (!reference) {
            if (link.parentElement === document.body && link.getAttribute('style') === corner) return
            for (const attribute of borrowed) link.removeAttribute(attribute)
            link.setAttribute('style', corner)
            document.body.append(link)
            return
          }
          if (link.parentElement === reference.parentElement) return

          for (const attribute of borrowed) {
            const value = reference.getAttribute(attribute)
            if (value === null) link.removeAttribute(attribute)
            else link.setAttribute(attribute, value)
          }
          link.style.display = 'inline-flex'
          link.style.alignItems = 'center'
          reference.before(link)
        }

        new MutationObserver(placeLink).observe(document.body, { childList: true, subtree: true })
        placeLink()
      })()
    </script>`

export const injectDocumentationLink = (html) => html.replace('</body>', `${documentationLink}\n  </body>`)

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const index = resolve('dist/diagrams/index.html')
  writeFileSync(index, injectDocumentationLink(readFileSync(index, 'utf8')))
}
