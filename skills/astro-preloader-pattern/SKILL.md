---
name: astro-preloader-pattern
description: Analyseer, documenteer en ontwerp een herbruikbaar preloader-patroon voor Astro/React frontends met expliciete requirements, componenten en logica. Gebruik deze skill wanneer gebruikers vragen hoe een bestaande preloader werkt, een loader willen standaardiseren over meerdere projecten, of een Astro-geschikte aanpak nodig hebben met progress-smoothing, minimum zichtduur en reduced-motion gedrag.
---

# Astro Preloader Pattern

## Overview

Leg een bestaande preloader-implementatie uit en lever een herbruikbaar ontwerp op zonder onnodige codewijzigingen. Presenteer altijd een helder overzicht van requirements, componenten en runtime-logica.

## Workflow

1. Lokaliseer de loader
- Zoek naar loader-gerelateerde componenten, styles en progress-bron.
- Identificeer waar progress wordt gemeten en waar de overlay wordt getoond/verwijderd.

2. Traceer de dataflow
- Breng keten in kaart: `progress source -> state -> loader UI`.
- Noteer guards en randvoorwaarden:
  - reduced motion
  - minimum zichtduur
  - hide/unmount voorwaarden
  - smoothing en clamping

3. Schrijf de output in vaste structuur
- Gebruik drie hoofdsecties:
  - Requirements
  - Componenten
  - Logica (state/transities)
- Voeg korte "Waarom werkt dit" observaties toe.

4. Vertaal naar Astro-context
- Benoem of de huidige aanpak React-island is of framework-onafhankelijk.
- Geef Astro-advies op conceptniveau:
  - hydration-strategie (`client:load` of `client:only`)
  - behoud van dezelfde loader-state-machine
  - geen regressie op toegankelijkheid of motion-instellingen

5. Lever herbruikbare documentatie
- Maak een `.md` die direct kopieerbaar is naar andere projecten.
- Beperk je tot implementatie-neutrale principes tenzij de gebruiker expliciet code wil.

## Output Contract

Lever standaard dit formaat:

1. Korte samenvatting van hoe de huidige preloader werkt.
2. Requirements lijst.
3. Componentenlijst met verantwoordelijkheden.
4. Logica/states/transities (van laden tot verdwijnen loader).
5. Astro.js toepassing en aandachtspunten.

## Quality Checks

- Noem expliciet waar progress vandaan komt en hoe die doorstroomt.
- Controleer dat hide-voorwaarden niet te vroeg triggeren.
- Controleer dat reduced-motion pad geen blocker-overlay achterlaat.
- Houd timingwaarden en drempels concreet (ms/%).

## References

- Gebruik `references/preloader-blueprint.md` als template voor projectoverstijgende documentatie.
