# Associatieve beelden

## Oorspronkelijke beelden 01–10

Tien afzonderlijk gegenereerde beelden, met de aangeleverde afbeelding uitsluitend als stijlreferentie. Geen uitsneden of collage. De beelden zijn niet voorzien van betekenis- of emotielabels.

Bestanden: image-01.webp t/m image-10.webp, elk 1024 × 1024 pixels, WebP kwaliteit 88. preview.html toont inmiddels alle twintig bestanden in een responsive overzicht. Open lokaal via http://localhost:8000/images/candidates/preview.html als de bestaande webserver draait. De oorspronkelijke SVG-bestanden blijven bewaard; de huidige beeldstap gebruikt de WebP-pool.

Generatie: ingebouwde imagegen-tool, één opdracht per beeld. De visuele prompts zijn opgeslagen in prompts.json. De contactlinks worden afzonderlijk ingesteld in PR #9.


## Beelden 11–20

Tien nieuwe losse beelden, gemaakt met built-in imagegen, voegen meer fragmentaire en ambigue composities toe binnen dezelfde kleurrijke schilderachtige beeldtaal. Geen teksten, interpretaties of toegekende betekenissen. De volledige prompts staan in prompts.json.additionalSet. De oorspronkelijke tien WebP-bestanden zijn ongewijzigd. Nieuwe beelden zijn zonder uitsnijden naar 1024×1024 geschaald en als WebP met kwaliteit 85 opgeslagen; samen ongeveer 3,2 MB.

preview.html toont alle twintig beelden met nummers en links naar de losse bestanden. De app kiest drie ID’s per sessie; variation-metadata wordt niet gebruikt voor selectie. In 10.000 sessies verscheen ieder beeld 14,22–15,79% van de tijd, zonder overlap met de vorige set.

Validatie: python3 tests/image-assets.py (vanuit de projectroot) serveert alle pool- en previewpaden via HTTP en controleert status 200, WebP en 1024×1024. node tests/images.cjs controleert de verdeling, unieke drietallen, geen vorige-setoverlap en stabiel hervatten. De bestaande flow-, research-, object-, answers- en finish-tests blijven slagen.
