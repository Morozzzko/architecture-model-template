# Kubernetes deployment synchronization for LikeC4

`@architecture-model/kubernetes` reads explicit Kubernetes contexts and writes a deterministic LikeC4 deployment overlay. Keep systems, containers, relationships, environments, clusters, important namespaces and deployment views authored. Generate only workload instances and operational metadata observed at the last successful refresh.

The command is read-only with respect to Kubernetes. It does not parse Helm templates or mutate a cluster.
The command-line interface is the supported package surface; modules under `lib/` are internal.

## What it reads

| Kubernetes resource | Result |
| --- | --- |
| Deployment, StatefulSet, DaemonSet, CronJob | One `instanceOf` node when the controller has the configured element annotation |
| Non-terminal Pod | Kubernetes `imageID` values for its owning controller |
| ReplicaSet, Job | Ownership path from a Pod to a Deployment or CronJob |
| Other resources | Not read or drawn |

Desired images come from the controller's Pod template. Observed image IDs come from `ContainerStatus.imageID` and may include runtime-specific prefixes. Versions come from `app.kubernetes.io/version`, Helm charts from `helm.sh/chart`, and replica fields from controller status. Pods, ReplicaSets and Jobs never become diagram nodes; completed or failed Pods do not contribute image IDs.

## Install

The package requires Node.js 22.22.3 or newer.

```bash
npm install --save-dev @architecture-model/kubernetes
```

## Configure the authored model

Declare a `namespace` deployment-node kind. Put one synchronization target on each authored cluster node, using exact kubeconfig context names:

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
```

Each target requires:

- `kubernetesContext`: one unique kubeconfig context.
- `kubernetesNamespaces`: a namespace, a list, or exactly `'*'`.
- `kubernetesElementAnnotation`: the annotation key that maps a controller to a LikeC4 element.

`kubernetesIgnoreAnnotation` optionally names a second annotation used to classify an in-scope controller as intentionally omitted. Its value is the reason. The mapping and ignore annotations must differ.

`kubernetesExcludeNamespaces` optionally removes namespaces from the selected scope. Prefer an explicit list; use `'*'` only when the model covers the whole cluster. An authored namespace can declare one `kubernetesNamespace`. A namespace with mapped workloads and no authored match is generated below the target.

Keep this configuration and all deployment views in authored files. Select generated content through stable authored ancestors such as `include production.**`; do not reference generated FQNs directly from authored views or deployment relationships. The command owns `model/deployment.generated.c4`.

## Map Helm workloads

Choose annotation prefixes under a domain your organization controls. Put the mapping on the workload controller, not only on the Pod template. The value is the fully qualified ID of an existing independently deployable logical element, such as a software system or container, never a person or component.

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

Do not copy the image, image ID, chart version or replica status into the authored logical model. The installed controller and its Pods supply those values.

For an incidental controller in a namespace that also contains mapped workloads, use the configured ignore annotation instead of removing the namespace:

```yaml
metadata:
  annotations:
    architecture.example.com/likec4-ignore: 'Platform-managed helper, not architecture-significant'
```

A controller must not have both mapping and ignore annotations.

## Permissions

For each configured context, the kubeconfig identity must be able to list namespaces and these resources in every selected namespace:

- Deployments, StatefulSets, DaemonSets and ReplicaSets
- CronJobs and Jobs
- Pods

The package loads the default kubeconfig and uses only the contexts declared in LikeC4 metadata.

## Discover and synchronize

Run discovery before every update:

```bash
npx architecture-model-kubernetes discover model
```

`discover` writes nothing. It prints every mapped controller and its LikeC4 FQN, every intentionally ignored controller and reason, and every unmapped controller. Resolve each unmapped controller by adding a mapping or ignore annotation, or deliberately removing its namespace from the target scope.

If one context is inaccessible, discovery still reports successful contexts and every access failure, then exits nonzero. An unknown or non-deployable logical mapping and an explicitly configured namespace missing from the cluster are also errors. A workspace with no synchronization targets is an error rather than an empty result.

Then update the overlay, validate the repository and review the diff:

```bash
npx architecture-model-kubernetes sync model
npm run validate
npm run build
git diff -- model/deployment.generated.c4
```

Use `--output path/inside/model.c4` with `sync` to choose another file inside the LikeC4 workspace.

The output must end in `.c4` or `.likec4`. When it already exists, its first line must be the generator ownership marker. Synchronization refuses an authored file at either the default or a custom output path before it contacts a cluster.

`sync` discovers every target, renders one complete candidate, validates it with LikeC4 and atomically replaces the output only when content changed. Any inaccessible target, invalid metadata, unknown annotated element, authored/generated identifier collision or invalid candidate leaves the previous snapshot unchanged. It never writes a partial multi-cluster snapshot.

Review image changes, multiple image IDs during rollouts, and desired/ready/available/updated replica counts. The generated title shows the Kubernetes controller name and kind while `instanceOf` retains the logical association. Inherited relationships are resolved through the deployment hierarchy; they do not imply that every instance connects to every other instance.

Keep the generated snapshot committed, but stage and commit it manually only after the diff and repository validation are acceptable. The command does not invoke Git. Refresh after releases or before architecture reviews, and use repository history to establish snapshot age because generated files contain no timestamp. Registry names, versions and image IDs may be sensitive when the documentation repository or site is public.
