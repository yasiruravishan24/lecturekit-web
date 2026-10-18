# Lecture Assistant: web app

Vue 3 + Quasar 2 (Vite), Pinia, Vue Router in hash mode, Axios. It follows `doc/WEB_AND_EXTENSION_PLAN.md` and the screens in `doc/ui-reference`.

The server serves the built app at `/` (the API is under `/api`, same origin), so there is no CORS and no second container. The Docker image builds it in its first stage.

## Run it

```bash
cd lecturekit-web
npm install
npm run dev          # http://localhost:5173, forwards /api to https://localhost:8443 (set LK_API to change)
npm run build        # lecturekit-web/dist, served by the server when WEB_DIST points at it
npm test             # unit tests (Vitest)
```

The local Docker stack must be running for the app to work (`docker compose up -d` in the project folder).

## End-to-end tests (Playwright, a real browser)

```bash
npx playwright install chromium                       # once
npm run dev                                           # in another terminal
npx playwright test                                   # against the dev server
NODE_TLS_REJECT_UNAUTHORIZED=0 LK_WEB=https://localhost:8443 npx playwright test    # against the app served by Docker
```

`flow.spec.js` is the whole student journey (sign-up, wrong code, notes from a recording and slides, quiz, delete the account).
`edge.spec.js` covers a failed job and Try again, the daily limit, someone else's lecture, a lecture saved in two files, a phone-sized screen and printing.
They use the real pipeline, so they cost a few cents of Claude credit. Screenshots go to `test-results/shots`.
The emailed code cannot be read by a test, so the account is confirmed with `python -m server.admin verify-email`.

## Pages

| Route | Page |
|---|---|
| `/login`, `/register`, `/verify` | log in (and Google), create account, 6-digit code |
| `/` | dashboard |
| `/courses`, `/modules/:id` | courses, modules, lectures |
| `/new` | new session: course and module, one or more recording files, slides |
| `/sessions/:id` | progress, failed (Try again), notes (full, short, quiz tab), export |
| `/quizzes`, `/quiz/:id`, `/quiz/:id/result` | quiz list, one question per screen, result with the correct answers |
| `/settings` | account, limits, log out, delete account |

## What differs from the thesis figures

The screens show only what the server can do: no module quiz, no hints or check-after-each-question (the server never sends answers before a submit), no web sources, no recording download. See section 3 of the plan.
