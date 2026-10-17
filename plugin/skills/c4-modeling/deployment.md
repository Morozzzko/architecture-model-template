# Deployment in LikeC4

The logical model says what depends on what and who owns it. The deployment model says where each piece runs in one environment. Relationships are written once, in the logical model; deployment views inherit them.

## What goes in deployment

| In deployment | Stays in the logical model |
| --- | --- |
| Which provider fills a role in an environment (Alchemy in prod, a local node in dev) | The role itself and what uses it |
| Regions, zones, clusters, VMs, database servers, load balancers, DNS | Containers, stores, queues and their owners |
| Copies of one thing: primary and standby, replicas, the same service in two regions | Relationships between containers |
| Runtime-only links: replication, failover, sync | |

An element that only appears in deployment has no owner and no relationships in the context and container views. Put it there only if no one asks what depends on it.

An external system that is the same in every environment, such as a SaaS used everywhere, stays out of deployment. Deploy an external system only where environments differ in what fills it.

## Example

```
specification {
  deploymentNode environment
  deploymentNode region
  deploymentNode cluster {
    technology 'Kubernetes'
  }
}

deployment {
  environment prod {
    region eu {
      cluster main {
        instanceOf shop.web
        instanceOf shop.api
        instanceOf shop.indexer
      }
      instanceOf shop.orders {
        technology 'Amazon RDS for PostgreSQL'
      }
      alchemy = instanceOf rpc {
        title 'Alchemy'
      }
    }
  }
  environment dev {
    instanceOf shop.api
    instanceOf shop.indexer
    instanceOf shop.orders
    anvil = instanceOf rpc {
      title 'Local Anvil node'
      technology 'Foundry Anvil'
    }
  }
}

views {
  deployment view prod {
    title 'Shop: production deployment'
    include prod.**
  }
}
```

`shop.indexer -> rpc` in the logical model shows as the indexer reaching Alchemy in `prod` and Anvil in `dev`. An instance can override `title`, `technology`, `icon` and `style`.

## Organizing

1. One deployment view per environment. Never all environments in one view.
2. Model only environments that differ in structure. If staging is prod with fewer replicas, say so in the prod view's description instead of copying the tree.
3. Use a fixed set of node kinds from `specification` (`environment`, `region`, `cluster`, `vm`), with their technology and icon set there.
4. Put shared infrastructure at the level it is shared at: a database used by every zone goes under the region, not into each zone.
5. Deployment relationships are for runtime mechanics only: `vm2.db -> vm1.db 'Replicates to'`. A primary and a failover provider are two instances of one element, titled to say which is which (`'Alchemy (primary)'`, `'Infura (failover)'`). The inherited relationship already reaches both, so add no arrow for the failover.
6. When an environment grows, give it its own file, `model/deployment/prod.c4`, and split regions with `extend prod.eu { ... }`.
7. For a large environment, show regions or clusters in an overview and link to a detail view with `include main with { navigateTo prod_main }`.

## What does not work in deployment views

LikeC4 marks deployment views as in development. `with` styling (except `navigateTo`) and `global style` are ignored there. Style through the node kind in `specification` instead.

## References

- One environment per view, deployment and infrastructure nodes: [C4 deployment diagrams](https://c4model.com/diagrams/deployment)
- `deploymentNode`, `instanceOf`, overrides and deployment relationships: [LikeC4 deployment model](https://likec4.dev/dsl/deployment/model/)
- Deployment view predicates, `navigateTo` and what doesn't work yet: [LikeC4 deployment views](https://likec4.dev/dsl/deployment/views/)
- Splitting an environment across files: [LikeC4 extend](https://likec4.dev/dsl/extend/)
