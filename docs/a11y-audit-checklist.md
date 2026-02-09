# Accessibility Audit Checklist

Project: PrizeDraw
Date: 2026-02-06

## Scope

- Entry flow: postal code input -> submit -> loading -> result
- Visual layers: loader overlay, scene fade, canvas
- Motion: reduced motion handling, confetti

## High Priority

- Form validation messaging is present and tied to the input via `aria-describedby`.
- Validation errors are announced via `role="alert"` or `aria-live="assertive"`.
- Submit button disabled state includes an accessible explanation (text or `aria-describedby`).
- Loader has `role="progressbar"` and meaningful `aria-valuenow/min/max` or a text status.
- Loading status changes are announced (e.g., `aria-live="polite"`).

## Medium Priority

- Page remains usable at 200% zoom (no content hidden due to `overflow: hidden`).
- Canvas is either decorative (`aria-hidden="true"`) or has keyboard alternatives.
- Input focus indicator is clearly visible and meets contrast guidelines.
- Reduced motion removes or significantly limits animation effects.
- Result panel updates are announced to screen readers (`aria-live` or focus management).

## Low Priority

- Text contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text).
- Autofocus does not disrupt screen reader flow; focus is logical on entry.
- Placeholder text is not the sole source of instruction.

## Manual Test Steps

- Keyboard-only: tab through all interactive elements; no traps; visible focus.
- Screen reader: verify labels, instructions, loading updates, and results.
- Zoom: 200% in browser; content remains reachable.
- Reduced motion: `prefers-reduced-motion` avoids animation and parallax.

## Notes / Findings Log

- Finding:
  - Location:
  - Severity:
  - Recommendation:

