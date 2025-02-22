const { widget } = figma;
const { AutoLayout, Span, Text } = widget;

import { TextSegment } from "./types/text";
import { StyledBlock, styledImage } from "./types/block";

import MarkdownIt from "markdown-it";
import { BlockParser } from "./parser/BlockParser";
import { BlockRenderer } from "./renderer/BlockRenderer";
import { ListRenderer } from "./renderer/ListRenderer";
import { ImageRenderer } from "./renderer/ImageRenderer";
import { getTextStyle, TextStyle } from "./utils/styles";

export class MarkdownParser {
  static parseBlock(markdown: string): StyledBlock[] {
    return BlockParser.parseBlock(markdown);
  }

  static renderBlock(block: StyledBlock, index: number) {
    if (block.type === "list") {
      return ListRenderer.renderList(block, index);
    }
    if (block.type === "image") {
      return ImageRenderer.renderImage(block as styledImage, index);
    }
    return BlockRenderer.renderBlock(block, index);
  }

  // New function: Convert markdown-it tokens to a React-like tree and render them.
  static renderMarkdownAsTree(markdown: string): JSX.Element {
    const md = new MarkdownIt();
    const tokens = md.parse(markdown, {});
    // console.log('markdown-it tokens', tokens);
    const treeResult = this.tokenToTree(tokens, 0);
    return <AutoLayout direction="vertical" width="fill-parent">{treeResult.element}</AutoLayout>;
  }

  static renderComponent(
    componentType: string,
    index: number,
    children: JSX.Element[]
  ): JSX.Element {
    switch (componentType) {
      case "Text":
        return figma.widget.h(componentType, { key: index }, children);
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
        return <AutoLayout width="fill-parent" key={index}>{children}</AutoLayout>;
      case "p":
        return <AutoLayout width="fill-parent" key={index} wrap>{children}</AutoLayout>;
      default:
        return <Text key={index}>Component {componentType} not supported</Text>;
    }
  }

  // Recursively convert tokens to a React-like element tree.
  private static tokenToTree(
    tokens: any[],
    index: number = 0
  ): { element: JSX.Element[]; newIndex: number } {
    const elems: JSX.Element[] = [];
    while (index < tokens.length) {
      const token = tokens[index];
      if (token.type.endsWith("_close")) {
        return { element: elems, newIndex: index + 1 };
      } else if (token.type.endsWith("_open")) {
        const componentType = token.tag;
        const result = this.tokenToTree(tokens, index + 1);
        const children = result.element;
        index = result.newIndex;
        elems.push(
          MarkdownParser.renderComponent(componentType, index, children)
        );
      } else if (token.type === "inline") {
        const { element } = MarkdownParser.inlineTokenToTree(token.children, 0);
        elems.push(<AutoLayout key={index} width="fill-parent" spacing={2} wrap>{element}</AutoLayout>);
        index++;
      } else {
        elems.push(MarkdownParser.renderComponent(token.type, index, []));
        index++;
      }
    }
    return { element: elems, newIndex: index };
  }

  static inlineTokenToTree(
    tokens: any[],
    index: number = 0,
    style: TextStyle = {},
    level: number = 0
  ): { element: JSX.Element[]; newIndex: number } {
    const elems: JSX.Element[] = [];
    console.log('inline-tokens', tokens)
    while (index < tokens.length) {
      const token = tokens[index];
      switch (token.type) {
        case "softbreak":
          elems.push(<Text key={index}>{'\n'}</Text>);
          index++;
          break;
        case "text":
          if (level === 0) {
            elems.push(<Text key={index}>{token.content}</Text>);
          } else {
            elems.push(<Span key={index} {...getTextStyle(style, style.href)}>{token.content}</Span>);
          }
          index++;
          break;
        case "em_open":
          {
            const result = MarkdownParser.inlineTokenToTree(
              tokens,
              index + 1,
              { ...style, italic: true },
              level + 1
            );
            if (level === 0) {
              elems.push(<Text key={index}>{result.element}</Text>);
            } else {
              elems.push(...result.element);
            }
            index = result.newIndex;
          }
          break;
        case "strong_open":
          {
            const result = MarkdownParser.inlineTokenToTree(
              tokens,
              index + 1,
              { ...style, bold: true },
              level + 1
            );
            if (level === 0) {
              elems.push(<Text key={index}>{result.element}</Text>);
            } else {
              elems.push(...result.element);
            }
            index = result.newIndex;
          }
          break;
        case "s_open":
          {
            const result = MarkdownParser.inlineTokenToTree(
              tokens,
              index + 1,
              { ...style, strikethrough: true },
              level + 1
            );
            if (level === 0) {
              elems.push(<Text key={index}>{result.element}</Text>);
            } else {
              elems.push(...result.element);
            }
            index = result.newIndex;
          }
          break;
        case "link_open":
          {
            const hrefAttr = token.attrs?.find(([attr]) => attr === 'href');
            const href = hrefAttr?.[1] || '';
            const result = MarkdownParser.inlineTokenToTree(
              tokens,
              index + 1,
              { ...style, href },
              level + 1
            );
            if (level === 0) {
              elems.push(<Text key={index}>{result.element}</Text>);
            } else {
              elems.push(...result.element);
            }
            index = result.newIndex;
          }
          break;
        default:
          if (token.type.endsWith("_close")) {
            return { element: elems, newIndex: index + 1 };
          } else if (token.type.endsWith("_open")) {
            const result = MarkdownParser.inlineTokenToTree(tokens, index + 1, style, level + 1);
            if (level === 0) {
              elems.push(<Text key={index}>{result.element}</Text>);
            } else {
              elems.push(...result.element);
            }
            index = result.newIndex;
          } else {
            if (level === 0) {
              elems.push(<Text key={index}>{token.content || ""}</Text>);
            } else {
              elems.push(<Span key={index} {...getTextStyle(style, style.href)}>{token.content || ""}</Span>);
            }
            index++;
          }
          break;
      }
    }
    return { element: elems, newIndex: index };
  }
}
