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
import { MD_CONST } from "./constants/markdown";
import { Children } from "react";

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
    console.log(treeResult, 'treeResult')
    return <AutoLayout direction="vertical" width="fill-parent" spacing={10}>{treeResult.element}</AutoLayout>;
  }

  static renderBlockComponent(
    componentType: string,
    index: number,
    children: JSX.Element[],
    token?: any,
    style: TextStyle = {},
  ): JSX.Element {
    console.log('renderComponent', componentType)
    switch (componentType) {
      case "Text":
        return figma.widget.h(componentType, { key: index, ...getTextStyle(style, style.href) }, children);
      case "p":
        return (
          <AutoLayout width="fill-parent" key={index} spacing={2} wrap direction="horizontal">
            {children}
          </AutoLayout>
        );
      case "blockquote":
        return (
          <AutoLayout width="fill-parent" key={index} spacing={2} wrap direction="horizontal" fill='#cecece' padding={10} cornerRadius={6}>
            {children}
          </AutoLayout>
        );
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

  private static tokenToTree(
    tokens: any[],
    index: number = 0,
    style: TextStyle = {}
  ): { element: JSX.Element[]; newIndex: number } {
    const elems: JSX.Element[] = [];
    while (index < tokens.length) {
      const token = tokens[index];
      console.log(token, 'token')

      switch (token.type) {
        case 'heading_open': {
          const level = Number.parseInt(token.tag.substring(1), 10);
          const newStyle = {
            ...style,
            heading: { level }
          };
          const result = this.tokenToTree(tokens, index + 1, newStyle);
          console.log('heading open result', result, newStyle)
          elems.push(<AutoLayout direction="horizontal" width="fill-parent" wrap>{result.element}</AutoLayout>);
          index = result.newIndex;
          break;
        }
        case 'paragraph_open': {
          const result = this.tokenToTree(tokens, index + 1, style);
          elems.push(<AutoLayout direction="horizontal" width="fill-parent" wrap spacing={3}>{result.element}</AutoLayout>);
          index = result.newIndex;
          break;
        }
        case 'inline': {
          const { element } = MarkdownParser.inlineTokenToTree(token.children, 0, style);
          elems.push(element);
          index++;
          break;
        }
        default: {
          if (token.type.endsWith("_close")) {
            return { element: elems, newIndex: index + 1 };
          } else if (token.type.endsWith("_open")) {
            const componentType = token.tag;
            const result = this.tokenToTree(tokens, index + 1, style);
            elems.push(MarkdownParser.renderBlockComponent(componentType, index, result.element, token, style));
            index = result.newIndex;
            break;
          } else {
            elems.push(MarkdownParser.renderBlockComponent(token.type, index, [], token, undefined, style));
            index++;
          }
        }
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
            elems.push(<Text key={index} {...getTextStyle(style, style.href)}>{token.content}</Text>);
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
