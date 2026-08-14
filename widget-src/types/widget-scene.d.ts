// Minimal scene-API surface the widget uses to clone itself onto the canvas.
//
// @figma/widget-typings only exposes the widget subset of the API, but a widget
// can reach these at runtime — cloneWidget is how table / sticky widgets spawn
// siblings. Typed here so the call sites don't need `as any`.

interface WidgetNodeLike {
  readonly id: string;
  x: number;
  y: number;
  readonly width: number;
  readonly height: number;
  /** Inserts a copy as a sibling, with the given synced-state overrides. */
  cloneWidget(syncedStateOverrides: { [key: string]: unknown }): WidgetNodeLike;
}

interface FigmaSceneApi {
  getNodeById(id: string): WidgetNodeLike | null;
}
