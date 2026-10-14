# Forma Studio

Private AI image and video studio with Google sign-in, Replicate generation, history, favorites, and per-account usage/credits. React/Vite frontend, Express API, Node 24 built-in SQLite, and persistent private media files. No Base44 SDK or externally hosted database is required.

## Development in Base44

```sh
docker compose -f docker-compose.base44.yml up -d --build
```

Open the preview on port 3000. The `dependencies` one-shot service runs `npm ci` against the committed lockfile before either application service starts. Both application services run the bind-mounted checkout with watchers; the frontend proxies `/api` to the backend. SQLite and generated media live in the `app_data` volume. Do not delete that volume when updating dependencies.

The application boots without third-party credentials, showing an honest setup message rather than a simulated login or generated output. Add these through **Secrets**, not a repository `.env` or chat:

- `GOOGLE_CLIENT_ID`: Google Cloud Console → APIs & Services → Credentials → OAuth client ID → Web application.
- `GOOGLE_CLIENT_SECRET`: secret for that same client.
- `REPLICATE_API_TOKEN`: https://replicate.com/account/api-tokens. Replicate billing must be enabled for generation.

Configure the Google consent screen; when the OAuth application is in testing mode, add your Google account as a test user. In the OAuth Web client, register this exact **Authorized redirect URI** for the current environment:

```text
https://3000-${BASE44_PUBLIC_HOST_SUFFIX}/api/auth/google/callback
```

Replace the variable in the Google dashboard with the current preview host (Compose expands it for the server). The sandbox host may change on re-import. This is a server-side redirect flow, not the browser Google SDK; no JavaScript origin registration is required for this implementation. Sign-in opens in a new tab so Google is never embedded in the preview iframe; the original studio refreshes the session when it regains focus. In production set `APP_URL` to the actual HTTPS origin and register `APP_URL/api/auth/google/callback` instead. Do not include a trailing slash in `APP_URL`.

`/run/base44/app.env` is delivered by the platform, is never committed, and is the final `env_file` entry for the API. No credential name is overridden in Compose's `environment`. The platform recreates services after a secret change; do not race it with a separate restart.

### Sandbox-only settings

- `BASE44_PREVIEW_MODE` passes unchanged to the frontend. Exactly `"1"` enables Vite file polling for reliable bind-mount updates; absent/other values keep Vite's normal watcher. It does not change authentication, CSRF, cookies, or TLS.
- Vite consumes the platform-provided `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` to extend its development host list; no global allow-all configuration is used.
- `APP_URL` is configured only in sandbox Compose to the current public origin; it supplies OAuth redirects and the CSRF allowlist. The ordinary default is `http://localhost:3000`.
- `API_PROXY_TARGET=http://api:3001` is Compose-only; ordinary Vite development defaults to `http://localhost:3001`.
- Every long-running service has a responsiveness healthcheck and `restart: on-failure`. The web healthcheck checks the live source entry and API proxy, not a production bundle.

### Verification

```sh
docker compose -f docker-compose.base44.yml exec -T api npm test
docker compose -f docker-compose.base44.yml exec -T web npm run build
curl -f http://localhost:3000/api/session
```

The integration tests use a temporary SQLite database and a mocked media provider. They cover authentication gates, callback state rejection, CSRF, validation, user isolation, favorites, media ownership, successful completion, refunds, insufficient credits, concurrent debits, usage, and logout. They clean up their temporary files. These tests **do not** prove Google or Replicate credentials work.

Browser verification without credentials covers the public studio, prompt entry, image/video selection, inspiration prompts, login gate and all private routes. Completing Google sign-in and checking real image/video results, persisted favorites and usage in a signed-in browser requires your real credentials and an authenticated session. Replicate calls are billable; do not generate paid media as an automated smoke test without approval.

## Model and credit behavior

- Images: `black-forest-labs/flux-schnell`, one image per request; square, portrait and landscape aspect ratios.
- Videos: `minimax/video-01`, text-to-video, native landscape format.
- Each new Google account receives **100 application credits**. Images cost 1 and videos 10; failed generations refund once, transactionally. These are application quotas, **not** the Replicate account balance. There are no payments or credit top-ups in this version.
- Up to 3 in-progress generations per user. The server polls persisted predictions; the frontend refreshes active account data every 6 seconds. Reloading the page does not lose a request.
- A server interruption before a provider prediction ID has been persisted is not resubmitted automatically (to avoid duplicate provider charges); the local credit is refunded after two minutes. The provider may still have billed that interrupted call. Prolonged provider/download failures are reconciled and refunded after 24 hours.
- Successful outputs are downloaded from Replicate delivery hosts to private persistent storage, so history is not dependent on Replicate's expiring URLs. Media is served only through authenticated, owner-checked endpoints. Maximum output size is 200 MB.
- Google OAuth uses PKCE, nonce and single-use expiring state, plus server-side expiring sessions with HttpOnly cookies and hashed session tokens. All mutation endpoints validate the same origin. There is no password or demo-login bypass.

## Running outside Base44 / deployment

There is no configured production deployment pipeline. Use Node 24+, install with `npm ci`, run `npm run build`, and start with `npm start`. The API serves `dist` in production. Configure `PORT`, `APP_URL`, `DATABASE_PATH`, `MEDIA_PATH` and the three external credentials. Use an HTTPS reverse proxy (one trusted proxy hop), mount persistent storage for the database and private media, and back it up. The polling worker is designed for **one API instance**; introduce a coordinated job queue before scaling to multiple API processes.

For ordinary local development, use `npm run dev:server` and `npm run dev` with the same environment. The defaults are frontend port 3000, API port 3001, and `data/` for persistence.
