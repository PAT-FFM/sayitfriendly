# B3: Klartext-Modus

**Status:** Umgesetzt (2026-10-07)

## Idee

Die App wird in die Gegenrichtung umgedreht: Statt einen ehrlichen Text schönzufärben, wird ein LinkedIn-Post in trockenen Klartext zurückübersetzt. Das ist ein reiner Witz. Deshalb geht es um LinkedIn und nicht um Pressemitteilungen der Regierung, bei denen eine falsche Deutung peinlich wäre.

## Anforderungen

| ID | Anforderung | Priorität | Stand |
|---|---|---|---|
| B3.1 | Umschalter über dem Eingabefeld: **😊 Freundlich** (Standard) / **🔍 Klartext**. | P0 | Umgesetzt |
| B3.2 | Der Modus ändert Platzhalter, Button, Ladehinweis und die Überschrift der rechten Spalte (siehe Tabelle). Beim Umschalten wird ein altes Ergebnis ausgeblendet. | P0 | Umgesetzt |
| B3.3 | Das Frontend schickt `mode: "friendly" \| "plain"` an `POST /api/friendly`. Fehlt der Modus oder ist er unbekannt, gilt `"friendly"`. Das Verhalten ohne `mode` bleibt also unverändert. | P0 | Umgesetzt |
| B3.4 | Der Klartext ist kurz (1 bis 3 ganze Sätze in der Ich-Form), ohne Hashtags und Emojis, und benennt das eigentliche Motiv trocken statt bösartig. | P0 | Umgesetzt |
| B3.5 | Der Klartext hat dieselbe Sprache wie der Post (Deutsch oder Englisch). | P0 | Umgesetzt |

| | Freundlich | Klartext |
|---|---|---|
| Platzhalter | „Das Meeting war komplett sinnlos …“ | „I'm thrilled and humbled to announce …“ |
| Button | „Freundlich machen“ | „Klartext bitte“ |
| Ladehinweis | „Wird schöngefärbt …“ | „Wird entschwurbelt …“ |
| Rechte Spalte | „Freundlich“ | „Klartext“ |

## Entscheidungen

- **Gleicher Endpoint und gleiches Antwortfeld.** Auch im Klartext-Modus steht das Ergebnis in `friendly`. So bleibt der API-Vertrag stabil, auch wenn der Name hier nicht ganz passt.
- **Ein Prompt pro Modus** im Objekt `MODES` in `src/index.js`. Weitere Modi wären je ein zusätzlicher Eintrag.
- **Klartext-Prompt auf Englisch mit zwei Beispielen.** Ohne Beispiele lieferte das Modell nur Schlagworte („Jobwechsel.“).
- **Die Sprache erkennt der Worker selbst.** Das Modell hielt sich allein über den Prompt nicht an die Sprache des Posts. Mit deutschem Prompt kamen englische Posts auf Deutsch zurück, mit englischem Prompt deutsche Posts auf Englisch. Jetzt ermittelt `detectLanguage()` die Sprache grob über Umlaute und häufige Wörter. Die Nutzer-Nachricht hat dann die Form `Post (German): "…"\nPlain (German):`. Damit war die Sprache in 8 von 8 Tests richtig. Andere Sprachen als Deutsch und Englisch werden als Englisch behandelt.

## Beispiel

> **Post:** I'm thrilled and humbled to announce that after an incredible journey of 7 amazing years, I've decided to embark on a new chapter. 🚀 What I learned: failure is just success in progress. #grateful #leadership
>
> **Klartext:** I was fired. I want to look impressive to recruiters.
