# B4: Immo-Klartext

**Status:** Umgesetzt (2026-10-07)

## Idee

Ein eigener Klartext-Modus für Immobilien-Exposés und Hotel- bzw. Urlaubsangebote. „Makler-Deutsch“ und „Reisekatalog-Deutsch“ sind ein eigenes Genre („verkehrsgünstig“, „Liebhaberobjekt“, „zweckmäßig eingerichtet“). Der Modus ist bewusst getrennt von B3 (LinkedIn), damit jeder Prompt passende Beispiele und Regeln bekommt.

Die Texte werden von Hand eingefügt. Eine Anbindung an Portale ist verworfen: Die ImmoScout24-API gibt es nur mit Business-Konto und teils kostenpflichtig, Scraping verbieten die Portale, und der kostenlose Hotel-Zugang von Amadeus wurde am 17.07.2026 eingestellt.

## Anforderungen

| ID | Anforderung | Priorität | Stand |
|---|---|---|---|
| B4.1 | Dritte Option im Umschalter: **🏠 Immo-Klartext**. Auf schmalen Bildschirmen stehen die drei Optionen untereinander. | P0 | Umgesetzt |
| B4.2 | Eigene Beschriftungen: ein selbst geschriebenes Exposé als Platzhalter, Button „Klartext bitte“, Ladehinweis „Wird entmaklert …“, rechte Spalte „Klartext“. | P0 | Umgesetzt |
| B4.3 | Das Frontend schickt `mode: "immo"`. Der Worker nutzt dafür einen eigenen Prompt (`IMMO_PROMPT`). | P0 | Umgesetzt |
| B4.4 | Typische Euphemismen werden aufgelöst. Harte Fakten (Preis, Fläche, Zimmerzahl, Entfernungen) bleiben unverändert erhalten, neue Fakten werden nicht erfunden. | P0 | Umgesetzt |
| B4.5 | Der Klartext hat dieselbe Sprache wie das Angebot (Deutsch oder Englisch). | P0 | Umgesetzt |

## Entscheidungen

- **Prompt auf Englisch** mit einer Liste typischer Euphemismen und je einem deutschen und einem englischen Beispiel (Exposé und Hotel).
- **Fakten als PFLICHT-Regel.** Ohne sie fehlte einmal die Miete, und aus „2-Zimmer“ wurde „2-bedroom“. Der Prompt stellt deshalb ausdrücklich klar, dass ein deutsches „Zimmer“ kein „bedroom“ ist.
- **Spracherkennung wie bei B3** über `withLanguage()`. Die Aufforderung am Ende der Nutzer-Nachricht steht in der Zielsprache.
- **`temperature` 0.4 statt 0.8.** Bei 0.8 kam das deutsche Exposé in etwa jedem vierten Durchlauf auf Englisch zurück. Bei 0.4 waren alle 11 Immo-Tests in der richtigen Sprache. Der Nachteil: Die Antworten ähneln einander stärker und übernehmen gern Formulierungen aus dem Beispiel („in einer Gegend, in der noch nichts los ist“).
- **Testtexte selbst geschrieben**, nicht aus echten Anzeigen. Als Fundus für weitere Tests eignen sich Inside Airbnb (Berlin, CC BY 4.0, Namensnennung nötig) und der Kaggle-Datensatz „Apartment rental offers in Germany“.

## Beispiel

> **Angebot:** Unser familiär geführtes Hotel liegt zentral in lebhafter Umgebung, nur wenige Minuten vom Strand entfernt. Die zweckmäßig eingerichteten Zimmer bieten teilweise Meerblick. Ab 39 € pro Nacht.
>
> **Klartext:** Ein einfaches Hotel in einer lauten Gegend. Der Strand ist ein paar Minuten entfernt. Die Zimmer haben das Nötigste und kosten ab 39 € pro Nacht. Vielleicht sieht man vom Balkon ein Stück Meer.
