import * as Popover from '@radix-ui/react-popover'
import * as Switch from '@radix-ui/react-switch'
import { Command } from 'cmdk'
import { useRef, useState } from 'react'
import './editor.css'

const post = async (change) => {
  const response = await fetch('/__model/element', { method: 'POST', body: JSON.stringify(change) })
  if (!response.ok) throw new Error(await response.text())
}

const listOf = (value) => [value].flat().filter(Boolean)
const linksOf = (links) =>
  links
    .map(({ url, label }) => ({ url: url.trim(), label: label?.trim() }))
    .filter((link) => link.url)
    .map(({ url, label }) => (label ? { url, label } : { url }))
const keyOf = (list) => JSON.stringify(list.map((item) => JSON.stringify(item)).sort())
const shown = (type, values, labelOf) =>
  type === 'links' ? values.map((link) => link.label || link.url).join(', ') : values.map(labelOf).join(', ')

function Options({ type, options, chosen, onChoose, onClear }) {
  const [query, setQuery] = useState('')
  const typed = query.trim()
  const known = options.some((option) => option.value === typed || option.label === typed)

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
          <Command.Item
            key={option.value}
            value={option.value}
            keywords={[option.label]}
            className="em-item"
            onSelect={() => onChoose(option.value)}
          >
            <span className="em-check">{chosen.includes(option.value) ? '✓' : ''}</span>
            {option.label}
          </Command.Item>
        ))}
        {type === 'text' && typed && !known && (
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

function Links({ links, onChange, onSave }) {
  const set = (index, field) => (event) =>
    onChange(links.map((link, at) => (at === index ? { ...link, [field]: event.target.value } : link)))
  const onKeyDown = (event) => event.key === 'Enter' && (event.preventDefault(), onSave())

  return (
    <div className="em-command">
      {links.map((link, index) => (
        <div className="em-link" key={index}>
          <input
            className="em-input"
            type="url"
            placeholder="https://…"
            aria-label="URL"
            value={link.url}
            onChange={set(index, 'url')}
            onKeyDown={onKeyDown}
            autoFocus={index === links.length - 1}
          />
          <input
            className="em-input"
            placeholder="Label"
            aria-label="Label"
            value={link.label ?? ''}
            onChange={set(index, 'label')}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className="em-remove"
            aria-label={`Remove ${link.url || 'link'}`}
            onClick={() => onChange(links.filter((_, at) => at !== index))}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="em-item em-muted em-clear" onClick={() => onChange([...links, { url: '', label: '' }])}>
        <span className="em-check">+</span>
        Add link
      </button>
    </div>
  )
}

export default function Editor({ fqn, name, property = false, type, values: initial, options: listed = [] }) {
  const [values, setValues] = useState(initial)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')
  const cancelled = useRef(false)
  const labels = new Map(listed.map((option) => [option.value, option.label]))
  const labelOf = (value) => labels.get(value) ?? value
  const options = [...listed, ...draft.filter((value) => !labels.has(value)).map((value) => ({ value, label: value }))]
  const listedType = ['select', 'multiselect', 'text'].includes(type)

  const save = (value) => {
    setOpen(false)
    const next = type === 'links' ? linksOf(value) : listOf(value)
    if (keyOf(next) === keyOf(values)) return
    const previous = values
    setValues(next)
    setError('')
    post({ fqn, [property ? 'property' : 'key']: name, value: type === 'links' ? next : value }).catch((failure) => {
      setValues(previous)
      setError(failure.message)
    })
  }
  const saveDraft = () => save(type === 'multiselect' || type === 'links' ? draft : (draft[0] ?? '').trim())

  // Everything but a select and text keeps a draft and saves it on close, unless Escape closed it.
  // A multiselect can't save per toggle because every save reloads the page.
  const onOpenChange = (next) => {
    if (next) {
      cancelled.current = false
      setDraft(type === 'links' && !values.length ? [{ url: '', label: '' }] : values)
      return setOpen(true)
    }
    if (!cancelled.current && (type === 'multiselect' || !listedType)) return saveDraft()
    setOpen(false)
  }
  const onChoose = (option) => {
    if (type !== 'multiselect') return save(option)
    setDraft(draft.includes(option) ? draft.filter((value) => value !== option) : [...draft, option])
  }

  const text = shown(type, values, labelOf)
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

  const editor = listedType ? (
    <Options type={type} options={options} chosen={draft} onChoose={onChoose} onClear={() => save('')} />
  ) : type === 'links' ? (
    <Links links={draft} onChange={setDraft} onSave={saveDraft} />
  ) : type === 'textarea' ? (
    <div className="em-command">
      <textarea
        className="em-input em-textarea"
        aria-label={name}
        value={draft[0] ?? ''}
        onChange={(event) => setDraft([event.target.value])}
        onKeyDown={(event) => event.key === 'Enter' && (event.metaKey || event.ctrlKey) && saveDraft()}
        autoFocus
      />
      <p className="em-hint">⌘ or Ctrl + Enter or a click outside saves. Escape cancels. Markdown works.</p>
    </div>
  ) : (
    <div className="em-command">
      <input
        className="em-input"
        type={type === 'line' ? 'text' : type}
        aria-label={name}
        value={draft[0] ?? ''}
        onChange={(event) => setDraft([event.target.value])}
        onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), saveDraft())}
        autoFocus
      />
      <p className="em-hint">Enter or a click outside saves. Escape cancels.{name === 'title' ? '' : ' Empty clears it.'}</p>
    </div>
  )

  return (
    <>
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger className={type === 'textarea' ? 'em-value em-multiline' : 'em-value'} aria-label={`Edit ${name}: ${text || 'not set'}`}>
          {text || '—'}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className={type === 'textarea' || type === 'links' ? 'em-popover em-wide' : 'em-popover'}
            align="start"
            sideOffset={6}
            onEscapeKeyDown={() => (cancelled.current = true)}
          >
            {editor}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {problem}
    </>
  )
}
