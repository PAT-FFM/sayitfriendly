# PRD: Say it friendly

## 1. Überblick

**Ziel:** Eine minimale Web-App, die einen beliebigen Text entgegennimmt und ihn per LLM in eine sehr freundliche, scheinbar positive Variante im **Corporate-Sprech** umformt. Original und Umformulierung stehen nebeneinander. Die App ist unter einer öffentlichen HTTPS-URL erreichbar.

**Kontext:** Übung (Einzelarbeit, Richtwert 45 Minuten). Die App wird mit Claude Code gebaut, lokal getestet und auf Cloudflare deployt.

**Ergebnis:** Eine öffentliche Web-Adresse, unter der man einen Text eingibt und die geschönte Corporate-Variante daneben sieht.

## 2. Zielgruppe

Lernende der Übung, die den Ablauf Planen → Bauen → Testen → Deployen einmal vollständig durchlaufen, diesmal mit einem eigenen kleinen Backend (Endpoint) und einem LLM. Endnutzer der App sind alle, die die Live-URL öffnen.

## 3. Architektur und Datenfluss

```
Browser (index.html)
   │  POST /api/friendly  { "text": "..." }
   ▼
Cloudflare Worker  ──►  Workers AI (Binding env.AI)
   │  200 { "friendly": "..." }
   ▼
Browser: Original | Umformulierung
```


| Baustein | Technik                                                           | Aufgabe                                                          |
| -------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| Frontend | Statisches HTML/CSS/JS, vom Worker als Static Assets ausgeliefert | Eingabe, Absenden, Anzeige nebeneinander                         |
| Endpoint | Cloudflare Worker, Route `POST /api/friendly`                     | Prompt bauen, Workers AI aufrufen, Ergebnis als JSON zurückgeben |
| LLM      | Workers AI über das Binding `AI`                                  | Umformulierung in Corporate-Sprech                               |


- Frontend und Endpoint laufen im **selben Worker unter derselben URL**. Dadurch ist kein CORS nötig.
- Workers AI läuft über ein Binding. Es wird **kein externer API-Key** gebraucht, das Free-Tier reicht für die Übung.



### API-Vertrag


|                  |                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Methode / Pfad   | `POST /api/friendly`                                                                                      |
| Request-Body     | `{ "text": "<Originaltext>" }`                                                                            |
| Antwort (Erfolg) | `200` mit `{ "friendly": "<umformulierter Text>" }`                                                       |
| Antwort (Fehler) | `400`, wenn `text` fehlt oder leer ist, sonst `500`. Jeweils mit `{ "error": "<verständliche Meldung>" }` |




### Verhalten des LLM

- Der Text wird in **satirisch überzogenen Corporate-Sprech** umformuliert: viele Buzzwords und Anglizismen, deutlich als Parodie erkennbar („Herausforderung“ statt „Problem“, „Learnings“ statt „Fehler“, „Lass uns zeitnah alignen“ statt „Das ist Mist“).
- Der **Inhalt bleibt erhalten.** Die Kernaussage ist weiterhin erkennbar, sie klingt nur scheinbar positiv.
- **Ausgabesprache = Eingabesprache** (Deutsch rein → Deutsch raus, Englisch rein → Englisch raus).
- Auch Texte, die schon freundlich sind, werden **immer umgeformt**. Es gibt keinen Sonderfall.
- Ausgegeben wird **nur der umformulierte Text**, ohne Einleitung („Hier ist …“), Erklärung oder Anführungszeichen.

**Beispiel:**


| Original                                                                | Umformulierung (etwa)                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Das Meeting war komplett sinnlos und du hast mal wieder alles verbockt. | Danke für den wertvollen Austausch im heutigen Termin! Ich sehe hier großes Potenzial, unsere Synergien noch gezielter zu heben. Lass uns zeitnah alignen, wie wir die Learnings aus deinen aktuellen Deliverables gemeinsam in echte Wins verwandeln können. 🚀 |




### Modell und Parameter


