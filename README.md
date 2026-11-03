# Marketing-KPI-Rechner

Ein einfacher Rechner für Marketing-Kennzahlen: **CPM, CPC, CTR, ROAS, ROI, GRP** und viele mehr.
Gedacht zum Lernen und Üben, z. B. im Unterricht oder für die Matura.
Läuft offline, braucht keine Installation und speichert nichts.

## Starten mit einem Klick

1. Lade diesen Ordner herunter. Auf GitHub: **Code → Download ZIP**, danach die ZIP-Datei entpacken.
2. Doppelklick auf
   - **Windows:** `KPI-Rechner starten (Windows).cmd`
   - **Mac:** `KPI-Rechner starten (Mac).command`

Der Rechner öffnet sich in einem eigenen Fenster wie eine App, ohne Tabs und Adressleiste.

> **Es geht auch ohne Startdatei:** Doppelklick auf `app/kpi-rechner.html` öffnet den Rechner im Browser.
> Diese eine Datei enthält die ganze App. Du kannst sie auf einen USB-Stick kopieren oder per Mail verschicken.

<details>
<summary>Windows oder Mac zeigt eine Warnung?</summary>

- **Windows** („Der Computer wurde durch Windows geschützt“): auf **Weitere Informationen → Trotzdem ausführen** klicken.
  Das passiert bei heruntergeladenen Startdateien. Die Datei öffnet nur `app/kpi-rechner.html` in Edge oder Chrome.
  Du kannst sie mit dem Editor ansehen.
- **Mac** („kann nicht geöffnet werden“): Rechtsklick auf die Datei → **Öffnen** → **Öffnen**. Das ist nur beim ersten Mal nötig.

</details>

## So funktioniert’s

1. **Kanal wählen:** Online, TV, Radio oder weitere Offline-Kanäle (Print, Out-of-Home, Mailing).
2. **Bekannte Zahlen eintragen**, z. B. Mediabudget und Impressions. Oder **Beispiel laden** klicken.
3. **Ergebnisse ablesen:** Alle KPIs, die sich berechnen lassen, erscheinen sofort.
   Unter **So wird gerechnet** steht bei jeder KPI die Formel mit deinen Zahlen.

Weitere Hilfen:
- **Gesperrte KPIs** zeigen, welche Eingabe noch fehlt. Ein Klick darauf springt direkt zum passenden Feld.
- **Rückwärts rechnen** geht auch: Mediabudget + CPM ergibt die Impressions.
- **Widersprüchliche Zahlen** werden erkannt und erklärt.
- **Export** als CSV (für Excel) oder **Drucken / Als PDF speichern**.

| Kategorie | KPIs |
|---|---|
| **Online** | CPM, CPC, CPA, CPL, CPV, CTR, Conversion-Rate, View-Rate, Ø Kontaktfrequenz, Umsatz pro Conversion |
| **TV / Radio** | Rating Points (GRP/TRP), erreichte Personen, Bruttokontakte, Ø Spot-Rating, CPP, TKP, Kosten pro Spot |
| **Print** | Leserkontakte, Kosten pro 1.000 Exemplare, TKP, Kosten pro Schaltung |
| **Out-of-Home** | Bruttokontakte, Ø Kontaktfrequenz, TKP, Kosten pro Fläche und Woche |
| **Mailing** | Responsequote, Bestellquote, Kosten pro Mailing / Response / Bestellung, Umsatz pro Mailing |
| **Geschäftsergebnis** (überall) | ROAS, Marketing-ROI, Deckungsbeitrag nach Media, Break-even-ROAS |

**Gut zu wissen**
- Zahlen im deutschen Format eingeben: `1.234,56`. Prozent als Zahl: `50` bedeutet 50 %.
- Der ROI braucht eine Deckungsbeitragsquote. Der Rechner nimmt nie stillschweigend 100 % Marge an.
- Rating Points beziehen sich auf die eingegebene Grundgesamtheit: Gesamtbevölkerung ergibt GRP, Zielgruppe ergibt TRP.
- Nichts wird gespeichert oder verschickt. Beim Schließen oder Neuladen sind die Eingaben weg.

## Wie diese App entstanden ist

