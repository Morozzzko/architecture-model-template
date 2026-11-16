---
name: kubernetes-deployment
description: Use when a LikeC4 deployment view must reflect Kubernetes or Helm workloads, clusters, namespaces, replicas, container images, image digests or versions, especially when generated deployment data must coexist with authored C4 concepts.
---

# Synchronize Kubernetes deployments

Keep architectural meaning authored and generate only observed deployment facts. Kubernetes workload controllers become instances of existing C4 elements; Kubernetes never creates the logical model or its relationships.

## Divide authored and generated data

| Author in C4 | Generate from Kubernetes |
| --- | --- |
| systems, containers and relationships | instances of mapped workload controllers |
| environments, cluster targets and important namespaces | missing selected namespaces |
| deployment views and their scope | images, digests, versions, charts and replica status |

Generate instances for Deployments, StatefulSets, DaemonSets and CronJobs. Pods are short-lived evidence for observed image digests. ReplicaSets and Jobs connect Pods to their owning controller. Do not draw Pods, ReplicaSets or Jobs as deployment nodes.

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

Repeat the target block for every cluster. A context may appear on only one target. `kubernetesExcludeNamespaces` removes names from a list or `'*'`. An authored namespace uses exactly one `kubernetesNamespace`; otherwise the synchronizer generates the selected namespace below the target. Keep cluster nodes, authored namespaces and views outside `model/deployment.generated.c4`.

## Map Helm workloads

Choose an annotation prefix under a domain the organization controls. Put the annotation on the controller, not only on its Pod template. Its value is the fully qualified ID of an existing LikeC4 element.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "shop-api.fullname" . }}
  annotations:
    architecture.example.com/likec4-element: shop.api
  labels:
    app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
    helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | quote }}
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: api
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

The cluster remains the source of truth for resolved desired images, observed Pod image digests, label-derived version and chart, and replica status. Do not copy those values into authored C4.

## Discover, synchronize and review

Install and lock the CLI in the architecture repository:

```bash
npm install --save-dev @architecture-model/kubernetes
```

The kubeconfig identity must be able to list namespaces, the four supported controllers, Pods, ReplicaSets and Jobs in scope. Then run:

```bash
npx architecture-model-kubernetes discover model
npx architecture-model-kubernetes sync model
npm run validate
npm run build
git diff -- model/deployment.generated.c4
```

`discover` is read-only. Resolve each reported unmapped controller by adding the configured annotation or deliberately removing its namespace from the authored target scope. Do not silently accept an unmapped controller.

`sync` validates a complete candidate and atomically updates `model/deployment.generated.c4`. If any target is inaccessible, target metadata is invalid, an annotation names an unknown element, identifiers collide or LikeC4 rejects the candidate, it exits nonzero and preserves the previous snapshot. Fix the cause; do not produce a partial snapshot by temporarily deleting a target.

Review changes in images, multiple rollout digests, versions and desired/ready/available/updated replicas as operational evidence. The finished state is a valid, reviewed, unstaged diff. End the workflow there. Do not run or recommend `git add` or `git commit`, even as manual follow-up commands; state only that the user owns any later commit.

## Common mistakes

| Mistake | Correction |
| --- | --- |
| Annotating `spec.template.metadata` only | Annotate the Deployment, StatefulSet, DaemonSet or CronJob itself. |
| Modeling a Docker image as a logical element | Keep the container logical; generate image metadata on its deployment instance. |
| Using the current kubeconfig context implicitly | Declare every context in authored target metadata. |
| Drawing one node per Pod | Draw the controller instance and record normalized replica counts. |
| Editing the generated file | Change authored C4, Helm metadata or cluster state, then rerun synchronization. |
| Offering staging or commit commands as the "manual" final step | End at the reviewed, unstaged diff; the user's later commit is outside this workflow. |

## References

- Checked source notes and links: [references.md](references.md)
