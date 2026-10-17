import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { LikeC4 } from 'likec4'
import { referencedBy } from './references.js'

const source = `specification {
  element actor
  element system
  element container
}

model {
  customer = actor 'Customer' {
    style {
      shape person
    }
  }
  payments = system 'Payments' {
    api = container 'Payments API'
    job = container 'Payout job'
  }
  shop = system 'Shop'
  stripe = system 'Stripe'

  customer -> stripe 'Enters card details on'
  payments.api -> stripe 'Charges cards with'
  payments.job -> stripe 'Lists charges in'
  payments.api -> payments.job 'Starts'
  shop -> payments.api 'Asks to charge orders through'
}
`

const model = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'editable-metadata-references-'))
  writeFileSync(join(dir, 'model.c4'), source)
  return (await LikeC4.fromWorkspace(dir, { throwIfInvalid: true })).computedModel()
}

test('an external system is referenced by the containers that use it, named with their system, and not by people', async () => {
  assert.deepEqual(referencedBy((await model()).element('stripe')), ['Payments API (Payments)', 'Payout job (Payments)'])
})

test('a system is referenced by what uses its containers, not by its own containers', async () => {
  assert.deepEqual(referencedBy((await model()).element('payments')), ['Shop'])
})
