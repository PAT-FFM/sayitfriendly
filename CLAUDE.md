# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Worum es geht

„Say it friendly“ ist eine Übungs-App aus dem Bildungsurlaub Agentic Coding. Sie formt einen eingegebenen Text per LLM in satirisch überzogenen Corporate-Sprech um und zeigt Original und Umformulierung nebeneinander.

**`ai_docs/PRD.md` ist die maßgebliche Spezifikation.** Darin stehen der API-Vertrag, das Modell und seine Parameter, der System-Prompt, die Akzeptanzkriterien und die offenen Punkte. Wenn sich Verhalten ändert, wird das PRD mitgepflegt. Bonus-Aufgaben (B1 Kopieren-Button, B2 Ton-Auswahl) bekommen je eine eigene Feature-Spec unter `ai_docs/features/`. Sie sind bewusst noch nicht umgesetzt.

Live: https://sayitfriendly.trumpp-dev.workers.dev

## Befehle

Es gibt kein `package.json`, keinen Build-Schritt, keinen Linter und keine Tests. Wrangler wird per `npx` aufgerufen.

```bash
npx wrangler dev            # lokal auf http://localhost:8787
npx wrangler deploy         # live deployen
npx wrangler tail           # Live-Logs des deployten Workers

# Endpoint testen
curl -X POST http://localhost:8787/api/friendly \
  -H 'Content-Type: application/json' \
  -d '{"text":"Das Meeting war komplett sinnlos und du hast mal wieder alles verbockt."}'
```

## Architektur

Ein **einziger Cloudflare Worker** liefert sowohl das Frontend als auch die API aus. Beides hat dieselbe Herkunft, deshalb gibt es kein CORS.

- `wrangler.jsonc` bindet `public/` als Static Assets (`ASSETS`) und Workers AI (`AI`). Wegen `run_worker_first: ["/api/*"]` läuft nur `/api/*` durch den Worker-Code. Alle anderen Pfade liefert Cloudflare direkt aus `public/` aus, ohne `src/index.js` auszuführen.
- `src/index.js` enthält die Konstanten `MODEL` und `SYSTEM_PROMPT` sowie die Route `POST /api/friendly`. Der Request ist `{ text }`, die Antwort `{ friendly }`. Im Fehlerfall kommt `400` oder `500` mit `{ error }`.
- `public/app.js` ist reines Vanilla-JS ohne Framework und ohne Build. Es zeigt `data.error` des Servers direkt an. Bei einem Netzwerkfehler (`TypeError`) erscheint ein eigener Hinweis. Neue Fehlerpfade im Worker sollten deshalb immer JSON mit einem verständlichen deutschen `error` liefern.

## Stolpersteine

- **Workers AI läuft immer remote.** Auch unter `wrangler dev` ruft jede Anfrage an `/api/friendly` das echte Modell im Cloudflare-Account auf und verbraucht Free-Tier-Kontingent. Dafür ist ein `wrangler login` nötig.
- **`compatibility_date` steht auf `2026-06-01`.** Die installierte Wrangler-Version (4.95) startet `wrangler dev` mit einem neueren Datum nicht. Das Datum darf erst nach einem Wrangler-Update angehoben werden.
- **Direkt nach `wrangler deploy`** kann `/api/*` einige Sekunden lang `error code: 1042` (404) liefern, obwohl die Seite schon lädt. Kurz warten und erneut testen.
- **Englische Eingaben** bekommen gelegentlich deutsche Buzzwords aus dem Prompt (z. B. „proaktive“). Das ist als offener Punkt im PRD vermerkt.
