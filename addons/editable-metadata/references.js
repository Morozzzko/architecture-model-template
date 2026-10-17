const systemOf = (element) => (element.parent ? systemOf(element.parent) : element)

export function referencedBy(element) {
  const sources = [...element.incoming('all')]
    .map((relationship) => relationship.source)
    .filter((source) => source.id !== element.id && !source.isDescendantOf(element) && source.shape !== 'person')
  const titles = sources.map((source) => (source.parent ? `${source.title} (${systemOf(source).title})` : source.title))
  return [...new Set(titles)]
}
