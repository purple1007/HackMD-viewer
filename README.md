## About HackMD Viewer

![Cover](/assets/HackMD_Viewer_cover.png)

This Figma Plugin allows users to paste HackMD document URLs and render them directly within Figma.
The code was developed with assistance from GitHub Copilot.
If you have any suggestions for improving the code, please feel free to report them.

### Reading private notes

Public notes work with no setup. For a private or team note, add a HackMD API
token and the viewer will read the note through the API instead:

1. In HackMD, go to **Settings → API → Create API token** and copy the token.
2. In Figma, select the widget and choose **設定 HackMD API token** from its
   property menu (or paste the token into the field on the setup card).

Any note the token can read will render — the note does not have to be shared
publicly. The token is stored with `figma.clientStorage`, so it stays on your
own machine: it is never written into the Figma file and collaborators never
see it. They will still see the note content you synced; only refreshing it
requires a token of their own.

### ⚠️ Current Technical Limitations

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
