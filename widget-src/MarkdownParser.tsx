const { widget } = figma;
const { AutoLayout, Span, Text, Image } = widget;

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
    const md = new MarkdownIt('default', {
      html: true,
      breaks: true,
      linkify: true,
      typographer: false,
    });

    const tokens = md.parse(markdown, {});

    // Process tokens to handle images at block level
    const processedTokens = tokens.reduce((acc: any[], token: any, index: number) => {
      if (token.type === 'inline' && token.children) {
        // Find all image indices in children
        const imageIndices = token.children
          .map((t: any, i: number) => t.type === 'image' ? i : -1)
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
                children: beforeImage
              });
            }

            // Close paragraph before image
            if (tokens[index - 1]?.type === 'paragraph_open') {
              acc.push({ type: 'paragraph_close' });
            }

            // Add the image token
            acc.push(token.children[imgIndex]);

            // Open new paragraph after image
            if (tokens[index + 1]?.type === 'paragraph_close') {
              acc.push({ type: 'paragraph_open' });
            }

            lastIndex = imgIndex + 1;
          });

          // Add remaining text after last image if exists
          const afterLastImage = token.children.slice(lastIndex);
          if (afterLastImage.length > 0) {
            acc.push({
              ...token,
              children: afterLastImage
            });
          }
        }
      } else {
        acc.push(token);
      }
      return acc;
    }, []);

    console.log(processedTokens, 'processedTokens')

    const treeResult = this.tokenToTree(processedTokens, 0);
    return <AutoLayout direction="vertical" width="fill-parent">{treeResult.element}</AutoLayout>;
  }

  static renderComponent(
    componentType: string,
    index: number,
    children: JSX.Element[],
    token?: any
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
        return <AutoLayout width="fill-parent" key={index} spacing={2} wrap>{children}</AutoLayout>;
      case "image":
        const srcAttr = token?.attrs?.find(([attr]: [string, string]) => attr === 'src');
        const src = srcAttr?.[1] || '';
        return ImageRenderer.renderImage({
          type: 'image',
          src,
        }, index)
      default:
        return <Text key={index}>Component {JSON.stringify(componentType)} not supported</Text>;
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
          MarkdownParser.renderComponent(componentType, index, children, token)
        );
      } else if (token.type === "inline") {
        const { element } = MarkdownParser.inlineTokenToTree(token.children, 0);
        elems.push(element);
        index++;
      } else {
        elems.push(MarkdownParser.renderComponent(token.type, index, [], token));
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
    // console.log('inline-tokens', tokens.map(token => token.type))
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
        case "code_inline":
          if (level === 0) {
            elems.push(<Text key={index} {...getTextStyle({ code: true })}>{token.content}</Text>);
          } else {
            elems.push(<Span key={index} {...getTextStyle({ ...style, code: true })}>{token.content}</Span>);
          }
          index++;
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
            console.log('unhandle inline token', token.type)
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
