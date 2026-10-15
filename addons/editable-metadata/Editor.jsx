import * as Popover from '@radix-ui/react-popover'
import * as Switch from '@radix-ui/react-switch'
import { Command } from 'cmdk'
import { useRef, useState } from 'react'
import './editor.css'

const post = async (fqn, key, value) => {
  const response = await fetch('/__model/metadata', { method: 'POST', body: JSON.stringify({ fqn, key, value }) })
  if (!response.ok) throw new Error(await response.text())
}

const listOf = (value) => [value].flat().filter(Boolean)
const same = (a, b) => a.length === b.length && a.every((value) => b.includes(value))

function Options({ type, options, chosen, onChoose, onClear }) {
  const [query, setQuery] = useState('')
  const typed = query.trim()

  return (
    <Command className="em-command" loop>
      <Command.Input
        className="em-input"
        value={query}
        onValueChange={setQuery}
        placeholder={type === 'text' ? 'Search or add a value…' : 'Search…'}
      />
      <Command.List className="em-list">
        <Command.Empty className="em-empty">No options</Command.Empty>
        {options.map((option) => (
          <Command.Item key={option} value={option} className="em-item" onSelect={() => onChoose(option)}>
            <span className="em-check">{chosen.includes(option) ? '✓' : ''}</span>
            {option}
          </Command.Item>
        ))}
        {type === 'text' && typed && !options.includes(typed) && (
          <Command.Item value={typed} className="em-item" onSelect={() => (setQuery(''), onChoose(typed))}>
            <span className="em-check">+</span>
            Add “{typed}”
          </Command.Item>
        )}
      </Command.List>
      {type !== 'multiselect' && chosen.length > 0 && (
        <button type="button" className="em-item em-muted em-clear" onClick={onClear}>
          <span className="em-check" />
          Clear
        </button>
      )}
    </Command>
  )
}

export default function Editor({ fqn, name, type, values: initial, options: listed }) {
  const [values, setValues] = useState(initial)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')
  const cancelled = useRef(false)
  const options = [...new Set([...listed, ...draft])]
  const listedType = ['select', 'multiselect', 'text'].includes(type)

  const save = (value) => {
    setOpen(false)
    const next = listOf(value)
    if (same(next, values)) return
    const previous = values
    setValues(next)
    setError('')
    post(fqn, name, value).catch((failure) => {
      setValues(previous)
      setError(failure.message)
    })
  }

  // A multiselect and the plain inputs keep a draft and save it on close, unless Escape closed them.
  // A multiselect can't save per toggle because every save reloads the page.
  const onOpenChange = (next) => {
    if (next) {
      cancelled.current = false
      setDraft(values)
      return setOpen(true)
    }
    if (!cancelled.current && (type === 'multiselect' || !listedType)) return save(type === 'multiselect' ? draft : draft[0] ?? '')
    setOpen(false)
  }
  const onChoose = (option) => {
    if (type !== 'multiselect') return save(option)
    setDraft(draft.includes(option) ? draft.filter((value) => value !== option) : [...draft, option])
  }

  const label = `${name}: ${values.join(', ') || 'not set'}`
  const problem = error && (
    <span className="em-error" role="alert" title={error}>
      {' '}
      not saved
    </span>
  )

  if (type === 'boolean') {
    return (
      <>
        <Switch.Root
          className="em-switch"
          checked={values[0] === 'true'}
          onCheckedChange={(checked) => save(String(checked))}
          aria-label={name}
        >
          <Switch.Thumb className="em-thumb" />
        </Switch.Root>
        {problem}
      </>
    )
  }

  return (
    <>
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger className="em-value" aria-label={`Edit ${label}`}>
          {values.join(', ') || '—'}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="em-popover"
            align="start"
            sideOffset={6}
            onEscapeKeyDown={() => (cancelled.current = true)}
          >
            {listedType ? (
              <Options type={type} options={options} chosen={draft} onChoose={onChoose} onClear={() => save('')} />
            ) : (
              <div className="em-command">
                <input
                  className="em-input"
                  type={type}
                  value={draft[0] ?? ''}
                  onChange={(event) => setDraft([event.target.value])}
                  onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), save(draft[0]?.trim() ?? ''))}
                  autoFocus
                />
                <p className="em-hint">Enter or a click outside saves. Escape cancels. Empty removes the key.</p>
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {problem}
    </>
  )
}
