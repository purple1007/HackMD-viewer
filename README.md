## About HackMD Viewer

![Cover](/assets/HackMD_Viewer_cover.png)

This Figma Plugin allows users to paste HackMD document URLs and render them directly within Figma.
The code was developed with assistance from GitHub Copilot.
If you have any suggestions for improving the code, please feel free to report them.

### Which notes can be rendered

A widget's `fetch` is a real browser request from a **null-origin iframe**, so it
can only read endpoints that send `Access-Control-Allow-Origin: *`
([Figma docs](https://developers.figma.com/docs/plugins/making-network-requests/)).
`networkAccess.allowedDomains` is a whitelist, not a proxy. What HackMD sends:

| endpoint                                | status | CORS      |
| --------------------------------------- | ------ | --------- |
| `hackmd.io/{shortId}/download`          | 200    | `ACAO: *` |
| `hackmd.io/@owner/{shortId}/download`   | 200    | `ACAO: *` |
| `hackmd.io/s/{publishId}/download`      | 200    | `ACAO: *` |
| `hackmd.io/@owner/{permalink}/download` | 404    | no route  |
| `hackmd.io/@owner/{permalink}`          | 200    | no ACAO   |
| `api.hackmd.io/v1/*`                    | —      | no ACAO   |

So today the viewer renders **notes readable via a link, or published notes**,
addressed by their **short URL** (`/xxxxxxxx` or `/@owner/xxxxxxxx`). A custom
permalink has no CORS-reachable route — use the note's short URL instead.

### Reading private notes (blocked on the API)

`widget-src/api/hackmd.ts` implements the authenticated path — `GET /notes/{id}`,
plus permalink resolution via `GET /teams` and `GET /teams/{path}/notes` — and it
is wired up behind the token setting. It cannot run yet: `api.hackmd.io` returns
no `Access-Control-Allow-Origin`, and because the `Authorization` header forces a
CORS preflight, its `OPTIONS` response (currently `400`, no CORS headers) blocks
the request before it is sent.

**To unblock it, `api.hackmd.io` needs to send:**

- `Access-Control-Allow-Origin: *` on responses, and
- `Access-Control-Allow-Headers: Authorization` on the preflight, answering
  `OPTIONS` with a `2xx`.

`*` is safe here because the API authenticates with a bearer token in a header
rather than cookies, so no credentials are attached to a cross-origin request.
Once those headers ship, any note the token can read will render with no client
change; until then the widget explains why a private note failed instead of
showing a CORS error.

When a token is set it is stored with `figma.clientStorage`, so it stays on your
own machine: it is never written into the Figma file and collaborators never see
it.

### ⚠️ Current Technical Limitations

- Private notes cannot be read yet — see above
- Notes must be addressed by short URL, not by a custom permalink
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
