# The ISO/IEC 25010:2023 quality model, in plain terms

Nine kinds of quality, each split into specific qualities. Use these names in what you write, so every system in the repository uses the same vocabulary. The plain questions and meanings are for talking to people; don't make them learn the standard.

For real-world wording, example requirements and the tactics that achieve a quality, look it up on arc42's Q42 site: `https://quality.arc42.org/qualities/<name>`, the name in lowercase with hyphens (`fault-tolerance`, `time-behaviour`). If a page is missing, search the site. Q42 is a thinking aid; the names below are the ones to write.

Q42 is by Gernot Starke and licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Link to it and paraphrase; don't copy its text into the documentation unless you credit it, link the license and keep the copied part under the same license. The meanings and phrases on this page are written for this skill, not taken from Q42.

## Common phrases and what they usually mean

People rarely name a quality; they name a need. These are starting points for mapping, to confirm with the user.

| They say | Usually means |
| --- | --- |
| Never lose data, never lose money | Recoverability, Fault tolerance; Functional correctness for amounts |
| Exactly once, no duplicates, idempotent | Functional correctness |
| Audit trail, explain any change, traceability | Accountability, Integrity, Non-repudiation |
| Keep records for N years | Integrity, plus a scenario for the retention period |
| Uptime, SLA, always on | Availability |
| Fast, low latency, snappy | Time behaviour |
| Handles peak, Black Friday | Capacity, Scalability |
| Cheap to run | Resource utilization |
| Multi-cloud, no lock-in, runs on-prem | Adaptability, Replaceability |
| Easy to onboard developers, easy to change | Analysability, Modifiability, Modularity |
| Well tested, safe to deploy | Testability, Modifiability |
| GDPR, privacy, PII | Confidentiality, Integrity |
| Accessible, WCAG | Inclusivity, User assistance |
| Works with partner APIs, standard formats | Interoperability |

## Functional suitability: does it do the right thing?

| Quality | Means |
| --- | --- |
| Functional completeness | Covers everything users need it to do |
| Functional correctness | Gives correct, precise results |
| Functional appropriateness | Gets users to their goal without needless steps |

## Performance efficiency: is it fast enough, and frugal?

| Quality | Means |
| --- | --- |
| Time behaviour | Response time, latency, throughput |
| Resource utilization | CPU, memory, storage, network and cost per unit of work |
| Capacity | How much it handles at once: users, requests, data |

## Compatibility: does it work alongside other systems?

| Quality | Means |
| --- | --- |
| Co-existence | Shares an environment with other software without harming it |
| Interoperability | Exchanges data with other systems and uses what it receives |

## Interaction capability: can people use it?

| Quality | Means |
| --- | --- |
| Appropriateness recognizability | Users can tell whether it fits their need |
| Learnability | New users get productive quickly |
| Operability | Easy to operate and control |
| User error protection | Prevents user mistakes, or makes them harmless |
| User engagement | Pleasant and motivating to use |
| Inclusivity | Usable by people with different abilities, languages and contexts |
| User assistance | Helps users who need it, including assistive technology |
| Self-descriptiveness | Explains itself without outside documentation |

## Reliability: does it keep working?

| Quality | Means |
| --- | --- |
| Faultlessness | Works without faults in normal operation |
| Availability | Is up and reachable when needed |
| Fault tolerance | Keeps working when a part fails |
| Recoverability | Gets back to a correct state, without losing data, after a failure |

## Security: does it protect data and actions?

| Quality | Means |
| --- | --- |
| Confidentiality | Only those allowed can see data |
| Integrity | Data and actions can't be changed by those not allowed to |
| Non-repudiation | Nobody can deny an action they took |
| Accountability | Every action can be traced to whoever did it |
| Authenticity | Users and systems are who they claim to be |
| Resistance | Withstands attacks and keeps serving during them |

## Maintainability: can the team change it safely?

| Quality | Means |
| --- | --- |
| Modularity | A change in one part rarely touches others |
| Reusability | Parts can serve other systems |
| Analysability | Problems can be diagnosed and the effect of a change predicted |
| Modifiability | Can be changed without breaking or degrading it |
| Testability | Can be tested effectively |

## Flexibility: can it move, grow or adapt?

| Quality | Means |
| --- | --- |
| Adaptability | Runs in other environments: clouds, platforms, regions |
| Scalability | Grows or shrinks with load |
| Installability | Can be installed and removed easily |
| Replaceability | Can replace, or be replaced by, another product for the same job |

## Safety: can it avoid harm?

| Quality | Means |
| --- | --- |
| Operational constraint | Keeps operating within safe limits |
| Risk identification | Recognizes conditions that could lead to harm |
| Fail safe | Falls back to a safe state when it fails |
| Hazard warning | Warns people of dangers |
| Safe integration | Stays safe when combined with other systems |
