---
name: document-a-system
description: Use when someone wants to document a system's architecture, start or continue documenting one, pick up where they left off, or is new to architecture documentation and asks where to start or what to fill in.
---

# Document a system

Walk a person through documenting one system as a conversation. They bring what only people know; you write it into the repository. They don't need to know the steps, the outline or the other skills: you lead, one topic at a time, and everything you learn is kept in the repository so any later session can carry on.

## Where things live

- The system's page: `src/content/docs/systems/<id>.mdx`, with the sections and order `AGENTS.md` lists. For the first system in a new repository, rename the starter page `systems/system.mdx`, which describes the sample "Software System", to the real system's id, and replace the sample elements and views in the model with the real ones. For later systems, start from a copy of an existing page with its sections reset to their placeholders. Name each view after its system (`paymentsContext`, `paymentsContainers`), and keep the page's diagrams pointing at views that exist.
- The sections' placeholders, which a section keeps until its main point is written and gets back if it is emptied:

  | Section | Placeholder |
  | --- | --- |
  | Purpose | *Why the system exists, who depends on it, and what each of them needs from it.* |
  | Quality goals | *The three qualities the system is optimized for, in order, each with who needs it and why. When two conflict, the higher one wins.* |
  | Quality scenarios | *For each goal, a check: when \<event\> under \<conditions\>, the system \<response\> within \<measure\>.* |
  | Key concepts | *The few ideas the system is built around, which explain the structure below.* |
  | Context | *Who uses the system and which systems it talks to, with who owns each.* |
  | Containers | *The apps, jobs and data stores the system runs, and why it is split this way.* |
  | Key flows | *The one or two flows people ask about most, step by step.* |
  | Principles and decisions | *The principles behind the structure above, with links to the decisions in `docs/decisions/` that record them.* |
  | Where it's heading | *What is being added, replaced or retired, and why.* |

- The system in the model: `model/model.c4`, following the `c4-modeling` skill.
- Its open questions: `docs/questions/<id>.md`, created when the first question comes up. It is not published. Keep exactly this shape:

  ```markdown
  # Open questions: Payments

  | Question | Section | Who might know | Asked |
  | --- | --- | --- | --- |
  | Why was Stripe chosen to charge cards? | Principles and decisions | The previous tech lead of the payments team | 2026-10-10 |
  ```

Open questions go in that file and nowhere else: not as notes on the page, not in `model/conventions.md`, not in `AGENTS.md`. On the page, an unknown value, such as a number, a date or a name, is just the word "open" where the value would be, in prose and in table cells alike ("paid by: open"). Never restate a question on the page as "<question>: open". Ask who might know as a multiple-choice question, offering the people and teams the person has already mentioned, with the likeliest first (finance for how reconciliation works). Write exactly "Not known" only when the person rejects every option. Before adding a row, check the file: if the question is already there, leave it.

Nothing else needs recording between sessions: the page, the model and the questions file are the state. When the person gives the URL of the system's repository, add it as a `link` on the system in the model; a path on their machine is only for this session.

## Start every session by finding where they are

1. Settle which system. The starter's sample "Software System" is not one to document: in a fresh repository, ask which system the person wants to start with. Otherwise, if one real system's page is unfinished, propose it; if not, ask, offering the systems in the model and "a new one".
2. Read its page, its part of the model, its questions file and the decisions in `docs/decisions/` that mention it. Each section is in one of three states:
   - **not started:** it still has its italic placeholder, or shows a view the model doesn't have. For Context, Containers and Key flows the main point is the view: once the view shows the real elements, the section is written, and any missing reason, such as why the system is split this way, is a question;
   - **written, still open:** its main point is written, but the questions file still has rows for it, or it falls short of what its skill asks (Quality goals with fewer than three ranked goals, each with who needs it and why, as `quality-goals` asks);
   - **done:** written, with no rows left and nothing short.
3. Tell the person in two or three sentences what is done, what is waiting on whom (from the questions file, with dates), and what comes next. Mention anything that won't build, such as a view the page uses that the model doesn't have.
4. If there are open questions, ask first whether any were answered, as a multi-select question listing them. Write each answer where it belongs and remove its row.
5. If a system's `peopleConfirmed` date is more than about six months old, ask whether its people are still right, and update the date when they confirm.
6. Ask how much time they have, and plan to stop at a natural point within it.

## The path

**First pass: done for now.** About half an hour, and worth publishing on its own:

