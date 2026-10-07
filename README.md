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
- images/candidates/: twintig losse WebP-beelden en een preview; de oude SVG’s blijven bewaard

Vragen kunnen binnen `fields` herschreven en geordend worden. Stappen zijn herkenbaar aan hun `id`; behoud deze id's en de veldsleutels bij tekstwijzigingen. Nieuwe vraagbewegingen vragen later mogelijk ook aanpassing van de flow. `{selectedElement}` wordt letterlijk vervangen door het gekozen woord, zonder analyse.

## Privacy en bediening

Antwoorden worden uitsluitend opgeslagen onder `associatieruimte.v01` in localStorage op het gebruikte domein. Ze blijven na sluiten of verversen beschikbaar op dezelfde browser. Er worden geen antwoorden naar een server verstuurd. De app laadt alleen eigen statische bestanden, gebruikt geen cookies, analytics, AI, accounts of database. Op gedeelde apparaten kan een volgende gebruiker van dezelfde browser de sessie zien; gebruik Mijn sessie wissen om deze te verwijderen. Bij geblokkeerde opslag werkt de oefening zolang het tabblad openblijft.

Woorden worden uitsluitend handmatig toegevoegd. Klik of tik op een woord om het te selecteren. Versleep het of gebruik de richtingknoppen; ook de pijltjestoetsen werken op een geselecteerd woord. Gebruik Groter, Kleiner of Verwijderen. Positie en grootte worden niet geïnterpreteerd. Alle reflectievelden na de beginvraag kunnen leeg blijven. Geen inzicht, ‘nee’ of ‘weet ik niet’ zijn geldige uitkomsten. Opnieuw beginnen wist ook de vorige sessie.

## Plaatsen op de website

Upload alle bestanden met behoud van de mapstructuur naar bijvoorbeeld `/associatieruimte/`, of naar de documentroot van een subdomein. Alle paden zijn relatief. Alleen statische hosting is nodig, zonder serverapplicatie. Gebruik bij voorkeur HTTPS. Er is in dit prototype geen publicatie of hosting ingesteld.

De SVG-beelden zijn voor dit prototype gemaakt en bevatten geen externe bronnen.

## Gerichte canvasaanpassingen

De ordenstappen worden bij navigatie overgeslagen zolang er geen zelf toegevoegde woorden of zinnen zijn. Er wordt geen minimum afgedwongen: de oefeningen en afronding blijven toegankelijk. De oefening rond een gekozen element gebruikt neutrale vragen. Bij de eerste interactieve opening staat de uitnodiging om vrij te spelen, ook wanneer de eerdere ordenstap is overgeslagen.

Bij handmatig toevoegen kan iemand optioneel een eigen kleur kiezen. Die staat op het element als `color` en blijft zichtbaar in de woordenwolk en op het canvas. Ook op het canvas kan ieder element een eigen kleur krijgen. Nieuwe vormen kunnen voorlopig niet worden toegevoegd. Eerder opgeslagen vormen blijven zichtbaar en bewerkbaar met de bestaande bediening. Vormen worden niet als woorden aan de onderzoekskeuzelijst toegevoegd en tellen niet mee voor de aanwezigheid van minstens één verzameld tekstelement. Kleur en vorm krijgen geen betekenis vanuit de app. Bestaande lokale sessies blijven leesbaar.

### Functionele controle

Met Node.js: `node tests/flow.cjs`. Deze test gebruikt een kleine DOM-simulatie en controleert de routes met 0, 1, 2, 3, 5 en 6 woorden, letterlijk ingevoegde teksten, kleur en oude vormen, verplaatsen, schalen, verwijderen, hervatten en wissen op twee canvasafmetingen. Dit is geen visuele browsertest of echte touchtest.

## Flow en contact

Vanaf één of meer zelf verzamelde tekstelementen verschijnt de interactieve ruimte; vormen tellen niet mee. Zonder tekstelementen wordt de elementoefening overgeslagen. Met één of meer woorden kan iemand een element onderzoeken én de ruimte bewerken. Alle terugblikken zijn gemarkeerd als niet bewerkbaar. De veranderingsvraag is open en hoeft niet beantwoord of ruimtelijk uitgewerkt te worden.

