const { widget } = figma;

const { AutoLayout, Text, Span, SVG, Line } = widget;
import { getTextStyle, TextStyle } from "./utils/styles";
import MarkdownIt from "markdown-it";
import { full as emoji } from "markdown-it-emoji";
import markdownitContainer from "markdown-it-container";
import markdownitAbbr from "markdown-it-abbr";
import markdownitFootnote from "markdown-it-footnote";
import markdownitMark from "markdown-it-mark";
import markdownitIns from "markdown-it-ins";
import markdownitSub from "markdown-it-sub";
import markdownitSup from "markdown-it-sup";
import markdownitRuby from "markdown-it-ruby";
import markdownitFrontMatter from "markdown-it-front-matter";
import { MD_CONST } from "./constants/markdown";
import { CheckIcon, DotByLevel, UnCheckIcon } from "./components/icons";
import YAML from "js-yaml";

type CellAlign = "left" | "center" | "right";

/**
 * Context that flows down the token tree alongside the text style: things a
 * child needs to know about its ancestors but that aren't styling.
 */
interface TreeContext {
  /** Rows inside <thead> get the shaded background. */
  inTableHead?: boolean;
  /** Alignment declared by the enclosing th/td. */
  cellAlign?: CellAlign;
  /** The enclosing list; `next` is mutated as items are emitted. */
  list?: { ordered: boolean; next: number };
}

/** Renders raw HTML as plain text — a widget can't render markup. */
const htmlToText = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

export class MarkdownTreeRenderer {
  // New function: Convert markdown-it tokens to a React-like tree and render them.
  static renderMarkdownAsTree(markdown: string): FigmaDeclarativeNode {
    const md = new MarkdownIt("default", {
      html: true,
      // Match HackMD: bare URLs become links, but no smart-quote substitution.
      linkify: true,
      typographer: false,
    });

    md.use(markdownitAbbr);
    md.use(markdownitFootnote);
    md.use(markdownitMark);
    md.use(markdownitIns);
    md.use(markdownitSub);
    md.use(markdownitSup);
    md.use(markdownitRuby);
    md.use(emoji);
    md.use(markdownitContainer, "success");
    md.use(markdownitContainer, "info");
    md.use(markdownitContainer, "warning");
    md.use(markdownitContainer, "danger");
    // The front matter body is rendered from the token instead of the callback.
    md.use(markdownitFrontMatter, () => {});

    const tokens = md.parse(markdown, {});

    const treeResult = this.tokenToTree(tokens, 0);
    return (
      <AutoLayout direction="vertical" width="fill-parent" spacing={10}>
        {treeResult.element}
      </AutoLayout>
    );
  }

