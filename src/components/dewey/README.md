# Dewey Component

The animated book mascot for the **Dewey** WordPress plugin.

---

## Files

```
dewey/
├── index.js       — barrel exports
├── Dewey.jsx      — main character component
├── dewey.css      — all animations & state styles
└── useDewey.js    — state management hook
```

---

## Installation

Drop the `dewey/` folder into `src/components/` in your plugin.

Make sure your `webpack.config.js` (via `@wordpress/scripts`) includes CSS handling — it does by default.

Import the stylesheet once at the top of your plugin entry point:

```js
import './components/dewey/dewey.css';
```

---

## Basic usage

```jsx
import { Dewey, useDewey } from './components/dewey';

function LibrarianPanel() {
  const { deweyState, deweyHandlers } = useDewey();

  const handleQuery = async ( question ) => {
    deweyHandlers.onQueryStart();

    const posts = await searchArchive( question );
    deweyHandlers.onPostsFound( posts.length );

    if ( posts.length === 0 ) return;

    await streamAnswer( posts, question, ( chunk ) => {
      // stream chunks to UI...
    });

    deweyHandlers.onAnswerReady( posts.length );
  };

  return (
    <div className="librarian-panel">
      <Dewey state={ deweyState } />
      <ChatInput onSubmit={ handleQuery } />
    </div>
  );
}
```

---

## Dewey props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `state` | string | `'idle'` | Current animation state |
| `showSpeech` | boolean | `true` | Show/hide speech bubble |
| `size` | number | `170` | Width of character in px (height scales proportionally) |
| `onSpeechChange` | function | — | Callback when speech text changes `(text) => void` |
| `className` | string | `''` | Extra CSS class on the wrapper |

---

## Available states

| State | When to use |
|-------|-------------|
| `idle` | Default — floating, waiting for input |
| `searching` | Query submitted, fetching from post index |
| `thinking` | Posts found, waiting for AI response |
| `found` | Answer ready (1–4 posts referenced) |
| `dancing` | Answer ready (5+ posts referenced) |
| `sad` | No posts matched the query |
| `shocked` | Use sparingly for fun moments (auto-returns to idle) |
| `hello` | First-ever panel open / onboarding |
| `tired` | After a very large archive scan |

---

## useDewey hook

The hook manages state transitions automatically. Wire it to your query lifecycle:

```js
const { deweyState, deweyHandlers } = useDewey();

// In your query flow:
deweyHandlers.onQueryStart();           // → 'searching'
deweyHandlers.onPostsFound( count );    // → 'thinking' (or 'sad' if 0)
deweyHandlers.onAnswerReady( count );   // → 'found' or 'dancing', then 'idle'
deweyHandlers.onNoResults();            // → 'sad'
deweyHandlers.onError();                // → 'idle'

// Special states:
deweyHandlers.onShock();                // → 'shocked' (auto-returns to idle after 3.5s)
deweyHandlers.onFirstOpen();            // → 'hello' (auto-returns to idle after 3s)
deweyHandlers.onTired();                // → 'tired' (auto-returns to idle after 4s)

// Escape hatch:
deweyHandlers.setDewey( 'dancing' );   // Set any state manually
```

---

## Accessibility

Dewey includes `aria-label="Dewey, your archive research assistant"` and `role="img"` on the SVG. All animations respect `prefers-reduced-motion` — if the user has reduced motion enabled, all animations are disabled and Dewey renders as a static illustration.

---

## Customising colors

The character colors are hardcoded in the SVG as fill values. The main palette:

| Variable | Value | Used for |
|----------|-------|----------|
| Cover | `#2d6a4f` | Main book body |
| Spine | `#1b4332` | Spine, arms, feet |
| Face | `#3d8a6a` | Face area |
| Brass | `#b5885a` | Accents, glasses, title |
| Cream | `#fdf6e3` | Left page, eye whites |
| Cream 2 | `#f5edd6` | Right page (slightly warmer) |
| Crimson | `#8b1e2e` | Bookmark ribbon |

To change the color scheme, do a find-and-replace on these hex values in `Dewey.jsx`.

---

## WordPress-specific notes

- Uses `@wordpress/element` for `useEffect`, `useState`, `useRef` — not `react` directly. This ensures compatibility with WP's bundled React instance and avoids duplicate React errors.
- The `#dewey-cloth` SVG pattern ID is scoped with the `dewey-` prefix. If you render multiple Deweys on the same page (unlikely but possible), each will share the same pattern definition — this is fine.
- All CSS classnames are prefixed with `dewey-` to avoid conflicts with WP admin styles.