Stel in questions.json `contactLinks.experience` en `contactLinks.introduction` onafhankelijk in op een eigen volledige https://- of mailto:-bestemming. De contactlinks zijn ingesteld. Als een bestemming later leeg wordt gemaakt, blijft die knop zichtbaar maar uitgeschakeld. Er worden geen antwoorden of sessiegegevens in de links opgenomen. Teksten staan bij de finish-stap in dezelfde JSON. De optie om nieuwe kleurvlekken toe te voegen is verwijderd; eventueel eerder opgeslagen kleurvlekken blijven behouden.

## Associatieve routes en beeldkeuze

`questions.json` bevat drie vooraf geschreven `routes` (landscape, animal, movement) en een `imagePool` van twintig lokale kandidaatbeelden. In de bestaande sessie onder `associatieruimte.v01` worden `routeId` en drie `imageIds` opgeslagen. Renderen, navigeren en herladen kiezen niets opnieuw. Oudere sessies zonder route gebruiken de oorspronkelijke landschapsroute; antwoorden en vormen blijven behouden.

Bij een nieuwe sessie kiest de app een andere route dan de vorige. Voor beelden kiest de app willekeurig drie verschillende ID’s zonder terugleggen. De direct vorige drie worden uitgesloten zolang er minstens drie andere beelden zijn; bij een kleinere pool worden eerdere beelden pas gebruikt wanneer nodig. De `variation`-metadata bepaalt de selectie niet meer. Alleen de vorige route en beeld-ID’s worden daarnaast bewaard onder `associatieruimte.v01.choices`, zonder antwoorden of elementen.

De collector neemt nooit tekstvelden automatisch over. De gebruiker voert zelf een woord of zin in en kan een kleur kiezen of ‘Geen specifieke kleur’ gebruiken. De niet-interactieve woordenwolk toont alleen verzamelde tekstelementen, met hun kleur als achtergrond en een losse, responsive schikking. Ze gebruikt geen clustering, gewicht of betekenis. Het interactieve canvas gebruikt hetzelfde opgeslagen kleurveld.

`node tests/flow.cjs` controleert alle routes met 0, 1, 2, 3, 5 en 6 woorden op twee afmetingen, handmatig verzamelen met/zonder kleur, terugzetten naar geen kleur, woordenwolk, stabiele route en beeldkeuze bij navigatie/herladen, een andere keuze na reset, selectie, pointerbeweging, grootte, kleur, verwijderen, begrenzing, oude vormen en contactlinks. Dit blijft een DOM-simulatie, geen bewijs van draggedrag in een echte browser. `node tests/browser.cjs` voert met een lokaal beschikbare Playwright/Chromium-installatie de echte browsercontrole uit.

## Ervaren en onderzoeken

Na de eerste interactieve ruimte volgt één keuze uit vooraf geschreven oefeningen in `questions.json` onder `researchRoutes`. Met één zichtbaar tekstelement zijn ‘Bij een woord gaan staan’ en ‘Groot en klein ervaren’ beschikbaar. Met twee of meer woorden komt ‘Twee woorden laten spreken’ erbij; bij een woord staan kan dan optioneel verdiept worden met kijken naar een tweede woord en terugkijken. Alleen aantallen bepalen technische geschiktheid. Er wordt geen inhoud geanalyseerd.

`state.research` bewaart één gekozen route, `xId`, `yId`, de fase, optionele verdieping en eventueel de vaste groottevariant (`more` of `less`). De gebruiker kiest X en Y uit eigen tekstelementen. Y kan niet hetzelfde element zijn als X. De software vervangt `{X}` en `{Y}` letterlijk door hun tekst, met DOM-textContent en zonder HTML of interpretatie. Vrije antwoorden staan in `answers` onder sleutels die de route en gekozen element-ID’s bevatten, zodat een andere selectie bestaande antwoorden niet overschrijft.

