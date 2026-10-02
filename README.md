# Associatieruimte v0.1

Een gratis reflectie-oefening voor Je Kern tot Bloei. De app beheert de interactie; de gebruiker geeft zelf betekenis aan beelden, woorden en hun ordening.

## Lokaal draaien

Open een terminal in deze map:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Er zijn geen dependencies of buildstappen. Dubbelklikken op index.html werkt niet betrouwbaar omdat questions.json via fetch wordt geladen.

## Bestanden

- index.html: pagina en lokale beveiligingsregels
- styles.css: warme, responsive vormgeving
- app.js: negen stappen, lokale sessie en canvasbediening
- questions.json: geordende stappen, categorieën en vraagteksten
- images/: vijf eigen SVG-placeholderbeelden

Vragen kunnen binnen `fields` herschreven en geordend worden. Stappen zijn herkenbaar aan hun `id`; behoud deze id's en de veldsleutels bij tekstwijzigingen. Nieuwe vraagbewegingen vragen later mogelijk ook aanpassing van de flow. `{selectedElement}` wordt letterlijk vervangen door het gekozen woord, zonder analyse.

## Privacy en bediening

Antwoorden worden uitsluitend opgeslagen onder `associatieruimte.v01` in localStorage op het gebruikte domein. Ze blijven na sluiten of verversen beschikbaar op dezelfde browser. Er worden geen antwoorden naar een server verstuurd. De app laadt alleen eigen statische bestanden, gebruikt geen cookies, analytics, AI, accounts of database. Op gedeelde apparaten kan een volgende gebruiker van dezelfde browser de sessie zien; gebruik Mijn sessie wissen om deze te verwijderen. Bij geblokkeerde opslag werkt de oefening zolang het tabblad openblijft.

Woorden worden uitsluitend handmatig toegevoegd. Klik of tik op een woord om het te selecteren. Versleep het of gebruik de richtingknoppen; ook de pijltjestoetsen werken op een geselecteerd woord. Gebruik Groter, Kleiner of Verwijderen. Positie en grootte worden niet geïnterpreteerd. Alle reflectievelden na de beginvraag kunnen leeg blijven. Geen inzicht, ‘nee’ of ‘weet ik niet’ zijn geldige uitkomsten. Opnieuw beginnen wist ook de vorige sessie.

## Plaatsen op de website

Upload alle bestanden met behoud van de mapstructuur naar bijvoorbeeld `/associatieruimte/`, of naar de documentroot van een subdomein. Alle paden zijn relatief. Alleen statische hosting is nodig, zonder serverapplicatie. Gebruik bij voorkeur HTTPS. Er is in dit prototype geen publicatie of hosting ingesteld.

De SVG-beelden zijn voor dit prototype gemaakt en bevatten geen externe bronnen.
