## About HackMD Viewer

![Cover](/assets/HackMD_Viewer_cover.png)

This Figma Plugin allows users to paste HackMD document URLs and render them directly within Figma.
The code was developed with assistance from GitHub Copilot.
If you have any suggestions for improving the code, please feel free to report them.

### Which notes can be rendered

The deciding factor is **whether a note can be downloaded without a token** —
that is, it is shared with "Anyone with the link" or published. This has nothing
to do with whether it's a personal or a team note: a public team note renders,
and a private personal note does not.

Why: a widget's `fetch` is a real browser request from a **null-origin iframe**,
so it can only read endpoints that send `Access-Control-Allow-Origin: *`
([Figma docs](https://developers.figma.com/docs/plugins/making-network-requests/)).
`networkAccess.allowedDomains` is a whitelist, not a proxy. What HackMD sends:

| endpoint                                 | status  | CORS      |
| ---------------------------------------- | ------- | --------- |
| `hackmd.io/{shortId}/download` (public)  | 200     | `ACAO: *` |
| `hackmd.io/{shortId}/download` (private) | 403     | no ACAO   |
| `hackmd.io/s/{publishId}/download`       | 200     | `ACAO: *` |
| `api.hackmd.io/v1/*` (needs a token)     | 400 / — | no ACAO   |

So a public / link-readable / published note is read straight from `/download`
(which sends CORS headers) with no token involved. A private note's `/download`
returns 403, leaving only the token-authenticated `api.hackmd.io` — which the
browser blocks. See below.

### Private notes are not supported yet (known limitation)

Reading a private note requires the authenticated API (`api.hackmd.io`, called
with your token). That path is fully implemented in `widget-src/api/hackmd.ts`
— `GET /notes/{id}` for personal notes, and `GET /teams` →
`GET /teams/{path}/notes` → `GET /teams/{path}/notes/{id}` for team notes — but
it **cannot run inside a widget today**: `api.hackmd.io` returns no
`Access-Control-Allow-Origin`, and the `Authorization` header forces a CORS
preflight that it answers with `400`. The browser blocks the request before it
is sent, so private notes (personal or team) can't be loaded. The widget reports
this clearly instead of failing with a raw CORS error.

This is a deliberate limitation for now, not an open work item. Unblocking it
would require `api.hackmd.io` to send `Access-Control-Allow-Origin: *` and answer
the `OPTIONS` preflight with a `2xx` carrying
`Access-Control-Allow-Headers: Authorization`. `*` is safe there because the API
authenticates with a bearer header rather than cookies, so no credentials ride
along on a cross-origin request. If that ever ships, the existing client works
with no changes.

When a token is set it is stored with `figma.clientStorage`, so it stays on your
own machine: it is never written into the Figma file and collaborators never see
it.

### ⚠️ Current Technical Limitations

- Private notes can't be read yet, personal or team alike — only notes that
  download without a token (public / link-readable / published) render
- Use a note's short URL (`/xxxxxxxx` or `/@owner/xxxxxxxx`), not a custom
  permalink — a custom permalink has no download route
- Images are shown as links rather than embedded — open the original note to
  view them
- Raw HTML blocks are rendered as plain text
- Not supported yet: `:::spoiler`, `[TOC]`, math (KaTeX) and diagram blocks
  (mermaid / sequence / graphviz)
- No syntax highlighting inside code blocks (the language is shown as a label)

## @figma/create-widget

This repo was created by @figma/create-widget

## Getting started

Run the following command to start building your widget

```bash
npm run dev
```

1. Log in to your account and open the Figma desktop app
2. You can open any existing FigJam document or create a new one.
3. Go to Menu > Widgets > Development > "Import widget from manifest..."
4. Select the manifest.json in this folder

## Organization

This widget uses:

- [esbuild](https://esbuild.github.io/) for bundling
- [vite](https://vitejs.dev/) and [react](https://reactjs.org/) for the iframe
- [typescript](https://www.typescriptlang.org/) for typechecking

| file/folder     | description                                                                      |
| --------------- | -------------------------------------------------------------------------------- |
| manifest.json   | The widget's [manifest.json](https://www.figma.com/widget-docs/widget-manifest/) |
| widget-src/     | Contains the widget code                                                         |
| widget-src/api/ | HackMD URL parsing and API client                                                |
| ui-src/         | Contains the iframe code                                                         |

### `npm run dev`

This is the only command you need to run in development. It will start the following processes for you:

- bundling (both widget and iframe code)
- typechecking (both widget and iframe code)
- vite dev server (for iframe development)

### `npm run build`

This runs bundling with minification turned on. You should run this command before releasing your widget.

### `npm run test`

This runs typechecking and makes sure that your widget builds without errors.
