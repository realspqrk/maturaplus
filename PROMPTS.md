# Die Prompts – so wurde diese App gebaut

Diese App wurde vollständig von einer KI programmiert: mit **Claude Code** (Modell *Claude Opus 5.5*).
Hier stehen **alle Prompts, die dafür eingegeben wurden – wortwörtlich, inklusive Tippfehlern**.
Mehr war nicht nötig.

So kannst du es selbst nachmachen:

1. Installiere [Claude Code](https://claude.com/claude-code) und öffne einen leeren Ordner im Terminal.
2. Starte `claude`.
3. Kopiere Prompt 1 hinein und schick ihn ab. Wenn Claude Fragen stellt, antworte wie unten angegeben.
4. Mach mit den weiteren Prompts der Reihe nach weiter, sobald Claude mit dem vorherigen fertig ist.

> **Hinweis:** KI-Antworten sind nie zweimal gleich. Du bekommst eine *ähnliche* App, nicht exakt dieselbe.
> Genau das ist spannend: Vergleich dein Ergebnis mit diesem hier.

---

## Prompt 1 – die Idee

```text
We need a tool for maketing kpi.

In a nice modern intuitive guide UI. Research modern guidelines and paradigms.

Requirements: 
- we want to calculate tpyical kpis like cpm, cpc, roas, roi, ... this is a starting point
- it should run offline
- modern ui with modern programming language
- install tooling required
- think in categories like tv kpis, online kpis, other offline, ...
- use codex for adverserial review of the plan as well as code review and visual review, use /harness-subagent 
- use principles of tdd
- after a quick research, prompt me questions when not obvious and recommended solution available
```

**Rückfragen von Claude und die gewählten Antworten** (Auswahl per Klick):

| Frage | Gewählte Antwort |
|---|---|
| How should the offline app be delivered? | PWA (Recommended) |
| Which interaction model should the guided UI use? | Hybrid (Recommended) |
| What's in scope for v1 beyond the calculations? | Export CSV/PDF, Pure calculator only |
| Language and currency? | English only, EUR *(später durch Prompt 5 geändert)* |

*`/harness-subagent` ist ein Claude-Code-Skill, der eine zweite KI (hier: OpenAI Codex) für Reviews einbindet.
Hast du ihn nicht, lass den Teil `use /harness-subagent` weg. Claude prüft dann selbst oder fragt nach.*

## Prompt 2 – alles testen

```text
Full E2E test
```

## Prompt 3 – ausprobieren

```text
run the app
```

## Prompt 4 – fertig machen

*(neue Sitzung)*

```text
Let's finalize. Make sure it is a nice one-click app that acts like an app. Light mode only. Exemplary use for students is the primary use case, so make it extremely easy to use and learn. Make it a Git repo. Needs to contain a simple and easy-to-understand file with the exact used user prompts, so users could replicate any time.
```

## Prompt 5 – auf Deutsch

*(während Claude noch an Prompt 4 gearbeitet hat)*

```text
and UI in german only! (with special terms like roi etc staying english when they are standardized english)
```

---

## Was du daraus lernen kannst

- **Prompt 1 ist der wichtigste.** Er sagt *was* gebaut wird (KPI-Rechner), *wie* (offline, modern, nach Kategorien) und *wie gearbeitet wird* (erst recherchieren, dann fragen, testgetrieben entwickeln, von einer zweiten KI prüfen lassen).
- **Kurze Folge-Prompts reichen**, wenn die KI den Kontext schon kennt: „Full E2E test“ hat eine komplette Testsuite für fünf Browser ausgelöst.
- **Rückfragen zulassen** („prompt me questions“) verhindert, dass die KI wichtige Entscheidungen einfach rät.
- **Tippfehler sind egal.** „maketing“ und „tpyical“ wurden problemlos verstanden.
