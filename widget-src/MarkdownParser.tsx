const { widget } = figma;
const { AutoLayout, Span, Text } = widget;

import { TextSegment } from "./types/text";
import { StyledBlock, styledImage } from "./types/block";

import MarkdownIt from "markdown-it";
import { BlockParser } from "./parser/BlockParser";
import { BlockRenderer } from "./renderer/BlockRenderer";
import { ListRenderer } from "./renderer/ListRenderer";
import { ImageRenderer } from "./renderer/ImageRenderer";

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
    console.log('markdown-it tokens', tokens);
    const treeResult = this.tokenToTree(tokens, 0);
    return <AutoLayout direction="vertical">{treeResult.element}</AutoLayout>;
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
        return <AutoLayout key={index}>{children}</AutoLayout>;
      case "p":
        return <AutoLayout key={index}>{children}</AutoLayout>;
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
        elems.push(<AutoLayout key={index}>{element}</AutoLayout>);
        index++;
      } else {
        elems.push(MarkdownParser.renderComponent(token.type, index, []));
        index++;
      }
    }
    return { element: elems, newIndex: index };
  }

  static renderInlineComponent(tokens: any[], index: number = 0): { element: JSX.Element[]; newIndex: number } {
    const elems: JSX.Element[] = [];
    while (index < tokens.length) {
      const token = tokens[index];
      if (token.type.endsWith("_close")) {
        return { element: elems, newIndex: index + 1 };
      } else if (token.type.endsWith("_open")) {
        const result = MarkdownParser.renderInlineComponent(tokens, index + 1);
        elems.push(
          <Text key={index}>
            {result.element}
          </Text>
        );
        index = result.newIndex;
      } else if (token.type === "text") {
        elems.push(<Text key={index}>{token.content}</Text>);
        index++;
      } else {
        elems.push(<Text key={index}>{token.content || ""}</Text>);
        index++;
      }
    }
    return { element: elems, newIndex: index };
  }

  static inlineTokenToTree(tokens: any[], index: number = 0): { element: JSX.Element[]; newIndex: number } {
    const elems: JSX.Element[] = [];
    while (index < tokens.length) {
      const token = tokens[index];
      switch (token.type) {
        case "text":
          elems.push(<Text key={index}>{token.content}</Text>);
          index++;
          break;
        case "em_open":
          {
            const result = MarkdownParser.inlineTokenToTree(tokens, index + 1);
            elems.push(<AutoLayout key={index}>{result.element}</AutoLayout>);
            index = result.newIndex;
          }
          break;
        case "em_close":
          return { element: elems, newIndex: index + 1 };
        default:
          if (token.type.endsWith("_open")) {
            const result = MarkdownParser.inlineTokenToTree(tokens, index + 1);
            elems.push(<AutoLayout key={index}>{result.element}</AutoLayout>);
            index = result.newIndex;
          } else if (token.type.endsWith("_close")) {
            return { element: elems, newIndex: index + 1 };
          } else {
            elems.push(<Text key={index}>{token.content || ""}</Text>);
            index++;
          }
          break;
      }
    }
    return { element: elems, newIndex: index };
  }
}
