
## About HackMD Viewer

![Cover](/assets/HackMD_Viewer_cover.png)


This Figma Plugin allows users to paste HackMD document URLs and render them directly within Figma. 
The code was developed with assistance from GitHub Copilot. 
If you have any suggestions for improving the code, please feel free to report them.

### ⚠️ Current Technical Limitations

- Images in HackMD cannot be rendered currently (due to CORS issues)
- The HackMD note's visibility must be set to either "anyone with the link" or "published"
- API integration is not yet supported
- 🚧 Some markdown content does not yet have examples:
  - alert block, code block, qoute block, table, spoiler block


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

| file/folder   | description                                                                      |
| ------------- | -------------------------------------------------------------------------------- |
| manifest.json | The widget's [manifest.json](https://www.figma.com/widget-docs/widget-manifest/) |
| widget-src/   | Contains the widget code                                                         |
| ui-src/       | Contains the iframe code                                                         |

### `npm run dev`

This is the only command you need to run in development. It will start the following processes for you:

- bundling (both widget and iframe code)
- typechecking (both widget and iframe code)
- vite dev server (for iframe development)

### `npm run build`

This runs bundling with minification turned on. You should run this command before releasing your widget.

### `npm run test`

This runs typechecking and makes sure that your widget builds without errors.
