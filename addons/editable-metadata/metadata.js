export const valuesOf = (element, name) => [element.getMetadata(name) ?? []].flat()

export const optionsOf = (field) =>
  (field.options ?? []).map((option) => {
    if (typeof option === 'string') return { value: option, label: option }
    return {
      value: option.value,
      label: option.label ?? option.value,
      ...(option.href ? { href: option.href } : {}),
    }
  })

export const elementsWithMetadata = (model, name, value) =>
  [...model.elements()].filter((element) => valuesOf(element, name).includes(value))

export const hrefWithBase = (href, base = '/') => (href.startsWith('/') ? `${base.replace(/\/$/, '')}${href}` : href)

export function validateMetadataOptions(model, name, field) {
  const options = optionsOf(field)
  if (!options.length) throw new Error(`Metadata "${name}" needs configured options before its values can be queried`)

  const known = new Set(options.map(({ value }) => value))
  const used = [...new Set([...model.elements()].flatMap((element) => valuesOf(element, name)))]
  const unknown = used.filter((value) => !known.has(value))
  if (unknown.length) {
    throw new Error(
      `Unknown ${unknown.length === 1 ? 'value' : 'values'} ${unknown.map((value) => `"${value}"`).join(', ')} for metadata "${name}". Known values: ${[...known].join(', ')}`,
    )
  }

  return options
}
