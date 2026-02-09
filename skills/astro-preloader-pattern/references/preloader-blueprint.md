# Preloader Blueprint (Astro/React)

Gebruik dit sjabloon om in elk project een preloader consistent te documenteren.

## 1. Doel
- Wat moet de preloader afdekken? (bijv. textures, route assets, API bootstrap)
- Wanneer mag hij verdwijnen?

## 2. Requirements
- Progress input:
  - bereik (0-100)
  - monotonic of niet
  - updatefrequentie
- UX regels:
  - minimum zichtduur
  - smooth visual progress
  - fade-out gedrag
- A11y:
  - reduced-motion support
  - `aria-live` of alternatieve statuscommunicatie

## 3. Componenten
- Progress source
  - Wie berekent load-progress?
- State owner
  - Welke component beheert progress/state?
- Loader UI
  - Overlay, balk, tekst, transitions

## 4. Logica (state machine)
- Aanbevolen states:
  - `loading`
  - `ready-to-hide`
  - `hidden`
- Exit criteria:
  - data klaar
  - minimumtijd verstreken
  - visual progress bijna/volledig klaar

## 5. Astro integratie
- React loader:
  - mount als island (`client:load` of `client:only="react"`).
- Framework-agnostisch:
  - implementeer dezelfde state-machine in vanilla client script.
- Vermijd:
  - server-only state voor visuele progress.

## 6. Validatie checklist
- Loader flasht niet te kort.
- Loader blijft niet hangen op 99%.
- Progress springt niet visueel terug.
- Reduced-motion pad werkt zonder blokkade.

