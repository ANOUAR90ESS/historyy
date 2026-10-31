# Repository notes

- This branch started with only a placeholder README. The homepage is a standalone Arabic RTL Vite app, not an imported framework scaffold or Base44 SDK app.
- Run all Node commands in the `web` service of `docker-compose.base44.yml`. Startup installs the committed lockfile before starting the live-source dev server; do not serve `dist/` in the sandbox.
- No secrets, database, migrations, or auth are needed. Remote fonts/photos need network access.
- Historical content lives in `src/history.js`; preserve stable IDs because both navigation and story controls use them. Keep card summaries within 30 words. Dates are approximate, with regional differences explained on the page.
- `npm test` runs `tests/history.test.js` through Node's test runner. `npm run build` validates the Vite bundle. Both run via `docker compose -f docker-compose.base44.yml exec -T web`.
- Browser checks should exercise the start button, six story dialogs, timeline links, mobile menu, floating era menu, and absence of sideways page overflow. Opening a story creates no persistent data. Dialog focus restoration and reduced motion are intentional accessibility behavior.
- The platform host extension is a Compose environment pass-through, not a permissive Vite config. Unset, normal Vite host restrictions remain intact.