Elke ervaringsfase gebruikt de bestaande interactieve `canvas()` — ook bij beide groottes, lichamelijke vragen en het kiezen van een eigen grootte. De normale Verder-knop blijft altijd bruikbaar met lege antwoorden; verdieping wordt alleen geopend met een expliciete optionele knop. Eén gekozen route blijft vast tijdens renderen, teruggaan en hervatten. Alle oefeningen worden dus niet na elkaar afgewerkt. Grootte kent beide volgorden: groot → klein → eigen grootte, of klein → groot → eigen grootte. De variant wordt éénmalig willekeurig gekozen, zonder gebruikersinhoud te bekijken.

Toevoegen op de aangegeven momenten gebruikt de bestaande collector met een tekst die bij de ervaring hoort, inclusief optionele kleur. Alleen wat de gebruiker zelf invoert wordt toegevoegd, direct in hetzelfde canvas. Antwoorden worden nooit overgenomen.

De oude interventies, twee willekeurige aanbiedingen, experiment-/snapshotbeslissing en verplichte waarnemingsvraag zijn volledig uit de gebruikersflow verwijderd. Eventueel nog opgeslagen oude experimentele data blijft ongebruikt; eerder verborgen elementen blijven opgeslagen en kunnen op een interactief canvas worden teruggezet. `stepId` bewaart de stapnaam. Oudere numerieke stappen worden gemigreerd; een oude `experiment`-stap wordt naar de nieuwe `research`-stap omgezet. De overige vragen, routes, beelden en afsluiting blijven gelijk.

Tests: `node tests/flow.cjs` controleert de bestaande complete flows. `node tests/research.cjs` controleert de drie oefeningen, beide groottevarianten, X/Y, letterlijke tekst, interactieve bediening in iedere fase, optionele verdieping, toevoegen met kleur, niets automatisch verzamelen, geen verplicht inzicht, hervatten en migratie. Dit zijn DOM-tests, geen bewijs van echte browserinteractie. De bestaande `tests/browser.cjs` blijft beschikbaar voor een omgeving met Chromium.

## Eerdere antwoorden aanklikken of vrij toevoegen

Alle bekende vrije tekstvelden uit de sessie (associatieve routes, beelden, verdieping en afronding) en eigen tekstelementen kunnen als hele, letterlijke opties verschijnen. Onderzoeksantwoorden worden herkend aan hun bestaande gestructureerde sleutel en de velddefinities van `researchRoutes`, inclusief eerdere elementselecties en beide groottevarianten. De startvraag blijft sessiecontext en wordt niet als suggestie aangeboden. Onbekende velden, navigatiekeuzes, beeld-ID’s, kleurcodes en appteksten worden niet aangeboden. Geen extractie of inhoudelijke analyse. Lege antwoorden worden overgeslagen; identieke volledige teksten verschijnen één keer.

De opties staan bij alle bestaande verzamelmomenten, ook in de ervaringsgerichte oefeningen en bij de latere verdieping, en op de interactieve ruimte. De bestaande onderzoeksuitnodigingen blijven behouden. Een klik gebruikt dezelfde `addElement()` als de vrije invoer, zonder vooraf ingevulde kleur. Kleur kan vervolgens via de bestaande canvasbediening worden gekozen. De vrije invoer met optionele kleur blijft onder de opties beschikbaar. De overtypstap uit de vorige versie is verwijderd.

Als de letterlijke tekst al als tekstelement bestaat, is die optie uitgeschakeld en herkenbaar als ‘Toegevoegd’. De klikhandler controleert dit opnieuw om dubbele klikken op te vangen. Oude sessies vereisen geen nieuwe metadata of migratie: de huidige elementen bepalen de toegevoegde status. Renderen of hervatten voegt nooit materiaal toe. Lange antwoorden blijven volledig leesbaar; de lijst heeft een beperkte hoogte en kan scrollen, met ombrekende chips op desktop en mobiel.

Tests: `node tests/answers.cjs` controleert de expliciete bronvelden, eigen/letterlijke teksten, meerdere klikken, vrije invoer, gelijkwaardige elementen, beschikbaarheid van oefeningen, kleur/positie/grootte, geen automatische toevoeging, herladen, bestaande sessies en lange teksten op beide afmetingen. `tests/flow.cjs` en `tests/research.cjs` blijven slagen. Dit zijn DOM-tests; echte browserweergave is hier nog niet getest door het ontbrekende Chromium-programma.


