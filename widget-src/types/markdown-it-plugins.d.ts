// The markdown-it plugins we use ship no type declarations. They all share the
// same shape: a plugin function passed to `MarkdownIt.use`.
declare module "markdown-it-abbr" {
  import type { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-footnote" {
  import type { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-mark" {
  import type { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-ins" {
  import type { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-sub" {
  import type { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-sup" {
  import type { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-ruby" {
  import type { PluginSimple } from "markdown-it";
  const plugin: PluginSimple;
  export default plugin;
}

declare module "markdown-it-emoji" {
  import type { PluginSimple } from "markdown-it";
  export const full: PluginSimple;
  export const light: PluginSimple;
  export const bare: PluginSimple;
}

declare module "markdown-it-container" {
  import type { PluginWithOptions } from "markdown-it";
  const plugin: PluginWithOptions<unknown>;
  export default plugin;
}