  static renderBlockComponent(
    componentType: string,
    index: number,
    children: FigmaDeclarativeNode[],
    token?: any,
    style: TextStyle = {}
  ): FigmaDeclarativeNode {
    switch (componentType) {
      case "Text":
        return figma.widget.h(
          componentType,
          { key: index, ...getTextStyle(style, style.href) },
          children
        );
      case "p":
        return (
          <AutoLayout
            width="fill-parent"
            key={index}
            spacing={2}
            wrap
            direction="horizontal"
          >
            {children}
          </AutoLayout>
        );
      case "blockquote":
        return (
          <AutoLayout
            width="fill-parent"
            key={index}
            direction="horizontal"
            spacing={16}
          >
            <AutoLayout
              width={4}
              height="fill-parent"
              fill={MD_CONST.COLOR.GRAY}
            />
            <AutoLayout width="fill-parent" direction="vertical" spacing={10}>
              {children}
            </AutoLayout>
          </AutoLayout>
        );
      case "hr":
        // A transparent box supplies the vertical breathing room; the Line is
        // the actual 1px rule. (Padding on a filled box made a ~21px grey bar.)
        return (
          <AutoLayout
            key={index}
            width="fill-parent"
            padding={{ vertical: 10 }}
          >
            <Line length="fill-parent" stroke={MD_CONST.COLOR.GRAY} />
          </AutoLayout>
        );
      case "code_block":
      case "fence": {
        // `token.info` holds the fence info string, e.g. ```ts=  -> "ts="
        const language = String(token.info ?? "")
          .trim()
          .split(/[\s=]/)[0];
        return (
          <AutoLayout
            key={index}
            width="fill-parent"
            direction="vertical"
            fill={MD_CONST.COLOR.CODE_BG}
            padding={16}
            spacing={8}
            cornerRadius={8}
          >
            {language ? (
              <Text
                fontFamily="JetBrains Mono"
                fontSize={12}
                fill={MD_CONST.COLOR.GRAY}
                textCase="lower"
              >
                {language}
              </Text>
            ) : null}
            <Text
              width="fill-parent"
              fontFamily="JetBrains Mono"
              fontSize={14}
              fill={MD_CONST.COLOR.BLACK}
              lineHeight={21}
            >
              {String(token.content ?? "").replace(/\n+$/, "")}
            </Text>
          </AutoLayout>
        );
      }
      case "html_block": {
        const text = htmlToText(token?.content ?? "");
        if (!text) return <AutoLayout key={index} hidden />;
        return (
          <Text key={index} width="fill-parent" {...getTextStyle(style)}>
            {text}
          </Text>
        );
      }
      case "footnote_anchor":
        return (
          <Text key={index} {...getTextStyle({ footnote: true })}>
            [{token.meta.id + 1}]
          </Text>
        );
      default:
        return (
          <Text key={index}>
            Component {JSON.stringify(componentType)} not supported
          </Text>
        );
    }
  }

