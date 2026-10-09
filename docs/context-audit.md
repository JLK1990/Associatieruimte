# Context bij vervolgvragen

Audit van de volledige flow, inclusief alle researchroutes. De app toont alleen letterlijk opgeslagen antwoorden waarvan de relatie tot de huidige stap vooraf vastligt. Er is geen inhoudsanalyse of automatische samenvatting.

| Stap / overgang | Bevinding en uitvoering |
| --- | --- |
| Start → associatieve route | De beginvraag wordt bewust tijdelijk losgelaten. Geen nieuwe terugverwijzing toegevoegd. |
| Landschap | Alle drie velden blijven samen zichtbaar; de plek staat ook als bestaande live terugverwijzing bij de vervolgvraag. |
| Dier | Alle velden blijven zichtbaar; dier en handeling hebben bestaande live terugverwijzingen. |
| Beweging | Alle velden blijven zichtbaar; vervolgvragen verwijzen al naar de letterlijk ingevulde beweging. |
| Beeld | Gekozen beeld blijft zichtbaar; beide antwoordvelden staan samen. De eerdere route-associatie wordt al letterlijk getoond bij de verbindingsvraag. |
| Eerste ruimte / verzamelen | Actuele woorden, kleuren en posities blijven zichtbaar. Geen complete antwoordgeschiedenis toegevoegd. |
| Standing: bij X / om je heen | Beide velden staan samen. |
| Standing: vanuit X naar Y | De eigen ervaring bij X en waarneming rondom X worden nu boven de keuze/vraag teruggetoond. |
| Standing: vanuit Y terugkijken | Alleen het antwoord op kijken vanuit X naar Y wordt teruggetoond; de voorafgaande contextblokken worden hier niet gestapeld. |
| Standing: mogelijke verandering | Ervaring bij X en waarneming rondom X blijven beschikbaar boven de veranderingsvraag. |
| Dialoog: X/Y kiezen | Keuzes blijven zichtbaar via tekst, rollen en actuele canvasmarkeringen. Geen wijziging van selectie of perspectief. |
| Dialoog: bij X → naar Y kijken | De ervaring bij X wordt nu met de oorspronkelijke vraag en het letterlijke antwoord getoond. |
| Dialoog: kijken → X spreekt | De zojuist ingevulde kijkervaring blijft zichtbaar. |
| Dialoog: X spreekt → Y antwoordt | De uitspraak van X stond al als losse terugverwijzing in beeld. Deze krijgt nu de oorspronkelijke vraag als label, zodat spreker en ontvanger duidelijk zijn. |
| Groot/klein: tweede versie | De antwoorden bij de eerste versie blijven zichtbaar, met een label dat groot of klein benoemt. |
| Groot/klein: verschil / eigen grootte | De antwoorden bij beide versies blijven zichtbaar. De beginervaring van de weinig-ruimtevariant wordt niet als extra geschiedenis gestapeld. |
| Opnieuw ordenen | De bestaande terugverwijzing naar de mogelijke verandering is behouden. Actuele ruimte blijft interactief. |
| Voorwerp | Beide vragen en antwoorden blijven sinds PR #20 tegelijk zichtbaar, met hetzelfde voorwerp en actuele canvas. Toevoegfase toont beide letterlijke antwoorden als chips. Geen extra terugverwijzing nodig. |
| Return | Oorspronkelijke vraag en uiteindelijke ruimte staan al naast de actieve reflectie. Behouden. |
| Nieuwe vraag | De zojuist ingevulde return-reflectie wordt nu boven de optionele vraag teruggetoond. |
| Finish | Bestaand overzicht bevat beginvraag, actuele ruimte, eigen reflectie en eventueel nieuwe vraag. Geen oefening/contextgeschiedenis toegevoegd. |

## Implementatie

`questions.json` bevat expliciete `contextKeys` per relevante researchvraag/fase. `researchContext()` zoekt uitsluitend de bijbehorende velddefinities en gebruikt de bestaande `researchAnswerKey()` voor de huidige route, X, Y en variant. Een nieuwe woordkeuze toont daardoor geen antwoorden van een eerder gekozen woordpaar. Groot/klein gebruikt korte labels om de vorige uitvoering herkenbaar te houden; antwoorden blijven letterlijk.

`answerContext()` / `updateAnswerContext()` tonen een ondergeschikt label en een niet-bewerkbare letterlijke tekst. Lege of uitsluitend uit witruimte bestaande antwoorden verbergen het hele contextblok. De bestaande opslag en live inputupdates blijven intact; contextvelden schrijven zelf geen state en voegen geen elementen toe.

Voor `new` verwijst `contextKey: reflection` naar de bestaande return-invoer. De beginvraag keert pas bij return terug. Canvas en navigatie zijn niet gewijzigd. Er worden geen historische canvassnapshots gemaakt.

## Controle

`tests/context.cjs` controleert dialoog, standing, beide groot/klein-varianten en de overgang return → new op desktop/mobiele DOM-afmetingen: letterlijke invoer, juiste X/Y-scope, lege context, volgorde boven de actieve vraag, teruggaan, refresh en behoud van antwoorden/canvas. De bestaande research-, dialoog-, voorwerp-, selectie-, antwoord-, flow- en finishtests blijven slagen.

Daadwerkelijke browser-/layoutvalidatie kon in deze werkomgeving niet worden uitgevoerd omdat Chromium ontbreekt.
