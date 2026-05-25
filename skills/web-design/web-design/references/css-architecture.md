# CSS Architecture

Guidance on maintaining clean, performant, and scalable CSS.

## Structure
- **Global Variables:** Use `:root` and theme-specific data attributes (e.g., `[data-theme="dark"]`) to manage colors, spacing, and typography variables.
- **Utility-First:** Prefer a utility-first approach (like TailwindCSS or similar) to minimize custom CSS bloat.
- **Component Styling:** Keep component-specific styles scoped if possible.

## Performance
- **Backdrop Filters:** Use `backdrop-filter: blur();` sparingly, as it can be expensive. Always use with `saturate()` to enhance visuals.
- **CSS Transitions:** Use `transition: all 0.3s ease;` for smooth interaction feedback.
- **Avoid Over-Styling:** Minimize use of `!important`.

## Best Practices
- **Design Tokens:** Define design tokens (spacing, colors) as variables early.
- **Consistency:** Maintain consistent border-radius and spacing units across the app.