| Einstellung   | Wert                                           | Begründung                                                                                                       |
| ------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Modell        | `@cf/mistralai/mistral-small-3.1-24b-instruct` | Europäisches Modell mit starkem Deutsch, 128k Kontext, günstig.                                                  |
| `temperature` | `0.8`                                          | Der Standardwert 0.15 liefert zu brave, gleichförmige Texte. Für Satire braucht es mehr Kreativität.             |
| `max_tokens`  | `1024`                                         | Der Standardwert 256 schneidet längere Umformulierungen ab. Corporate-Sprech wird meist länger als das Original. |


- Der Aufruf erfolgt mit `env.AI.run(model, { messages, temperature, max_tokens })`. Dabei enthält `messages` den System-Prompt (`role: "system"`) und den Originaltext unverändert als `role: "user"`.
- Der Text der Antwort steht im Feld `response`. Der Worker entfernt Leerzeichen am Anfang und Ende (`trim`) und gibt ihn als `friendly` zurück.



### System-Prompt

```text
Du bist ein übermotivierter Corporate-Communications-Profi. Deine einzige Aufgabe:
Formuliere den Text des Nutzers in satirisch überzogenen, scheinbar positiven
Corporate-Sprech um.

Regeln:
- Die Kernaussage des Originals muss erkennbar bleiben, auch wenn sie negativ ist.
  Verpacke sie nur in freundliche, wertschätzende Worte.
- Übertreibe bewusst: Buzzwords, Anglizismen und Management-Floskeln wie
  Synergien, Learnings, alignen, Potenzial heben, Deliverables, Win-win, proaktiv.
- Aus Problemen werden Herausforderungen, aus Fehlern Learnings, aus Kritik Impulse.
- Antworte in derselben Sprache wie der Originaltext.
- Forme jeden Text um, auch wenn er schon freundlich ist.
- Gib ausschließlich den umformulierten Text aus. Keine Einleitung, keine Erklärung,
  keine Anführungszeichen, keine Überschrift.
- Alle zwei-drei Zeilen ein Emoji, gerne die "Rakete"
```

Der Prompt steht als Konstante `SYSTEM_PROMPT` in `src/index.js`. Für Bonus B2 (Ton-Auswahl) wird daraus später ein Prompt je Ton.

## 4. Funktionale Anforderungen


| ID  | Anforderung                                                                                                                                           | Priorität |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| F1  | Mehrzeiliges Eingabefeld (`textarea`) und ein Button „Freundlich machen“.                                                                             | Muss      |
| F2  | Beim Klick schickt das Frontend den Text per `POST /api/friendly` an den Worker.                                                                      | Muss      |
| F3  | Der Worker formt den Text über Workers AI gemäß Abschnitt 3 um und gibt ihn als JSON zurück.                                                          | Muss      |
| F4  | Original und Umformulierung stehen **nebeneinander** (zwei Spalten). Auf schmalen Bildschirmen stehen sie untereinander.                              | Muss      |
| F5  | Während der Anfrage gibt es einen Ladezustand: Der Button ist deaktiviert und ein Hinweis wie „Wird schöngefärbt …“ ist sichtbar.                     | Muss      |
| F6  | Ein leerer Text wird nicht abgeschickt.                                                                                                               | Muss      |
| F7  | Bei einem Fehler (Netzwerk, LLM, 4xx/5xx) erscheint ein verständlicher Hinweis statt einer leeren Seite. Ein neuer Versuch ist ohne Neuladen möglich. | Muss      |




### Bonus (optional, falls früher fertig)

Jede Bonus-Aufgabe hat eine eigene Feature-Spec. Dort stehen Details, Entscheidungen und der Stand je Anforderung (P0/P1/P2). Hier steht nur der grobe Status: Offen, Spezifiziert oder Umgesetzt.


| ID  | Anforderung                                                                                                                             | Feature-Spec                         | Status |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------ |
| B1  | Kopieren-Button: Die Umformulierung wird per Klick in die Zwischenablage kopiert, mit kurzer Bestätigung („Kopiert!“).                  | [B1](features/B1_kopieren-button.md) | Offen  |
| B2  | Ton-Auswahl: Dropdown mit Corporate (Standard), zuckersüß und passiv-aggressiv. Der Ton wird als Feld `tone` an den Endpoint übergeben. | [B2](features/B2_ton-auswahl.md)     | Offen  |




