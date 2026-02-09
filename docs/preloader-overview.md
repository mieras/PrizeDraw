# PrizeDraw Preloader Overzicht

## Doel

Deze preloader toont een full-screen overlay met progress bar terwijl textures in de 3D scene laden. De loader:

- blijft minimaal kort zichtbaar (voorkomt "flash"),
- animeert progress vloeiend i.p.v. schokkerig,
- verdwijnt pas als laden echt klaar is.

## Waar dit zit

- Loader component: `src/loader/index.tsx`
- Loader styles: `src/loader/style.module.css`
- Loader gebruik in app: `src/app/index.tsx`
- Progress bron (texture loading): `src/infinite-canvas/scene.tsx`

## Hoe de flow werkt

1. `SceneController` leest laadstatus via `useProgress()` (`@react-three/drei`).
2. De ruwe progress wordt afgerond en alleen omhoog doorgegeven (`maxProgress` ref) via `onTextureProgress`.
3. `App` zet dat door naar `textureProgress` state.
4. `PageLoader` ontvangt `progress` (0-100) en toont overlay + balk.
5. Zodra progress klaar is en minimumtijd verstreken is, fade-out + unmount.

## Requirements

- `progress` waarde in bereik 0-100.
- Progress moet monotonic zijn (niet teruglopen), anders ziet de balk er instabiel uit.
- `requestAnimationFrame` moet beschikbaar zijn voor smooth visualisatie.
- CSS overlay met hoge `z-index` en full viewport dekking.
- Respecteer `prefers-reduced-motion`.

## Componenten

- `PageLoader`
  - Props:
    - `progress: number`
    - `reducedMotion?: boolean`
  - Interne state:
    - `show` (render/unmount)
    - `minTimeElapsed` (minimum zichtduur, 1500ms)
    - `visualProgress` (gesmoothde progress)
- `SceneController`
  - Leest `useProgress()`
  - Stuurt alleen oplopende progress door via callback

## Logica (kern)

- Motion guard:
  - `reducedMotion === true` => loader rendert niet.
- Minimum zichtduur:
  - timer van 1500ms voor fade/unmount mag starten.
- Visual smoothing:
  - elke frame: `visual += (target - visual) * 0.08` als verschil groot genoeg is.
  - bij klein verschil snap naar target.
- Klaar-criteria:
  - `minTimeElapsed && progress === 100 && visualProgress >= 99.5`
  - dan eerst fade (`.hidden`), daarna unmount (`show=false`) na 200ms.

## Waarom dit stabiel voelt

- Geen plotse jumps in de balk (lerp-smoothing).
- Geen te korte loader-flash (minimumtijd).
- Geen "bijna klaar maar toch weg" race condition (pas weg op echte 100% + bijna visueel 100%).

## Astro.js hergebruik (zonder code hier te wijzigen)

- Deze implementatie is React-gebaseerd.
- In Astro kun je dit als React island gebruiken (`client:load` of `client:only="react"`), met dezelfde state-machine.
- Als je liever puur Astro + vanilla JS gebruikt, behoud dezelfde principes:
  - monotone progress,
  - minimum zichtduur,
  - gesmoothde visual progress,
  - fade + unmount,
  - reduced-motion respecteren.