1. **Purpose and stakeholders.** Why the system exists, who depends on it and for what. Written under Purpose.
2. **Quality goals.** Follow the `quality-goals` skill: the top three, ranked, with scenarios.
3. **Context.** The people who use the system and the systems it talks to, with who owns each, following `c4-modeling`. No internals yet. Someone named under Purpose belongs in the model as an actor even while how they use the system is unknown; that relationship is a question.

   Then, for the system and each external system it talks to, ask who to go to, as `AGENTS.md` describes: who integrated it, its experts, its contributors and its administrators. Open with one sentence on why, naming the jobs: "When something breaks or needs changing, these say whom to ask: the experts for an incident or an integration change, the administrators for credentials and the vendor account, whoever integrated it for why it works this way." Ask as multiple-choice questions offering the people already mentioned; add a new person to `model/people.json` before using their handle, and set `peopleConfirmed` to today. If you can already read the code, suggest contributors from its git history as step 4 describes. If the site uses the editable-metadata addon, show them under Context with `<People of="<id>" />`.

The first pass is done for now when all three are at least written, with open questions allowed: done for now means worth publishing, not complete. Two goals the person can't order between are written as tied, with the order as a question; don't decide it for them. Then say plainly: "This is done for now: Payments has a purpose, its goals and its context, and it's worth publishing." Offer to review it with the `architecture-review` skill, and to stop or go on.

**Second pass: the rest.** These are a menu, not an order: take whichever the person has answers for, each a short session of its own. A question from another topic that comes up naturally can be asked when it does.

4. **Containers.** Ask them to point at the code, compose files or manifests and read those; if there is nothing to read, their description is enough. Confirm with them what code can't say: who owns what, and why it is split that way. A container's `technology` is what it is built with; when nobody knows, leave it out and add a question rather than writing how it is deployed. How it runs, when that matters to a reader ("runs every Friday"), goes in its description. A link that is all but certain, such as a service and its own database, is one quick yes-or-no question, not a row in the file.

   When you can read the code's git history, suggest contributors from it: for an external system, the authors of the files that integrate it (`git log --format='%an' -- <paths>`); for the system itself, the repository's recent authors. Git gives names, not handles: match each to an entry in `model/people.json` by name, and offer the unmatched ones as new people to add. Offer them all for the person to confirm, and record only those they confirm.
5. **Key concepts.** The few ideas the system is built around, in the team's words; not class names.
6. **Key flows.** The one or two flows people ask about most, as dynamic views, walked through by the person step by step. If nobody can walk through one, leave the section's placeholder.
7. **Principles and decisions.** For each significant choice, ask why. Record each answered one as an ADR with `bin/adr new`; where that script is missing, write the next numbered file in `docs/decisions/` in the same adr-tools format, dated today, with when the decision was made in its context. Summarize the principles on the page.
8. **Deployment,** only if environments differ in what runs where. See `c4-modeling`'s `deployment.md`.
9. **Where it's heading.** What is being added, replaced or retired, and why.

Finish the second pass with an `architecture-review`.

## How to ask

People doing this for the first time don't know what a good answer looks like.

- Take one topic at a time. Open each with one sentence on why it matters and an example of a good answer: "The purpose is the paragraph everyone reads. For example: 'Orders exists so an order is never lost or charged twice between checkout and fulfilment.'"
- Ask multiple-choice questions where there are clear options (AskUserQuestion in Claude Code), and open questions for reasons.
- "I don't know" is a good answer. Ask who might know, add the question to the file, and move on.
- Add a question to the file only when its answer would change what the page says; a section needs its few most important questions, not every one you can think of.
- Write only what the person said, or what you read in the code they pointed you to and they confirmed. Don't rank goals in the order they happened to be mentioned, define concepts, draw flows, choose protocols or record decisions on their behalf: each of those is a question.
- Leave a section's placeholder in place until its main point is written, even if a component such as the decisions table is already there. A half-filled page reads as finished.

## End every session

Run `npm run validate`, `npm test` and `npm run build`, and fix what they report. Then tell the person what you wrote, what the next session will start with, and the open questions with who to ask, so they can ask those people before they come back.

## References

- Context and container views are enough for most teams, which is why the first pass stops at context: [c4model.com diagrams](https://c4model.com/diagrams)
- Quality goals as the top few qualities that drive the architecture, documented early: arc42's [Introduction and Goals](https://docs.arc42.org/section-1/), by Gernot Starke and Peter Hruschka, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); this skill links to and paraphrases arc42 and copies none of its text
- Recording decisions as ADRs: Michael Nygard, [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), and [adr-tools](https://github.com/npryce/adr-tools)
- The order of topics, the "done for now" stop and the questions file are this toolkit's own design, tested with agents rather than taken from a source.
