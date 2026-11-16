# References

These sources were checked when this skill was written. The skill paraphrases them.

- [LikeC4 deployment model](https://likec4.dev/dsl/deployment/model/) defines deployment nodes, `instanceOf`, metadata and deployment relationships.
- [LikeC4 deployment views](https://likec4.dev/dsl/deployment/views/) defines deployment-view scope and predicates. Views remain authored because they express which infrastructure a reader needs to see.
- [LikeC4 model API: edit](https://likec4.dev/tooling/model-api/edit/) documents programmatic model editing. The synchronizer instead emits a deterministic source overlay so the reviewed snapshot can be committed.
- [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) identifies labels as queryable identifying metadata. The synchronizer reads standard application and Helm labels for version and chart data.
- [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) describes annotations as non-identifying metadata for tools. The mapping from a controller to a LikeC4 element therefore uses a configurable annotation key.
- [Kubernetes owners and dependents](https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/) defines owner references. They let the synchronizer attribute Pod image digests through ReplicaSets and Jobs to their Deployment or CronJob without drawing those transient resources.
- [Helm labels and annotations](https://helm.sh/docs/chart_best_practices/labels/) recommends standard `app.kubernetes.io/*` labels and distinguishes queryable labels from annotations. The synchronizer reads `app.kubernetes.io/version` and `helm.sh/chart` when present.
- [Helm advanced techniques](https://helm.sh/docs/v3/topics/advanced/) documents Helm ownership metadata and reinforces that tool-specific annotations belong on managed resources.
- [Kubernetes JavaScript client](https://github.com/kubernetes-client/javascript) is the official client used to load explicit kubeconfig contexts and read cluster resources.
