# الأفق الزمني — Temporal Horizon

An Arabic, right-to-left history homepage with six introductory historical periods, anchor-based navigation, a responsive quick-navigation rail, and accessible native story dialogs. Built with vanilla JavaScript and Vite; there is no backend, login, tracking, or database.

## Development in Base44

```sh
docker compose -f docker-compose.base44.yml up -d
```

The app runs from bind-mounted source on port 3000. Dependencies are installed from `package-lock.json` on each container startup, before Vite starts. No secrets are required. The platform-provided `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` extends Vite's host allowlist in the sandbox; without it, Vite retains its normal host restrictions. No application behavior depends on preview mode.

## Checks

```sh
docker compose -f docker-compose.base44.yml exec -T web npm test
docker compose -f docker-compose.base44.yml exec -T web npm run build
```

For a browser smoke test, follow **ابدأ الرحلة**, use each timeline link, open and close all six stories, and test the mobile menu and floating **العصور** control. Check for horizontal page overflow at narrow widths. Story dialogs support native keyboard focus trapping and Escape, restore focus on close, and respect reduced-motion preferences.

## Content and assets

- `src/history.js` contains all period summaries, full stories, image descriptions, and further-reading links. Dates are explicitly approximate and not presented as universal period boundaries.
- `src/main.js` renders the page and manages navigation/dialogs.
- `src/style.css` contains the responsive parchment, gold, and dark-green design.
- Fonts: Amiri and IBM Plex Sans Arabic, loaded from Google Fonts. System serif/sans-serif fallbacks remain available.
- Photographs: Unsplash image URLs embedded in the content; the Alhambra photograph is Juan Laurent's 1871 **Court of the Lions**, public domain, from Wikimedia Commons, with attribution in its story.
- Images and fonts need internet access. External reading links open in a new tab.

`npm run build` produces a static site in `dist/`. The sandbox is a development preview, not a production deployment; no hosting workflow is configured yet.
