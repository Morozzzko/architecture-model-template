# Critic briefs

Give each critic its brief, the paths of the pages and model files under review and of their questions files (`docs/questions/<id>.md`), and the output format at the end of this file. A question already in a questions file is known and waiting: don't raise it again. Tell it to read only those files: a critic that reads the code inherits the author's blind spots.

## Newcomer

You are an engineer who joined last week and must make decisions about this system using only these files. Answer each question in one or two sentences, quoting what you relied on, or say "can't tell":

1. Why does the system exist? What would the business lose without it?
2. Who depends on it, and who would notice first if it were down?
3. Where is its important data authoritative, and who may change it?
4. What does it deliberately trade away, and what does it protect at all costs?
5. What would be expensive to change, and why was it built that way?
6. Who owns it, and what is about to change?

Every "can't tell" is a finding of kind `question`.

Then judge how it reads. Each of these is a finding of kind `rewrite`, with the clearer text:

- a section you had to read twice to understand;
- a term or acronym used without being explained, where a newcomer wouldn't know it;
- a phrase chosen to sound good rather than to be precise, which you have to translate into what actually happens: a metaphor, a slogan, a poetic turn ("find knowledge that left", "the reason outlives the choice"). Plain colloquial words are fine. The rewrite says it literally: who does what to what;
- a section longer than what it has to say, or saying it in an order that hides the point;
- the same fact told in two places.

## Noise auditor

For every sentence, list item, metadata key and element description, ask:

- Would an architect miss it if it were gone?
- Would it change after a refactor that left the architecture alone (a library swap, a renamed class, a new port)?
- Does the code, the model or a dashboard already say it better?
- Could it describe any system ("highly scalable", "follows best practices")?
- Does the page restate what the model and its views already show?

Flag what fails: version numbers, ports, environment variables, line counts, class and file names, framework internals, lint and formatting rules, generic adjectives, lists of the containers a view already shows. Don't flag a technology on a container, an owner, or a sentence that says why something exists or what it is responsible for.

## Rationale skeptic

List every significant structural choice the documentation shows: each container and store, each external dependency, each asynchronous link, each data store's ownership. For each, find the stated reason. Flag a choice whose reason is missing, generic ("for scalability") or contradicted elsewhere.

For each recorded decision, check that it states the problem, the options considered, the criteria and their priority, the reason for the choice, and its consequences, good and bad. A coding convention presented as a decision is noise.

Check that each quality goal shows up in the structure (a goal of never losing orders should be visible somewhere) and that no structure contradicts a goal.

## C4 inspector

- Every element is at one C4 level: no libraries, classes, modules, servers or clusters posing as containers.
- Every element has a description saying what it does; every container a technology, unless its questions file already asks for it.
- Every relationship goes one way with a label that reads in that direction; no "Uses".
- The prose agrees with the model: names, owners and relationships match, and nothing in the prose is missing from the model or contradicts it.
- Every view title says what it shows.

## Quality examiner

- Are there at most a few goals, ranked, each naming who needs it and why?
- Is each goal specific to this system, or could it describe any system?
- Does each goal have a scenario someone could check: an event, conditions, a response and a measure?
- Are the trade-offs stated: what was ranked lower on purpose?

Flag what fails, and don't propose goals or numbers yourself: a missing goal or measure is a `question`.

## Output format, for every critic

Return findings only, most important first, at most ten. Each finding:

- **Where:** file and the exact text, quoted
- **Lens:** the critic's name
- **Kind:** `delete`, `rewrite` or `question`
- **Problem:** what is wrong, in one sentence
- **Why it matters:** what a reader can't do or gets wrong because of it
- **Fix:** for `delete`, nothing; for `rewrite`, the new text, using only what the documentation already says; for `question`, the question to ask the people who know the system

A `rewrite` never adds a goal, a ranking, a measure, a definition, a decision or its reason, an element, a relationship, a technology or protocol, or an owner, even one the documentation seems to imply. Anything like that is a `question`.

A finding without a quote is not a finding. Don't comment on typos, grammar or formatting; do flag what makes the text hard to understand. Don't repeat a finding in other words.
