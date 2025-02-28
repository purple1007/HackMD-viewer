const { widget } = figma;

const { AutoLayout, Text, Span, SVG } = widget;
import { getTextStyle, TextStyle } from "./utils/styles";
import MarkdownIt from "markdown-it";
import { full as emoji } from "markdown-it-emoji";
import markdownitContainer from "markdown-it-container";
import { MD_CONST } from "./constants/markdown";
import { ImageRenderer } from "./renderer/ImageRenderer";
import { DotByLevel } from "./components/icons";
import YAML from 'js-yaml';

export class MarkdownTreeRenderer {
  // New function: Convert markdown-it tokens to a React-like tree and render them.
  static renderMarkdownAsTree(markdown: string): JSX.Element {
    const md = new MarkdownIt("default", {
      html: true,
      typographer: true,
    });

    md.use(require("markdown-it-abbr"));
    md.use(require("markdown-it-footnote"));
    md.use(require("markdown-it-mark"));
    md.use(require("markdown-it-ins"));
    md.use(require("markdown-it-sub"));
    md.use(require("markdown-it-sup"));
    md.use(require("markdown-it-ruby"));
    md.use(emoji);
    md.use(markdownitContainer, "success");
    md.use(markdownitContainer, "info");
    md.use(markdownitContainer, "warning");
    md.use(markdownitContainer, "danger");
    md.use(require('markdown-it-front-matter'), function(fm) {
    });

    const tokens = md.parse(markdown, {});

    // Process tokens to handle images at block level
    const processedTokens = tokens.reduce(
      (acc: any[], token: any, index: number) => {
        if (token.type === "inline" && token.children) {
          // Find all image indices in children
          const imageIndices = token.children
            .map((t: any, i: number) => (t.type === "image" ? i : -1))
            .filter((i: number) => i !== -1);

          if (imageIndices.length === 0) {
            // No images, just add the token as is
            acc.push(token);
          } else {
            // Split the children around images
            let lastIndex = 0;
            imageIndices.forEach((imgIndex: number) => {
              // Add text before image if exists
              const beforeImage = token.children.slice(lastIndex, imgIndex);
              if (beforeImage.length > 0) {
                acc.push({
                  ...token,
                  children: beforeImage,
                });
              }

              // Close paragraph before image
              if (tokens[index - 1]?.type === "paragraph_open") {
                acc.push({ type: "paragraph_close" });
              }

              // Add the image token
              acc.push(token.children[imgIndex]);

              // Open new paragraph after image
              if (tokens[index + 1]?.type === "paragraph_close") {
                acc.push({ type: "paragraph_open" });
              }

              lastIndex = imgIndex + 1;
            });

            // Add remaining text after last image if exists
            const afterLastImage = token.children.slice(lastIndex);
            if (afterLastImage.length > 0) {
              acc.push({
                ...token,
                children: afterLastImage,
              });
            }
          }
        } else {
          acc.push(token);
        }
        return acc;
      },
      []
    );

    console.log(processedTokens, "processedTokens");

    const treeResult = this.tokenToTree(processedTokens, 0);
    console.log(treeResult, "treeResult");
    return (
      <AutoLayout direction="vertical" width="fill-parent" spacing={10}>
        {treeResult.element}
      </AutoLayout>
    );
  }