## Veranderingsvraag binnen standing

De aparte stap `explore` is vervallen. Binnen `researchRoutes.standing` opent `changeChoice` de optionele verdieping met `changeField`: “Als ‘{X}’ zou kunnen veranderen, wat zou er dan gebeuren?”. De bestaande standing-vragen en optionele relationele verdieping blijven behouden; dialogue en size krijgen deze vraag niet. Na research volgt arrange.

De vraag gebruikt `state.research.xId`, fase 2 en een bestaande scoped antwoordkey (`research.standing.<id>...change`). Het interactieve canvas blijft zichtbaar; arrange toont de veranderingsuitnodiging en dit antwoord als geheugensteun. Het antwoord verschijnt ook in de aanklikbare eigen inhoud.

`migrateFlow()` hervat oude `stepId: explore`-sessies binnen standing bij de veranderingsvraag wanneer het gekozen element nog bestaat. Oud memory/memoryDetail-materiaal blijft bewaard en aanklikbaar via `legacyAnswerKeys`, ook zonder het oude element. Bij een bestaand element worden oude antwoorden eenmalig naar de standing-keys gekopieerd zonder bestaande scoped antwoorden te overschrijven. Bestaande arrange-sessies bewaren hun referentie in research.changeReferenceKey. flowVersion 2 en stepId houden nieuwe en oude stapindices uit elkaar. Er worden geen oefeningen of elementen automatisch uitgevoerd/toegevoegd.

De tests controleren standing met één en meerdere elementen, letterlijke antwoorden en herladen, interactief wijzigen en de geheugensteun in arrange, direct verdergaan vanuit dialogue/size, oude explore-sessies met en zonder element, oud arrange, legacy-antwoordchips en de volledige overige flow op desktop/mobile in de DOM-omgeving.


## Eén onverwacht voorwerp

Direct vóór return staat één nieuwe stap `object`, ook met een lege Associatieruimte. `questions.json.objectPool` bevat tien concrete voorwerpen en is uitbreidbaar. `initialiseChoices()` kiest met dezelfde willekeurige keuzehelper één voorwerp, zonder matching of metadata. Alleen de direct vorige keuze wordt bij reset vermeden. `state.objectId` en `state.objectPhase` staan in de bestaande sessie; de laatste keuze staat ook in de bestaande `.choices`-opslag. Renderen, navigeren en hervatten kiezen geen nieuw voorwerp.

De eerste vraag schrijft naar `answers.objectAction`. Na een antwoord opent Verder de vaste tweede vraag, opgeslagen als `answers.objectView`. Beide schermen tonen het actuele interactieve canvas. Na de tweede vraag zijn alleen deze eigen antwoorden als lokale chips beschikbaar, met de bestaande optionele kleurkeuze en vrije invoer. Het voorwerp zelf blijft uitsluitend een tijdelijke appprikkel: geen automatisch element, geen antwoordchip en geen nieuwe vermelding in finish. Verdergaan zonder antwoord blijft mogelijk.

`flowVersion: 3` en bestaande stepIds zorgen voor hervatten; oudere indexsessies van versie 2 worden naar hun oorspronkelijke stap-ID vertaald. Wie al op return/new/finish stond blijft daar, zonder teruggestuurd te worden. De bestaande migratie van oudere explore-sessies blijft behouden.

Tests: `node tests/object.cjs` controleert de volledige nieuwe interventie, 0/1/2 elementen, letterlijke opslag/chips, optionele kleur, vrije invoer, duplicaten, return/finish, herladen en oudere sessies op desktop/mobiele DOM-afmetingen. In 10.000 resets verschenen alle voorwerpen 9,48–10,46% van de tijd, zonder directe herhaling. De bestaande flow-, research-, answers-, finish- en image-tests blijven slagen. De canvas- en researchimplementatie en return/finish-inhoud zijn ongewijzigd. Een echte handmatige browsertest is niet uitgevoerd.
