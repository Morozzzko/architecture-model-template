import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { readTargets } from './lib/targets.js'

const workspaceWith = async source => {
  const workspace = await mkdtemp(join(tmpdir(), 'architecture-model-kubernetes-targets-'))
  await writeFile(join(workspace, 'model.c4'), source)
  return workspace
}

const model = deployment => `specification {
  element system
  deploymentNode environment
  deploymentNode cluster
  deploymentNode namespace
}

model {
  app = system 'Application'
}

deployment {
${deployment}
}
`

test('reads a target and matches authored namespaces only by metadata', async () => {
  const workspace = await workspaceWith(model(`  cluster production {
    metadata {
      kubernetesContext 'production-eu'
      kubernetesNamespaces ['payments', 'orders']
      kubernetesExcludeNamespaces 'orders'
      kubernetesElementAnnotation 'example.com/architecture-element'
      kubernetesIgnoreAnnotation 'example.com/architecture-ignore'
    }
    namespace namedDifferently {
      metadata {
        kubernetesNamespace 'payments'
      }
    }
    namespace orders
  }`))

  const { model: loaded, targets } = await readTargets(workspace)

  assert.equal(loaded.element('app').title, 'Application')
  assert.deepEqual(targets, [{
    deploymentFqn: 'production',
    context: 'production-eu',
    includedNamespaces: ['payments'],
    excludedNamespaces: ['orders'],
    elementAnnotation: 'example.com/architecture-element',
    ignoreAnnotation: 'example.com/architecture-ignore',
    authoredNamespaces: { payments: 'production.namedDifferently' },
  }])
})

test('requires an explicit wildcard to include every namespace', async () => {
  const workspace = await workspaceWith(model(`  cluster production {
    metadata {
      kubernetesContext 'production-eu'
      kubernetesNamespaces '*'
      kubernetesExcludeNamespaces ['kube-system', 'monitoring']
      kubernetesElementAnnotation 'example.com/architecture-element'
    }
  }`))

  const { targets } = await readTargets(workspace)

  assert.equal(targets[0].includedNamespaces, '*')
  assert.deepEqual(targets[0].excludedNamespaces, ['kube-system', 'monitoring'])
})

test('reports every missing target property', async () => {
  const workspace = await workspaceWith(model(`  cluster production {
    metadata {
      kubernetesExcludeNamespaces 'kube-system'
    }
  }`))

  await assert.rejects(
    readTargets(workspace),
    error => error.message.includes('production')
      && error.message.includes('kubernetesContext')
      && error.message.includes('kubernetesNamespaces')
      && error.message.includes('kubernetesElementAnnotation'),
  )
})

test('requires the namespace deployment kind when targets exist', async () => {
  const source = model(`  cluster production {
    metadata {
      kubernetesContext 'production-eu'
      kubernetesNamespaces '*'
      kubernetesElementAnnotation 'example.com/architecture-element'
    }
  }`).replace('  deploymentNode namespace\n', '')
  const workspace = await workspaceWith(source)

  await assert.rejects(readTargets(workspace), /deploymentNode namespace/)
})

test('rejects duplicate contexts', async () => {
  const target = name => `  cluster ${name} {
    metadata {
      kubernetesContext 'shared'
      kubernetesNamespaces '*'
      kubernetesElementAnnotation 'example.com/architecture-element'
    }
  }`
  const workspace = await workspaceWith(model(`${target('first')}\n${target('second')}`))

  await assert.rejects(readTargets(workspace), /shared.*first.*second|shared.*second.*first/)
})

test('rejects duplicate authored namespace mappings', async () => {
  const workspace = await workspaceWith(model(`  cluster production {
    metadata {
      kubernetesContext 'production-eu'
      kubernetesNamespaces '*'
      kubernetesElementAnnotation 'example.com/architecture-element'
    }
    namespace first {
      metadata { kubernetesNamespace 'payments' }
    }
    namespace second {
      metadata { kubernetesNamespace 'payments' }
    }
  }`))

  await assert.rejects(readTargets(workspace), /payments.*first.*second|payments.*second.*first/)
})

test('accepts namespace names inherited by ordinary JavaScript objects', async () => {
  const workspace = await workspaceWith(model(`  cluster production {
    metadata {
      kubernetesContext 'production-eu'
      kubernetesNamespaces ['constructor']
      kubernetesElementAnnotation 'example.com/architecture-element'
    }
    namespace constructorNamespace {
      metadata { kubernetesNamespace 'constructor' }
    }
  }`))

  const { targets } = await readTargets(workspace)

  assert.equal(targets[0].authoredNamespaces.constructor, 'production.constructorNamespace')
})

test('rejects an explicit namespace scope emptied by exclusions', async () => {
  const workspace = await workspaceWith(model(`  cluster production {
    metadata {
      kubernetesContext 'production-eu'
      kubernetesNamespaces ['payments']
      kubernetesExcludeNamespaces ['payments']
      kubernetesElementAnnotation 'example.com/architecture-element'
    }
  }`))

  await assert.rejects(readTargets(workspace), /kubernetesNamespaces.*empty|empty.*kubernetesNamespaces/)
})

test('requires target and namespace metadata on their documented deployment kinds', async () => {
  const targetWorkspace = await workspaceWith(model(`  environment production {
    metadata {
      kubernetesContext 'production-eu'
      kubernetesNamespaces '*'
      kubernetesElementAnnotation 'example.com/architecture-element'
    }
  }`))
  await assert.rejects(readTargets(targetWorkspace), /production.*cluster|cluster.*production/)

  const namespaceWorkspace = await workspaceWith(model(`  cluster production {
    metadata {
      kubernetesContext 'production-eu'
      kubernetesNamespaces '*'
      kubernetesElementAnnotation 'example.com/architecture-element'
    }
    cluster misplaced {
      metadata { kubernetesNamespace 'payments' }
    }
  }`))
  await assert.rejects(readTargets(namespaceWorkspace), /misplaced.*namespace|namespace.*misplaced/)
})
