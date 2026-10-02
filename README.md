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
- images/: drie eigen SVG-placeholderbeelden

Vragen kunnen binnen `fields` herschreven en geordend worden. Stappen zijn herkenbaar aan hun `id`; behoud deze id's en de veldsleutels bij tekstwijzigingen. Nieuwe vraagbewegingen vragen later mogelijk ook aanpassing van de flow. `{selectedElement}` wordt letterlijk vervangen door het gekozen woord, zonder analyse.

## Privacy en bediening

Antwoorden worden uitsluitend opgeslagen onder `associatieruimte.v01` in localStorage op het gebruikte domein. Ze blijven na sluiten of verversen beschikbaar op dezelfde browser. Er worden geen antwoorden naar een server verstuurd. De app laadt alleen eigen statische bestanden, gebruikt geen cookies, analytics, AI, accounts of database. Op gedeelde apparaten kan een volgende gebruiker van dezelfde browser de sessie zien; gebruik Mijn sessie wissen om deze te verwijderen. Bij geblokkeerde opslag werkt de oefening zolang het tabblad openblijft.

Woorden worden uitsluitend handmatig toegevoegd. Klik of tik op een woord om het te selecteren. Versleep het of gebruik de richtingknoppen; ook de pijltjestoetsen werken op een geselecteerd woord. Gebruik Groter, Kleiner of Verwijderen. Positie en grootte worden niet geïnterpreteerd. Alle reflectievelden na de beginvraag kunnen leeg blijven. Geen inzicht, ‘nee’ of ‘weet ik niet’ zijn geldige uitkomsten. Opnieuw beginnen wist ook de vorige sessie.

## Plaatsen op de website

Upload alle bestanden met behoud van de mapstructuur naar bijvoorbeeld `/associatieruimte/`, of naar de documentroot van een subdomein. Alle paden zijn relatief. Alleen statische hosting is nodig, zonder serverapplicatie. Gebruik bij voorkeur HTTPS. Er is in dit prototype geen publicatie of hosting ingesteld.

De SVG-beelden zijn voor dit prototype gemaakt en bevatten geen externe bronnen.

## Gerichte canvasaanpassingen

De ordenstappen worden bij navigatie overgeslagen zolang er minder dan drie zelf toegevoegde woorden of zinnen zijn. Er wordt geen minimum afgedwongen: de oefeningen en afronding blijven toegankelijk. De oefening rond een gekozen element gebruikt neutrale vragen. Bij de eerste interactieve opening staat de uitnodiging om vrij te spelen, ook wanneer de eerdere ordenstap is overgeslagen.

Op het canvas kan ieder element een eigen kleur krijgen. Cirkel en rechthoek zijn eenvoudige verplaatsbare en schaalbare vormen; er is geen tekenmodus. Ze delen de bestaande richting-, grootte- en verwijderknoppen. Vormen worden niet als woorden aan de onderzoekskeuzelijst toegevoegd en tellen niet mee voor het minimum van drie verzamelde woorden/zinnen. Kleur en vorm krijgen geen betekenis vanuit de app. Bestaande lokale sessies blijven leesbaar.

### Functionele controle

Met Node.js: `node tests/flow.cjs`. Deze test gebruikt een kleine DOM-simulatie en controleert de routes met 0, 2, 3 en 5 woorden, het later bereiken van drie woorden, letterlijk ingevoegde teksten, kleur/vormen, verplaatsen, schalen, verwijderen, hervatten en wissen op twee canvasafmetingen. Dit is geen visuele browsertest of echte touchtest.

## Flow en contact

Vanaf drie zelf verzamelde tekstelementen verschijnt de interactieve ruimte; vormen tellen niet mee. Zonder tekstelementen wordt de elementoefening overgeslagen. Met één of twee woorden kan iemand wel een element onderzoeken. Alle terugblikken zijn gemarkeerd als niet bewerkbaar. De veranderingsvraag is open en hoeft niet beantwoord of ruimtelijk uitgewerkt te worden.

Stel in questions.json `contactLinks.experience` en `contactLinks.introduction` onafhankelijk in op een eigen volledige https://- of mailto:-bestemming. Ze zijn standaard leeg: de twee knoppen zijn dan zichtbaar maar uitgeschakeld. Er worden geen antwoorden of sessiegegevens in de links opgenomen. Teksten staan bij de finish-stap in dezelfde JSON. De optie om nieuwe kleurvlekken toe te voegen is verwijderd; eventueel eerder opgeslagen kleurvlekken blijven behouden.
