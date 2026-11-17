---
name: architecture-digest
description: Use when someone wants a monthly architecture digest, asks what changed in the architecture model over the last month, or wants model changes interpreted and summarized for readers of the architecture documentation.
---

# Digest the last month of architecture changes

Compare the model with its state one month ago, ask about the meaning of material changes, then summarize what happened for someone reading the architecture documentation. Return the digest in conversation only. Do not write a page, file or persistent report for the digest. Temporary comparison exports are still required by `model-diff` and are not a saved digest.

## Set the period

Run `git rev-parse --show-toplevel` and use the returned repository root as the working directory.

Find the latest commit at or before one month ago:

```bash
git rev-list -1 --before='1 month ago' HEAD
```

If that returns no commit, use the root commit:

```bash
git rev-list --max-parents=0 HEAD
```

In that case, say that the repository is younger than a month and give the shorter period. Use the baseline commit's date as the start and today as the end.

## Get the facts

Use the `model-diff` skill with the baseline commit as the first state and `working tree` as the second to produce internal comparison facts. Follow its snapshot, export and comparison instructions, including its temporary exports, but replace its standalone report instructions with the interview and digest below. Do not show its commit identifiers, export paths, counts or temporary-file notice. The working-tree state includes uncommitted and untracked model files.

If `model-diff` finds no semantic change, return the period and one sentence saying that the architecture model did not change. Ask no questions.

## Group what changed

Before asking anything, group the diff into a few themes:

- changes inside one system belong together;
- a cross-system relationship and its affected endpoints form one theme, not one theme per element;
- several elements added for the same capability belong together when the model supports that connection;
- specification, global or authored-view changes form their own theme when they change how readers understand the model.

Do not infer a shared purpose merely because changes happened near each other. Split a theme when the model does not support the connection.

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

1. **Period covered:** the start and end dates, noting a shorter period for a young repository.
2. **Overall summary:** one short paragraph naming the main architectural movement, using only model facts and the user's answers.
3. **Themes:** one plain-language paragraph per theme, saying what changed, why and why it matters when those interpretations were answered.

When no reason or impact was answered, the theme paragraph states only the factual change. Omit empty interpretation rather than drawing attention to it.

Write for readers of the architecture documentation. Omit commit counts, commit messages, filenames, source locations, raw ids and implementation detail that does not help them understand the architecture.

Do not edit the documentation or save the digest anywhere.

## References

- Selecting commits by date and finding root commits: [git-rev-list](https://git-scm.com/docs/git-rev-list)
- Architecture descriptions address stakeholder concerns and record rationale: [ISO/IEC/IEEE 42010:2022](https://www.iso.org/standard/74393.html)
- The diff-first interview and chat-only digest structure are this toolkit's own design.