  static renderBlockComponent(
    componentType: string,
    index: number,
    children: JSX.Element[],
    token?: any,
    style: TextStyle = {}
  ): JSX.Element {
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
            <AutoLayout
              width="fill-parent"
              direction="horizontal"
              spacing={2}
              wrap
            >
              {children}
            </AutoLayout>
          </AutoLayout>
        );
      case "image":
        const srcAttr = token?.attrs?.find(
          ([attr]: [string, string]) => attr === "src"
        );
        const src = srcAttr?.[1] || "";
        return ImageRenderer.renderImage(
          {
            type: "image",
            src,
          },
          index
        );
      case "hr":
        return (
          <AutoLayout
            key={index}
            width="fill-parent"
            height={1}
            fill={MD_CONST.COLOR.GRAY}
            padding={{ vertical: 10 }}
          />
        );
      case "code_block":
      case "fence":
        return (
          <AutoLayout
            key={index}
            width="fill-parent"
            direction="vertical"
            fill={MD_CONST.COLOR.CODE_BG}
            padding={16}
            cornerRadius={8}
          >
            <Text
              width="fill-parent"
              fontFamily="JetBrains Mono"
              fontSize={14}
              fill={MD_CONST.COLOR.BLACK}
              lineHeight={21}
            >
              {token.content}
            </Text>
          </AutoLayout>
        );
      case "footnote_anchor":
        return (
          <Text key={index} {...getTextStyle({ footnote: true })}>
            [{token.meta.id + 1}]
          </Text>
        );
      default:
        console.log("unsupported block component", componentType, token);
        return (
          <Text key={index}>
            Component {JSON.stringify(componentType)} not supported
          </Text>
        );
    }
  }

  private static tokenToTree(
    tokens: any[],
    index: number = 0,
    style: TextStyle = {}
  ): { element: JSX.Element[]; newIndex: number } {
    const elems: JSX.Element[] = [];
    while (index < tokens.length) {
      const token = tokens[index];

      // Simple key using token type and index
      const tokenKey = `${token.type}-${index}`;

      switch (token.type) {
        case "front_matter": {
          try {
            let yamlData = YAML.load(token.meta);
            const rows = Object.entries(yamlData).map(([key, value], rowIndex) => {
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
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </Text>
                  </AutoLayout>
                </AutoLayout>
              );
            });

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
            console.error('Failed to parse front matter:', e);
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
          const result = this.tokenToTree(tokens, index + 1, newStyle);
          elems.push(
            <AutoLayout key={tokenKey} direction="horizontal" width="fill-parent" wrap>
              {result.element}
            </AutoLayout>
          );
          index = result.newIndex;
          break;
        }
        case "paragraph_open": {
          const result = this.tokenToTree(tokens, index + 1, style);
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
            tokenKey // Pass tokenKey to inlineTokenToTree
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
                const result = this.tokenToTree(tokens, index + 1, style);
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
                const result = this.tokenToTree(tokens, index + 1, style);
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
                const result = this.tokenToTree(tokens, index + 1, style);
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
                const result = this.tokenToTree(tokens, index + 1, style);
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
                const result = this.tokenToTree(tokens, index + 1, style);
                // Use the token.level + 1 to determine the nesting level
                // +1 because level is 0-based but we want 1-based for our DotByLevel function
                const listLevel = token.level + 1;
                elems.push(
                  <AutoLayout
                    key={tokenKey}
                    direction="horizontal"
                    spacing={3}
                    verticalAlignItems="start"
                    width="fill-parent"
                  >
                    <AutoLayout padding={{ top: 8 }}>
                      <SVG src={DotByLevel(listLevel)} />
                    </AutoLayout>
                    <AutoLayout width="fill-parent" direction="vertical">
                      {result.element}
                    </AutoLayout>
                  </AutoLayout>
                );
                index = result.newIndex;
                break;
              }
              case "table_open": {
                const result = this.tokenToTree(tokens, index + 1, style);
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
                const result = this.tokenToTree(tokens, index + 1, style);
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
                const result = this.tokenToTree(tokens, index + 1, style);
                elems.push(
                  <AutoLayout
                    key={tokenKey}
                    width="fill-parent"
                    direction="horizontal"
                    stroke={MD_CONST.COLOR.GRAY}
                    strokeWidth={1}
                    fill={
                      token.tag === "tr" &&
                      tokens[index - 2]?.type === "thead_open"
                        ? MD_CONST.COLOR.CODE_BG
                        : undefined
                    }
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
                const textAlign = align?.includes("text-align:")
                  ? align.split("text-align:")[1].trim()
                  : "left";
                const result = this.tokenToTree(tokens, index + 1, newStyle);
                elems.push(
                  <AutoLayout
                    key={tokenKey}
                    padding={8}
                    width="fill-parent"
                    horizontalAlignText={
                      textAlign as "left" | "center" | "right"
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
                const result = this.tokenToTree(tokens, index + 1, style);
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
                undefined,
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
    parentKey: string = ''
  ): { element: JSX.Element; newIndex: number } {
    const spans: JSX.Element[] = [];
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

    while (index < tokens.length) {
      const token = tokens[index];

      switch (token.type) {
        case "softbreak":
          flushText();
          spans.push(<Span key={`${parentKey}-span-${spanCounter++}`}>{" "}</Span>);
          index++;
          break;

        case "text":
          currentText += token.content;
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

        case "html_inline":
          index++;
          break;

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
            <Span key={`${parentKey}-span-${spanCounter++}`} {...getTextStyle(currentStyle)}>
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
          const hrefAttr = token.attrs?.find(([attr]) => attr === "href");
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
            console.log("unhandled token", token.type, token);
            index++;
          }
          break;
      }
    }

    flushText();
    return {
      element: <Text key={parentKey} width="fill-parent">{spans}</Text>,
      newIndex: index,
    };
  }
}
