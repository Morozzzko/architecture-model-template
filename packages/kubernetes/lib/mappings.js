export const mappingIssue = (model, workload) => {
  const element = model.findElement(workload.element)
  if (!element) {
    return `${workload.kind} ${workload.namespace}/${workload.name} maps to unknown element ${workload.element}`
  }
  if (['actor', 'component'].includes(element.kind)) {
    return `${workload.kind} ${workload.namespace}/${workload.name} maps to ${element.kind} ${workload.element}, which is not independently deployable`
  }
  return null
}
