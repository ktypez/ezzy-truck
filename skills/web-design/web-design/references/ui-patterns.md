# UI Patterns

A collection of modern, accessible UI component patterns.

## Layouts
- **Fluid Grid:** Use CSS Grid or Flexbox for responsive layouts.
- **Sticky Headers/Nav:** Use `position: sticky; top: 0;` for persistent navigation.
- **Containers:** Keep content width constrained for readability (e.g., `max-width: 600px; margin: 0 auto;`).

## Components
- **Cards:** Use for grouping related content. Ensure proper padding and border-radius.
- **Buttons:** Clearly differentiate primary, secondary, and destructive actions.
- **Modals:** Use `backdrop-filter: blur();` for focus, and ensure keyboard accessibility (close on ESC).
- **Navigation Tabs:** Fixed bottom bars for mobile apps to improve navigation reachability.

## Accessibility
- Use semantic HTML tags (`<nav>`, `<main>`, `<button>`, `<section>`).
- Ensure color contrast ratios meet WCAG AA standards.
- Add `aria-label` where necessary (e.g., icon-only buttons).
