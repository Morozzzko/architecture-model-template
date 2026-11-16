---
name: kubernetes-deployment
description: Use when a LikeC4 deployment view must reflect Kubernetes or Helm workloads, clusters, namespaces, replicas, container images, image IDs or versions, especially when generated deployment data must coexist with authored C4 concepts.
---

# Synchronize Kubernetes deployments

Keep architectural meaning authored and generate only observed deployment facts. Kubernetes workload controllers become instances of existing C4 elements; Kubernetes never creates the logical model or its relationships.

## Divide authored and generated data

| Author in C4 | Generate from Kubernetes |
| --- | --- |
| systems, containers and relationships | instances of mapped workload controllers |
| environments, cluster targets and important namespaces | missing namespaces that contain mapped workloads |
| deployment views and their scope | images, image IDs, versions, charts and replica status |

Generate instances for Deployments, StatefulSets, DaemonSets and CronJobs. Non-terminal Pods are short-lived evidence for observed Kubernetes `imageID` values. ReplicaSets and Jobs connect Pods to their owning controller. Do not draw Pods, ReplicaSets or Jobs as deployment nodes.

## Configure explicit targets

Declare `deploymentNode namespace`, then put one target on each cluster node. Use exact kubeconfig context names; do not infer clusters from the current context. Prefer an explicit namespace list. Use `'*'` only when the model genuinely covers the cluster, with explicit exclusions.

```c4
specification {
  deploymentNode environment
  deploymentNode cluster { technology 'Kubernetes' }
  deploymentNode namespace
}

deployment {
  environment production {
    cluster eu {
      metadata {
        kubernetesContext 'production-eu'
        kubernetesNamespaces ['shop', 'workers']
        kubernetesElementAnnotation 'architecture.example.com/likec4-element'
        kubernetesIgnoreAnnotation 'architecture.example.com/likec4-ignore'
      }
      namespace shop {
        metadata { kubernetesNamespace 'shop' }
      }
    }
    cluster us {
      metadata {
        kubernetesContext 'production-us'
        kubernetesNamespaces ['shop', 'workers']
        kubernetesElementAnnotation 'architecture.example.com/likec4-element'
      }
    }
  }
}

views {
  deployment view production {
    title 'Shop: production deployment'
    include production.**
  }
}
```

Repeat the target block for every cluster. A context may appear on only one target. `kubernetesExcludeNamespaces` removes names from a list or `'*'`. `kubernetesIgnoreAnnotation` optionally names a distinct controller annotation whose value records why that controller is omitted. An authored namespace uses exactly one `kubernetesNamespace`; otherwise the synchronizer generates a namespace below the target when it contains a mapped workload. Keep cluster nodes, authored namespaces and views outside `model/deployment.generated.c4`. Select generated content through stable authored ancestors; never reference generated FQNs directly.

## Map Helm workloads

Choose annotation prefixes under a domain the organization controls. Put the annotation on the controller, not only on its Pod template. Its value is the fully qualified ID of an independently deployable LikeC4 software system, container or custom kind, never a person or component.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "shop-api.fullname" . }}
  annotations:
    architecture.example.com/likec4-element: shop.api
  labels:
    app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
    helm.sh/chart: {{ printf "%s-%s" .Chart.Name (.Chart.Version | replace "+" "_") | quote }}
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: api
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

The cluster remains the source of truth for resolved desired images, observed Pod image IDs, label-derived version and chart, and replica status. Do not copy those values into authored C4. For an incidental controller in a mixed namespace, use the configured ignore annotation with a reason; never put both mapping and ignore annotations on one controller.

## Discover, synchronize and review

Install and lock the CLI in the architecture repository:

```bash
npm install --save-dev @architecture-model/kubernetes
```

Use a workspace directory that contains one LikeC4 project. If the repository contains several projects, select the project that owns the Kubernetes targets rather than their common parent.

The kubeconfig identity must be able to list namespaces, the four supported controllers, Pods, ReplicaSets and Jobs in scope. Then run:

```bash
npx architecture-model-kubernetes discover model
npx architecture-model-kubernetes sync model
npm run validate
npm run build
git diff -- model/deployment.generated.c4
```

`discover` is read-only. It prints every mapping, every intentional ignore and reason, and every unmapped controller. Resolve each unmapped controller by adding a mapping or ignore annotation, or deliberately removing its namespace from the authored target scope. Do not silently accept an unmapped controller. Unknown or non-deployable mappings and explicitly configured missing namespaces are errors.

Discovery gives each context 30 seconds and reads at most four namespaces concurrently within it. For a larger cluster or slower API path, pass the same `--timeout-seconds number` to `discover` and `sync`. Report a timeout as an access failure; do not remove the target to make synchronization pass.

If synchronization uses a custom generated path, pass the same `--output path/inside/model.c4` to `discover` and `sync`. Discovery must exclude the snapshot that synchronization replaces.

`sync` validates a complete candidate and atomically updates `model/deployment.generated.c4`. If any target is inaccessible, target metadata is invalid, an annotation names an unknown element, identifiers collide or LikeC4 rejects the candidate, it exits nonzero and preserves the previous snapshot. Fix the cause; do not produce a partial snapshot by temporarily deleting a target.

Review changes in images, multiple rollout image IDs, versions and desired/ready/available/updated replicas as operational evidence from the last successful refresh. Use repository history to establish age; the overlay has no timestamp. Mention that registry and image metadata may be sensitive in a public repository. The finished state is a valid, reviewed, unstaged diff. End the workflow there. Do not run or recommend `git add` or `git commit`, even as manual follow-up commands; state only that the user owns any later commit.

## Common mistakes

| Mistake | Correction |
| --- | --- |
| Annotating `spec.template.metadata` only | Annotate the Deployment, StatefulSet, DaemonSet or CronJob itself. |
| Modeling a Docker image as a logical element | Keep the container logical; generate image metadata on its deployment instance. |
| Using the current kubeconfig context implicitly | Declare every context in authored target metadata. |
| Drawing one node per Pod | Draw the controller instance and record normalized replica counts. |
| Mapping a controller to a component | Map it to the independently deployable system, container or custom kind that the controller runs. |
| Accepting permanent unmapped noise | Add a mapping, add the configured ignore annotation with a reason, or change the authored namespace scope. |
| Editing the generated file | Change authored C4, Helm metadata or cluster state, then rerun synchronization. |
| Offering staging or commit commands as the "manual" final step | End at the reviewed, unstaged diff; the user's later commit is outside this workflow. |

## References

- Checked source notes and links: [references.md](references.md)