  /**
   * Looks ahead from a `list_item_open` for the item's first inline token and,
   * if it starts with a task-list marker, strips the marker and reports its
   * checked state. Returns null for ordinary list items.
   */
  private static takeTaskMarker(
    tokens: any[],
    listItemIndex: number
  ): { checked: boolean } | null {
    for (let i = listItemIndex + 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === "inline") {
        const first = token.children?.[0];
        if (first?.type !== "text") return null;
        const match = /^\[([ xX])\]\s+/.exec(first.content);
        if (!match) return null;
        first.content = first.content.slice(match[0].length);
        return { checked: match[1] !== " " };
      }
      // Only the item's own opening wrapper may sit before its first inline.
      if (token.type !== "paragraph_open") return null;
    }
    return null;
  }

  private static tokenToTree(
    tokens: any[],
    index: number = 0,
    style: TextStyle = {},
    ctx: TreeContext = {}
  ): { element: FigmaDeclarativeNode[]; newIndex: number } {
    const elems: FigmaDeclarativeNode[] = [];
    while (index < tokens.length) {
      const token = tokens[index];

      // Simple key using token type and index
      const tokenKey = `${token.type}-${index}`;

      switch (token.type) {
        case "front_matter": {
          try {
            const yamlData = (YAML.load(token.meta) ?? {}) as Record<
              string,
              unknown
            >;
            const rows = Object.entries(yamlData).map(
              ([key, value], rowIndex) => {
                // Simple key using property key and row index
                return (
                  <AutoLayout
                    key={`${key}-${rowIndex}`}
                    width="fill-parent"
                    direction="horizontal"
                    stroke={MD_CONST.COLOR.GRAY}
                    strokeWidth={1}
                  >
                    <AutoLayout
                      padding={8}
                      width="fill-parent"
                      fill={MD_CONST.COLOR.CODE_BG}
                    >
                      <Text
                        width="fill-parent"
                        {...getTextStyle({ bold: true })}
                      >
                        {key}
                      </Text>
                    </AutoLayout>
                    <AutoLayout
                      padding={8}
                      width="fill-parent"
                      height="fill-parent"
                      verticalAlignItems="baseline"
                    >
                      <Text
                        width="fill-parent"
                        fontFamily="JetBrains Mono"
                        fontSize={14}
                        lineHeight={28}
                      >
                        {typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </Text>
                    </AutoLayout>
                  </AutoLayout>
                );
              }
            );

            elems.push(
              <AutoLayout
                key={tokenKey}
                width="fill-parent"
                direction="vertical"
                stroke={MD_CONST.COLOR.GRAY}
                strokeWidth={1}
                cornerRadius={4}
                overflow="hidden"
              >
                {rows}
              </AutoLayout>
            );
            index++;
          } catch (e) {
            console.error("Failed to parse front matter:", e);
            index++;
          }
          break;
        }
        case "heading_open": {
          const level = Number.parseInt(token.tag.substring(1), 10);
          const newStyle = {
            ...style,
            heading: { level },
          };
          const result = this.tokenToTree(tokens, index + 1, newStyle, ctx);
          elems.push(
            <AutoLayout
              key={tokenKey}
              direction="horizontal"
              width="fill-parent"
              wrap
            >
              {result.element}
            </AutoLayout>
          );
          index = result.newIndex;
          break;
        }
        case "paragraph_open": {
          const result = this.tokenToTree(tokens, index + 1, style, ctx);
          elems.push(
            <AutoLayout
              key={tokenKey}
              direction="horizontal"
              width="fill-parent"
              wrap
              spacing={3}
            >
              {result.element}
            </AutoLayout>
          );
          index = result.newIndex;
          break;
        }
        case "inline": {
          const { element } = MarkdownTreeRenderer.inlineTokenToTree(
            token.children,
            0,
            style,
            tokenKey, // Pass tokenKey to inlineTokenToTree
            ctx.cellAlign
          );
          elems.push(element);
          index++;
          break;
        }
        default: {
          if (token.type.endsWith("_close")) {
            return { element: elems, newIndex: index + 1 };
          } else if (token.type.endsWith("_open")) {
            switch (token.type) {
              case "footnote_block_open": {
                const result = this.tokenToTree(tokens, index + 1, style, ctx);
                elems.push(
                  <AutoLayout
                    key={tokenKey}
                    width="fill-parent"
                    direction="vertical"
                    spacing={8}
                    padding={{ top: 16 }}
                  >
                    <AutoLayout
                      width="fill-parent"
                      height={1}
                      fill={MD_CONST.COLOR.GRAY}
                    />
                    {result.element}
                  </AutoLayout>
                );
                index = result.newIndex;
                break;
              }
              case "footnote_open": {
                const result = this.tokenToTree(tokens, index + 1, style, ctx);
                elems.push(
                  <AutoLayout
                    key={tokenKey}
                    width="fill-parent"
                    direction="horizontal"
                    spacing={4}
                  >
                    <Text
                      {...getTextStyle({ footnote: true })}
                      width="hug-contents"
                    >
                      [{token.meta?.id + 1}]
                    </Text>
                    <AutoLayout
                      width="fill-parent"
                      direction="horizontal"
                      spacing={2}
                      wrap
                    >
                      {result.element}
                    </AutoLayout>
                  </AutoLayout>
                );
                index = result.newIndex;
                break;
              }
              case "container_success_open":
              case "container_info_open":
              case "container_warning_open":
              case "container_danger_open": {
                const result = this.tokenToTree(tokens, index + 1, style, ctx);
                const bgColor =
                  token.type === "container_success_open"
                    ? "#D9F9E5"
                    : token.type === "container_info_open"
                    ? "#E0F2FE"
                    : token.type === "container_warning_open"
                    ? "#FEF7DD"
                    : "#FEEDED";
                elems.push(
                  <AutoLayout
                    key={tokenKey}
                    width="fill-parent"
                    direction="vertical"
                    padding={10}
                    fill={bgColor}
                    spacing={8}
                  >
                    {result.element}
                  </AutoLayout>
                );
                index = result.newIndex;
                break;
              }
              case "bullet_list_open":
              case "ordered_list_open": {
                const isNested = token.level > 0;
                const startAttr = token.attrs?.find(
                  ([attr]: [string, string]) => attr === "start"
                )?.[1];
                // A fresh counter per list so nested lists don't share numbering.
                const listCtx: TreeContext = {
                  ...ctx,
                  list:
                    token.type === "ordered_list_open"
                      ? { ordered: true, next: Number(startAttr ?? 1) || 1 }
                      : { ordered: false, next: 1 },
                };
                const result = this.tokenToTree(
                  tokens,
                  index + 1,
                  style,
                  listCtx
                );
                if (isNested) {
                  elems.push(
                    <AutoLayout
                      key={tokenKey}
                      direction="vertical"
                      width="fill-parent"
                      spacing={8}
                      padding={{ left: 24 }}
                    >
                      {result.element}
                    </AutoLayout>
                  );
                } else {
                  elems.push(
                    <AutoLayout
                      key={tokenKey}
                      direction="vertical"
                      width="fill-parent"
                      spacing={8}
                    >
                      {result.element}
                    </AutoLayout>
                  );
                }
                index = result.newIndex;
                break;
              }
              case "list_item_open": {
                // `- [ ] foo` / `- [x] foo` — markdown-it has no notion of task
                // lists, so strip the marker off the item's first text token and
                // render a checkbox instead of a bullet.
                const task = MarkdownTreeRenderer.takeTaskMarker(tokens, index);
                const result = this.tokenToTree(tokens, index + 1, style, ctx);
                // Use the token.level + 1 to determine the nesting level
                // +1 because level is 0-based but we want 1-based for our DotByLevel function
                const listLevel = token.level + 1;
                const ordered = ctx.list?.ordered === true;
                const marker = ctx.list && ordered ? ctx.list.next++ : 0;
                elems.push(
                  <AutoLayout
                    key={tokenKey}
                    direction="horizontal"
                    spacing={6}
                    verticalAlignItems="start"
                    width="fill-parent"
                  >
                    {task ? (
                      // The checkbox is a small glyph; nudge it down to sit on
                      // the text's first line.
                      <AutoLayout padding={{ top: 4 }}>
                        <SVG src={task.checked ? CheckIcon : UnCheckIcon} />
                      </AutoLayout>
                    ) : ordered ? (
                      // Plain text at the content's line height and top-aligned,
                      // so "1." and "57." line up with the item and never wrap.
                      <Text {...getTextStyle(style)}>{`${marker}.`}</Text>
                    ) : (
                      <AutoLayout padding={{ top: 8 }}>
                        <SVG src={DotByLevel(listLevel)} />
                      </AutoLayout>
                    )}
                    <AutoLayout width="fill-parent" direction="vertical">
                      {result.element}
                    </AutoLayout>
                  </AutoLayout>
                );
                index = result.newIndex;
                break;
              }
              case "table_open": {
                const result = this.tokenToTree(tokens, index + 1, style, ctx);
                elems.push(
                  <AutoLayout
                    key={tokenKey}
                    width="fill-parent"
                    direction="vertical"
                    stroke={MD_CONST.COLOR.GRAY}
                    strokeWidth={1}
                    cornerRadius={4}
                    overflow="hidden"
                  >
                    {result.element}
                  </AutoLayout>
                );
                index = result.newIndex;
                break;
              }
              case "thead_open":
              case "tbody_open": {
                const result = this.tokenToTree(tokens, index + 1, style, {
                  ...ctx,
                  inTableHead: token.type === "thead_open",
                });
                elems.push(
                  <AutoLayout
                    key={tokenKey}
                    width="fill-parent"
                    direction="vertical"
                  >
                    {result.element}
                  </AutoLayout>
                );
                index = result.newIndex;
                break;
              }
              case "tr_open": {
                const result = this.tokenToTree(tokens, index + 1, style, ctx);
                elems.push(
                  <AutoLayout
                    key={tokenKey}
                    width="fill-parent"
                    direction="horizontal"
                    stroke={MD_CONST.COLOR.GRAY}
                    strokeWidth={1}
                    fill={ctx.inTableHead ? MD_CONST.COLOR.CODE_BG : undefined}
                  >
                    {result.element}
                  </AutoLayout>
                );
                index = result.newIndex;
                break;
              }
              case "th_open":
              case "td_open": {
                let newStyle = { ...style };
                if (token.type === "th_open") {
                  newStyle.bold = true;
                }
                const align = token.attrs?.find(
                  ([attr]: [string, string]) => attr === "style"
                )?.[1];
                const textAlign = (
                  align?.includes("text-align:")
                    ? align.split("text-align:")[1].trim()
                    : "left"
                ) as CellAlign;
                const result = this.tokenToTree(tokens, index + 1, newStyle, {
                  ...ctx,
                  cellAlign: textAlign,
                });
                elems.push(
                  <AutoLayout
                    key={tokenKey}
                    padding={8}
                    width="fill-parent"
                    verticalAlignItems="start"
                    horizontalAlignItems={
                      textAlign === "center"
                        ? "center"
                        : textAlign === "right"
                        ? "end"
                        : "start"
                    }
                  >
                    {result.element}
                  </AutoLayout>
                );
                index = result.newIndex;
                break;
              }
              default: {
                const componentType = token.tag;
                const result = this.tokenToTree(tokens, index + 1, style, ctx);
                elems.push(
                  MarkdownTreeRenderer.renderBlockComponent(
                    componentType,
                    index,
                    result.element,
                    token,
                    style
                  )
                );
                index = result.newIndex;
                break;
              }
            }
            break;
          } else {
            elems.push(
              MarkdownTreeRenderer.renderBlockComponent(
                token.type,
                index, // Use index for key
                [],
                token,
                style
              )
            );
            index++;
          }
        }
      }
    }
    return { element: elems, newIndex: index };
  }

  // Modify to accept a key parameter
  static inlineTokenToTree(
    tokens: any[],
    index: number = 0,
    style: TextStyle = {},
    parentKey: string = "",
    align?: CellAlign
  ): { element: FigmaDeclarativeNode; newIndex: number } {
    const spans: (string | number | FigmaVirtualNode<"span">)[] = [];
    let currentStyle = { ...style };
    let currentText = "";
    let spanCounter = 0;

    const flushText = () => {
      if (currentText) {
        spans.push(
          <Span
            key={`${parentKey}-span-${spanCounter++}`}
            {...getTextStyle(currentStyle, currentStyle.href)}
          >
            {currentText}
          </Span>
        );
        currentText = "";
      }
    };

    // HackMD `@username` mentions arrive as plain text in the raw markdown, so
    // style them as links to the user's HackMD profile. Only a handle preceded
    // by start-of-string / whitespace / an opening punctuation is treated as a
    // mention, which keeps email local-parts (foo@bar) out.
    const MENTION =
      /(^|[\s(，、,])@([A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?)/g;
    const appendText = (text: string) => {
      let last = 0;
      let match: RegExpExecArray | null;
      MENTION.lastIndex = 0;
      while ((match = MENTION.exec(text))) {
        const at = match.index + match[1].length; // index of the '@'
        currentText += text.slice(last, at);
        flushText();
        const href = `https://hackmd.io/@${match[2]}`;
        spans.push(
          <Span
            key={`${parentKey}-span-${spanCounter++}`}
            {...getTextStyle({ ...currentStyle, href }, href)}
          >
            {`@${match[2]}`}
          </Span>
        );
        last = MENTION.lastIndex;
      }
      currentText += text.slice(last);
    };

    while (index < tokens.length) {
      const token = tokens[index];

      switch (token.type) {
        case "softbreak":
          flushText();
          spans.push(<Span key={`${parentKey}-span-${spanCounter++}`}> </Span>);
          index++;
          break;

        case "text":
          appendText(token.content);
          index++;
          break;

        case "code_inline":
          flushText();
          spans.push(
            <Span
              key={`${parentKey}-span-${spanCounter++}`}
              {...getTextStyle({ ...currentStyle, code: true })}
            >
              {token.content}
            </Span>
          );
          index++;
          break;

        case "image": {
          flushText();
          const src =
            token.attrs?.find(
              ([attr]: [string, string]) => attr === "src"
            )?.[1] || "";
          const alt = (token.content || "").trim();
          spans.push(
            <Span
              key={`${parentKey}-span-${spanCounter++}`}
              {...getTextStyle({ ...currentStyle, href: src }, src)}
            >
              {`🖼 ${alt || src}`}
            </Span>
          );
          index++;
          break;
        }

        case "hardbreak":
          currentText += "\n";
          index++;
          break;

        case "html_inline": {
          const text = htmlToText(token.content);
          if (text) currentText += text;
          else if (/<br\s*\/?>/i.test(token.content)) currentText += "\n";
          index++;
          break;
        }

        case "footnote_ref":
          flushText();
          spans.push(
            <Span
              key={`${parentKey}-span-${spanCounter++}`}
              {...getTextStyle({ ...currentStyle, footnote: true })}
            >
              [{token.meta.id + 1}]
            </Span>
          );
          index++;
          break;

        case "emoji":
          flushText();
          spans.push(
            <Span
              key={`${parentKey}-span-${spanCounter++}`}
              {...getTextStyle(currentStyle)}
            >
              {token.content}
            </Span>
          );
          index++;
          break;

        case "strong_open":
          flushText();
          currentStyle = { ...currentStyle, bold: true };
          index++;
          break;

        case "em_open":
          flushText();
          currentStyle = { ...currentStyle, italic: true };
          index++;
          break;

        case "s_open":
          flushText();
          currentStyle = { ...currentStyle, strikethrough: true };
          index++;
          break;

        case "mark_open":
          flushText();
          currentStyle = { ...currentStyle, highlight: true };
          index++;
          break;

        case "ins_open":
          flushText();
          currentStyle = { ...currentStyle, underline: true };
          index++;
          break;

        case "abbr_open":
          flushText();
          // Style abbreviations the same as underlined text
          currentStyle = { ...currentStyle, underline: true };
          index++;
          break;

        case "sup_open":
          flushText();
          currentStyle = { ...currentStyle, sup: true };
          index++;
          break;

        case "sub_open":
          flushText();
          currentStyle = { ...currentStyle, sub: true };
          index++;
          break;

        case "ruby_open":
          flushText();
          currentStyle = { ...currentStyle, ruby: true };
          index++;
          break;

        case "rt_open":
          flushText();
          currentStyle = { ...currentStyle, rt: true };
          index++;
          break;

        case "link_open":
          flushText();
          const hrefAttr = token.attrs?.find(
            ([attr]: [string, string]) => attr === "href"
          );
          currentStyle = { ...currentStyle, href: hrefAttr?.[1] || "" };
          index++;
          break;

        default:
          if (token.type.endsWith("_close")) {
            flushText();
            const styleKey = token.type.replace("_close", "");
            switch (styleKey) {
              case "strong":
                currentStyle = { ...currentStyle, bold: false };
                break;
              case "em":
                currentStyle = { ...currentStyle, italic: false };
                break;
              case "s":
                currentStyle = { ...currentStyle, strikethrough: false };
                break;
              case "mark":
                currentStyle = { ...currentStyle, highlight: false };
                break;
              case "ins":
                currentStyle = { ...currentStyle, underline: false };
                break;
              case "abbr":
                // Reset the underline style when closing an abbreviation
                currentStyle = { ...currentStyle, underline: false };
                break;
              case "sup":
                currentStyle = { ...currentStyle, sup: false };
                break;
              case "sub":
                currentStyle = { ...currentStyle, sub: false };
                break;
              case "ruby":
                currentStyle = { ...currentStyle, ruby: false };
                break;
              case "rt":
                currentStyle = { ...currentStyle, rt: false };
                break;
              case "link":
                currentStyle = { ...currentStyle, href: undefined };
                break;
            }
            index++;
          } else {
            index++;
          }
          break;
      }
    }

    flushText();
    return {
      element: (
        <Text
          key={parentKey}
          width="fill-parent"
          horizontalAlignText={align ?? "left"}
        >
          {spans}
        </Text>
      ),
      newIndex: index,
    };
  }
}
