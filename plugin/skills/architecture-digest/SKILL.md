---
name: architecture-digest
description: Use when someone wants a monthly architecture digest, asks what changed in the architecture model over the last month, or wants model changes interpreted and summarized for readers of the architecture documentation.
---

# Digest the last month of architecture changes

Compare the model with its state one month ago, ask about the meaning of material changes, then summarize what happened for someone reading the architecture documentation. Return the digest in conversation only. Do not write a page, file or persistent report for the digest. `model-diff` creates temporary comparison exports while the interview is in progress; remove them when this workflow ends.

## Set the period

Run `git rev-parse --show-toplevel` and use the returned repository root as the working directory.

Use the calendar date one month before today as the normal start shown in the digest, and today as the end. The baseline commit represents the repository's state on that start date; do not substitute the commit's date for the calendar start.

Find the latest commit at or before one month ago:

```bash
git rev-list -1 --before='1 month ago' HEAD
```

If that returns no commit, first run `git rev-parse --is-shallow-repository`. If it prints `true`, stop and say that the available history does not reach the requested start date. Do not describe a shallow boundary as the repository's beginning.

For a complete repository, use the root commit:

```bash
git rev-list --max-parents=0 HEAD
```

If exactly one root commit is returned, say that the repository is younger than a month and give the shorter period from the root commit's date through today. If several roots are returned, stop and say that the combined history has no single beginning; do not pick one silently.

## Get the facts

Use the `model-diff` skill with the baseline commit as the first state and `working tree` as the second to produce internal comparison facts. Follow its snapshot, export and comparison instructions, including its temporary exports, but replace its standalone report instructions with the interview and digest below. Keep the temporary directory path internally until cleanup; do not show its commit identifiers, export paths or counts in the digest.

If the baseline has no model directory, `model-diff` treats it as an empty state. Describe the model as introduced during the period, and ask whether it documents pre-existing architecture or an architectural change before interpreting its contents.

Run `git status --short -- model`. If it has output, say in the period line that the digest includes uncommitted working-tree changes, because they may still be drafts. The working-tree state also includes untracked model files.

If `model-diff` finds no semantic change, return the period and one sentence saying that the architecture model did not change. Ask no questions.

## Group what changed

Before asking anything, group the diff into a few themes:

- changes inside one system belong together;
- a cross-system relationship and its affected endpoints form one theme, not one theme per element;
- several elements added for the same capability belong together when the model supports that connection;
- specification, global or authored-view changes form their own theme when they change how readers understand the model.

Do not infer a shared purpose merely because changes happened near each other. Split a theme when the model does not support the connection.

Rank themes by what most changes a reader's understanding. Ask about at most three themes unless the user asks to continue the interview.

Use model titles in conversation. Do not expose raw model ids unless the user asks for them.

## Interview for meaning

Ask one question at a time.

The diff says what changed. Ask only for interpretation that the model cannot supply and that would change the digest: the reason, the effect on readers, an architectural trade-off or whether a change represents the current direction.

For each theme that needs interpretation:

1. state the factual change in one sentence;
2. ask one question about the most important missing meaning;
3. wait for the answer before asking another question;
4. ask a follow-up only when the answer is ambiguous and the distinction changes the digest.

Never ask for a fact already present in the model. Do not turn every element or relationship into a question.

If the user says they do not know, keep the factual change and continue. Do not add an “open questions” section, label the reason as unknown or call attention to the unanswered question in the digest. Never invent the missing interpretation.

## Write the digest

Return this shape in conversation:

1. **Period covered:** the start and end dates, noting a shorter period for a young repository and any included uncommitted work.
2. **Overall summary:** one short paragraph naming the main architectural movement, using only model facts and the user's answers.
3. **Themes:** one plain-language paragraph per theme, saying what changed, why and why it matters when those interpretations were answered.

When no reason or impact was answered, the theme paragraph states only the factual change. Omit empty interpretation rather than drawing attention to it.

Write for readers of the architecture documentation. Omit commit counts, commit messages, filenames, source locations, raw ids and implementation detail that does not help them understand the architecture.

Do not edit the documentation or save the digest anywhere.

## Clean up

After delivering either the no-change result or the final digest, delete the exact temporary directory created by `model-diff` for this comparison:

```bash
rm -r -- '<temporary-directory>'
```

Do not delete any other path. If cleanup fails or the workflow stops before the digest, tell the user which temporary directory remains because it may contain internal architecture data.

## References

- Selecting commits by date and finding root commits: [git-rev-list](https://git-scm.com/docs/git-rev-list)
- Detecting shallow history: [git-rev-parse](https://git-scm.com/docs/git-rev-parse)
- Detecting uncommitted and untracked model files: [git-status](https://git-scm.com/docs/git-status)
- Architecture descriptions address stakeholder concerns and record rationale: [ISO/IEC/IEEE 42010:2022](https://www.iso.org/standard/74393.html)
- The diff-first interview and chat-only digest structure are this toolkit's own design.