## 5. Nicht-funktionale Anforderungen und Einschränkungen

- **Technologie Frontend:** reines HTML, CSS und JavaScript, ohne Framework, Build-Schritt oder npm-Abhängigkeiten im Frontend.
- **Technologie Endpoint:** Cloudflare Worker (JavaScript, ES-Module) mit Workers AI über das Binding `AI`.
- **Quellcode-Ablage:**
  - `public/` enthält die Static Assets (`index.html`, `style.css`, `app.js`).
  - `src/index.js` enthält den Worker (Route `/api/friendly`, alles andere liefert die Assets aus).
  - `wrangler.jsonc` liegt im Projektstamm und enthält die Bindings `assets` und `ai`.
- **HTTPS:** Alle Requests laufen über HTTPS. Weil Frontend und API dieselbe Herkunft haben, gibt es keine CORS-Konfiguration.
- **Keine API-Keys** oder Secrets im Code. Workers AI braucht keine.
- **Kein Schutz im MVP:** Längenlimit, Rate-Limiting und Methodenprüfung werden in dieser Übung bewusst weggelassen. Die Live-URL sollte deshalb nur im Kurs geteilt werden.
- **Robustheit:** Ein Fehler bei Workers AI bringt den Worker nicht zum Absturz. Er antwortet mit `500` und JSON-Fehlermeldung (siehe API-Vertrag).



## 6. Lokale Entwicklung und Deployment

- **Einmalig:** Cloudflare-Account (kostenlos) und `npx wrangler login`.
- **Lokal testen:** `npx wrangler dev`. Achtung: Das AI-Binding ruft auch lokal das echte Workers AI in der Cloud auf. Dafür braucht es den Login, und die Aufrufe zählen gegen das Free-Tier.
- **Deployen:** `npx wrangler deploy`. Danach ist die App unter `https://<worker-name>.<account>.workers.dev` erreichbar, HTTPS ist automatisch aktiv.



## 7. Vorgehen

Nach jedem Schritt wird das Ergebnis geprüft, bevor der nächste beginnt.

1. **Planen:** Anforderungen als Prompt formulieren (dieses PRD).
2. **Bauen:** Claude Code erzeugt Worker, Frontend und `wrangler.jsonc`.
3. **Testen:** Lokal mit `npx wrangler dev` im Browser prüfen. Optional wird der Endpoint vorher per `curl` getestet.
4. **Deployen:** Öffentliche URL mit `npx wrangler deploy` erzeugen.



## 8. Akzeptanzkriterien („Fertig, wenn …“)

- [x] Die Live-URL öffnet sich im Inkognito-Fenster. (Live: [https://sayitfriendly.trumpp-dev.workers.dev](https://sayitfriendly.trumpp-dev.workers.dev))
- [x] Der Satz „Das Meeting war komplett sinnlos und du hast mal wieder alles verbockt.“ erscheint innerhalb von 10 Sekunden als Corporate-Variante neben dem Original.
- [x] Ein englischer Eingabetext wird auf Englisch umformuliert.
- [x] Die Antwort enthält nur den umformulierten Text, keine Einleitung wie „Hier ist …“.
- [x] Schlägt die Anfrage an `/api/friendly` fehl (Netzwerkfehler, 4xx/5xx oder Antwort ohne JSON), erscheint in der bereits geladenen Seite ein verständlicher Hinweis. Ein neuer Versuch ist ohne Neuladen möglich. *Test lokal: Seite laden, `wrangler dev` stoppen, absenden.*
- [x] Die Live-URL wurde im Chat geteilt.



## 9. Offene Punkte

Diese Punkte sind noch nicht festgelegt und werden bei der Umsetzung entschieden:

- Gestaltung und Layout der Oberfläche. Sie soll einfach und übersichtlich sein.
- Konkrete Hinweistexte im Fehlerfall.
- Das Modell übernimmt bei englischer Eingabe gelegentlich deutsche Buzzwords aus dem Prompt (z. B. „proaktive“). Lässt sich über den Prompt lösen.
- `compatibility_date` steht auf `2026-06-01`, weil Wrangler 4.95 kein neueres Datum kennt.

