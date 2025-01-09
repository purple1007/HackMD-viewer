/// <reference types="@figma/widget-typings" />
const { widget } = figma
const { Span, Text } = widget

export const MARKDOWN_CONSTANTS = {
  HEADING_SIZES: {
    1: 32,
    2: 24,
    3: 18,
    4: 16,
    5: 14,
    6: 12
  },
  REGULAR_FONT_SIZE: 16,
} as const;
export const CONTAINER_SIZE = {
  WIDTH: 600,
  PADDING: 16,
}

interface Block {
  type: string;
  content: string;
  level?: number;
}
interface TextSegment {
  text: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    highlight?: boolean;
  };
}

interface StyledBlock extends Block {
  segments?: TextSegment[];
  style?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
  };
}

export class MarkdownParser {
  static parseInline(text: string) {
    const segments: Array<{ text: string; style?: { bold?: boolean; italic?: boolean; code?: boolean; highlight?: boolean } }> = []
    let currentText = ''
    let inBold = false
    let inItalic = false
    let inCode = false
    let inHighlight = false
    let i = 0

    while (i < text.length) {
      if (text[i] === '`' && !inBold && !inItalic) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/[`*]/g, ''),
            style: { bold: inBold, italic: inItalic, highlight: inHighlight },
          });
          currentText = '';
        }
        inCode = !inCode;
        i++;
        continue;
      }

      if (text.startsWith('==', i)) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/==/g, ''),
            style: { bold: inBold, italic: inItalic, code: inCode, highlight: inHighlight },
          });
          currentText = '';
        }
        inHighlight = !inHighlight;
        i += 2;
        continue;
      }

      if (text.startsWith('**', i) && !inCode) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/[`*]/g, ''),
            style: { bold: inBold, italic: inItalic, highlight: inHighlight },
          });
          currentText = '';
        }
        inBold = !inBold;
        i += 2;
        continue;
      }

      if (text[i] === '*' && !text.startsWith('**', i) && !inCode) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/[`*]/g, ''),
            style: { bold: inBold, italic: inItalic, highlight: inHighlight },
          });
          currentText = '';
        }
        inItalic = !inItalic;
        i++;
        continue;
      }

      currentText += text[i];
      i++;
    }

    if (currentText) {
      segments.push({
        text: currentText.replace(/==/g, '').replace(/[`*]/g, ''),
        style: { bold: inBold, italic: inItalic, code: inCode, highlight: inHighlight },
      });
    }

    return segments;
  }

  static cleanMarkdown(text: string): string {
    return text.replace(/[`*]/g, '').trim();
  }

  static parseBlock(markdown: string) {
    const blocks: StyledBlock[] = [];
    const lines = markdown.split('\n')
    
    let currentBlock: StyledBlock | null = null;
    
    for (const line of lines) {
      
      // 標題
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
      if (headingMatch) {
        if (currentBlock) blocks.push(currentBlock)
        currentBlock = {
          type: 'heading',
          content: this.cleanMarkdown(headingMatch[2]), 
          level: headingMatch[1].length
        }
        continue
      }

      // 列表項
      const listMatch = line.match(/^[-*]\s+(.+)/)
      if (listMatch) {
        if (currentBlock?.type !== 'list') {
          if (currentBlock) blocks.push(currentBlock)
          currentBlock = {
            type: 'list',
            content: this.cleanMarkdown(listMatch[1]) 
          }
        } else {
          currentBlock.content += '\n' + listMatch[1]
        }
        continue
      }

      // 程式碼區塊
      // 這裡簡化處理，只考慮單行程式碼
      const codeMatch = line.match(/^```(.+)/)
      if (codeMatch) {
        if (currentBlock) blocks.push(currentBlock)
        currentBlock = {
          type: 'code',
          content: codeMatch[1]
        }
        continue
      }
      
      // 段落
      if (line.trim()) {
        const segments = this.parseInline(line);
        if (currentBlock?.type !== 'paragraph') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            type: 'paragraph',
            content: this.cleanMarkdown(line),
            segments: segments
          };
        } else {
          // 如果已經是段落，則附加新行並清理符號
          currentBlock.segments = [
            ...(currentBlock.segments || []),
            ...segments
          ];
          currentBlock.content += ' ' + this.cleanMarkdown(line);
        }
        continue;
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  static renderBlock(block: StyledBlock, index: number) {
    return (
      <Text 
        key={index}
        width={CONTAINER_SIZE.WIDTH-CONTAINER_SIZE.PADDING*2}
        fontSize={
          block.type === 'heading' 
          ? MARKDOWN_CONSTANTS.HEADING_SIZES[block.level as keyof typeof MARKDOWN_CONSTANTS.HEADING_SIZES] 
          : MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE
        }
        fontWeight={block.type === 'heading' ? 'extra-bold' : 'normal'}
        horizontalAlignText="left"
        lineHeight={
          block.type === 'heading' 
          ? MARKDOWN_CONSTANTS.HEADING_SIZES[block.level as keyof typeof MARKDOWN_CONSTANTS.HEADING_SIZES] * 1.6
          : 28
        }
      >
        {block.segments ? (
          block.segments.map((segment, segIndex) => (
            <Span 
              key={`${index}-${segIndex}`}
              fontWeight={segment.style?.bold ? 'bold' : 'normal'}
              fill={segment.style?.highlight ? "#FF0000" : "#000000"}
              fontSize={segment.style?.highlight ? 40 : 16}
            >
              {segment.text}
            </Span>
          ))
        ) : (
          block.content
        )}
      </Text>
    );
  }
}