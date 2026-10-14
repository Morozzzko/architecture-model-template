import * as Popover from '@radix-ui/react-popover'
import * as Switch from '@radix-ui/react-switch'
import { Command } from 'cmdk'
import { useRef, useState } from 'react'
import css from './editor.css?inline'

const save = async (fqn, key, value) => {
  const response = await fetch('/__model/metadata', { method: 'POST', body: JSON.stringify({ fqn, key, value }) })
  if (!response.ok) throw new Error(await response.text())
}

const same = (a, b) => a.length === b.length && a.every((value) => b.includes(value))

function Options({ type, values, options, chosen, onChoose, onSave }) {
  const [query, setQuery] = useState('')
  const typed = query.trim()

  return (
    <Command className="em-command" loop>
      <Command.Input
        className="em-input"
        value={query}
        onValueChange={setQuery}
        placeholder={type === 'select' ? 'Search…' : 'Search or add a value…'}
      />
      <Command.List className="em-list">
        <Command.Empty className="em-empty">No options</Command.Empty>
        {options.map((option) => (
          <Command.Item key={option} value={option} className="em-item" onSelect={() => onChoose(option)}>
            <span className="em-check">{chosen.includes(option) ? '✓' : ''}</span>
            {option}
          </Command.Item>
        ))}
        {type !== 'select' && typed && !options.includes(typed) && (
          <Command.Item value={typed} className="em-item" onSelect={() => (setQuery(''), onChoose(typed))}>
            <span className="em-check">+</span>
            Add “{typed}”
          </Command.Item>
        )}
        {type !== 'multiselect' && values.length > 0 && (
          <Command.Item value="Clear" className="em-item em-muted" onSelect={() => onSave('')}>
            <span className="em-check" />
            Clear
          </Command.Item>
        )}
      </Command.List>
    </Command>
  )
}

function Field({ type, values, onSave }) {
  const [value, setValue] = useState(values[0] ?? '')
  return (
    <div className="em-command">
      <input
        className="em-input"
        type={type}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), onSave(value.trim()))}
        autoFocus
      />
      <p className="em-hint">Enter saves. An empty value removes the key.</p>
    </div>
  )
}

export default function Editor({ fqn, name, type, values: initial, options: listed }) {
  const [values, setValues] = useState(initial)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(initial)
  const cancelled = useRef(false)
  const options = [...new Set([...listed, ...draft])]

  const onSave = (value) => {
    setValues([value].flat().filter(Boolean))
    setOpen(false)
    save(fqn, name, value).catch((error) => (setValues(initial), console.error(error)))
  }

  // A multiselect collects its changes and saves once on close, because each save reloads the page.
  const onOpenChange = (next) => {
    if (next) {
      cancelled.current = false
      setDraft(values)
    } else if (type === 'multiselect' && !cancelled.current && !same(draft, values)) {
      return onSave(draft)
    }
    setOpen(next)
  }
  const onChoose = (option) => {
    if (type !== 'multiselect') return onSave(option)
    setDraft(draft.includes(option) ? draft.filter((value) => value !== option) : [...draft, option])
  }

  const style = (
    <style href="@architecture-model/editable-metadata" precedence="default">
      {css}
    </style>
  )

  if (type === 'boolean') {
    return (
      <>
        {style}
        <Switch.Root
          className="em-switch"
          checked={values[0] === 'true'}
          onCheckedChange={(checked) => onSave(String(checked))}
          aria-label={name}
        >
          <Switch.Thumb className="em-thumb" />
        </Switch.Root>
      </>
    )
  }

  return (
    <>
      {style}
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger className="em-value" aria-label={`Edit ${name}`}>
          {values.join(', ') || '—'}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="em-popover"
            align="start"
            sideOffset={6}
            onEscapeKeyDown={() => (cancelled.current = true)}
          >
            {['select', 'multiselect', 'text'].includes(type) ? (
              <Options type={type} values={values} options={options} chosen={draft} onChoose={onChoose} onSave={onSave} />
            ) : (
              <Field type={type} values={values} onSave={onSave} />
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  )
}