Die App wurde komplett mit KI gebaut (Claude Code). In **[PROMPTS.md](PROMPTS.md)** stehen alle Prompts
wortwörtlich. Damit kannst du das Ganze jederzeit selbst nachbauen.

---

## Für Entwickler

Benötigt Node.js 22+ (entwickelt mit Node 24). Stack: Vite, React 19, TypeScript, Tailwind CSS 4.

```sh
npm install
npm run dev          # Entwicklungsserver: http://localhost:5173
npm run build:app    # baut die Ein-Datei-App app/kpi-rechner.html (wird mit eingecheckt)
npm run build        # PWA-Build mit Service Worker → dist/ (für Webhosting)
npm run preview      # PWA-Build lokal ansehen: http://localhost:4173
```

Nach jeder Änderung am Code `npm run build:app` ausführen und `app/kpi-rechner.html` mit committen,
damit die Ein-Klick-Version aktuell bleibt.

**Als installierbare Web-App (PWA):** `dist/` auf einen HTTPS-Webserver legen, z. B. GitHub Pages.
In Edge oder Chrome erscheint dann in der Adressleiste **App installieren**.
Neue Versionen werden nur nach Bestätigung geladen, weil das Neuladen die Eingaben löscht.

### Tests (testgetrieben entwickelt)

```sh
npm test                                   # Vitest: Rechenkern + Komponenten
npm run test:e2e                           # Playwright: Chromium, Edge, Firefox, WebKit, Mobile
npx playwright test --project=chromium     # nur ein Browser (schnell)
npm run lint                               # oxlint
```
Beim ersten Mal Browser installieren: `npx playwright install chromium firefox webkit` (Edge nutzt das installierte Microsoft Edge).

| E2E-Spec | Prüft |
|---|---|
| `categories.spec.ts` | jede Kategorie: alle KPIs gegen von Hand gerechnete Werte, Beispiele, Startzustand |
| `interactions.spec.ts` | Hinweise auf fehlende Eingaben, berechnete Werte, Konflikte, Eingabeformat, Hilfe, Anleitung, Deep Links, nur Light Mode, Tastaturbedienung, Mobile |
| `export.spec.ts` | CSV-Inhalt (BOM, `;`, Dezimalkomma, Konflikte), Drucklayout, A4-PDF |
| `a11y.spec.ts` | axe WCAG 2.2 AA für jede Kategorie, leer und ausgefüllt, inklusive Fehlerzuständen |
| `pwa.spec.ts` | Manifest, Offline-Betrieb, Update von Version A auf B mit zwei offenen Fenstern |
| `app-file.spec.ts` | die Ein-Datei-App direkt von der Festplatte (`file://`) |

### Struktur

```
app/kpi-rechner.html   die fertige Ein-Datei-App (gebaut, eingecheckt)
KPI-Rechner starten…   Startdateien für Windows und Mac
src/core/              Rechenkern ohne Framework (die gesamte Mathematik)
  catalog.ts           Größen, Formeln, Kategorien, Hinweise, Beispiele (alle Texte)
  solver.ts            Vorwärtsrechnen bis zum Fixpunkt + Widerspruchsprüfung
  view.ts              Zustände der KPI-Karten
  export.ts            CSV-Export
  format.ts            deutsches Zahlenformat (Eingabe und Ausgabe)
src/ui/                React-Komponenten
scripts/build-app.mjs  packt den Build in eine einzige HTML-Datei
e2e/                   Playwright-Tests
docs/PLAN.md           ursprünglicher Plan + Review-Entscheidungen
```

### Eine KPI hinzufügen
1. Die Größe (Bezeichnung, Einheit, Hilfetext, Grenzen) in `catalog.ts` anlegen.
2. Eine Beziehung mit `ratio(...)` / `product(...)` zur Kategorie hinzufügen. Die Umkehrformeln entstehen automatisch.
3. In einer `kpiGroups`-Gruppe eintragen und einen Hinweis (`hints`) ergänzen.
4. Zuerst den fehlschlagenden Test mit einem von Hand gerechneten Beispiel in `catalog.test.ts` schreiben.
   Die Integritätstests prüfen automatisch, dass die Hinweise die KPI wirklich freischalten und das Beispiel sie berechnet.
