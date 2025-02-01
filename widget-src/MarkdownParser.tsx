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

interface TextSegment {
  text: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    highlight?: boolean;
    strikethrough?: boolean;
    checkedBox?: boolean;
  };
}

interface StyledBlock {
  segments?: TextSegment[];
  type: string;
  content: string;
  level?: number;
  style?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
  };
}

export class MarkdownParser {
  static parseInline(text: string) {
    const segments: TextSegment[] = []
    let currentText = ''
    let inBold = false
    let inItalic = false
    let inCode = false
    let inHighlight = false
    let inStrikethrough = false
    let inCheckedBox = false
    let i = 0

    // code inline `文字`
    while (i < text.length) {
      if (text[i] === '`' && !inBold && !inItalic) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/[`*]/g, ''),
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough, checkedBox: inCheckedBox },
          });
          currentText = '';
        }
        inCode = !inCode;
        i++;
        continue;
      }

      // 高亮 ==文字==
      if (text.startsWith('==', i)) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/==/g, ''),
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough, checkedBox: inCheckedBox },
          });
          currentText = '';
        }
        inHighlight = !inHighlight;
        i += 2;
        continue;
      }

      // 粗體 **文字**
      if (text.startsWith('**', i) && !inCode) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/[`*]/g, ''),
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough, checkedBox: inCheckedBox },
          });
          currentText = '';
        }
        inBold = !inBold;
        i += 2;
        continue;
      }

      // 刪除線 ~~文字~~
      if (text.startsWith('~~', i) && !inCode) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/[`~]/g, ''),
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough, checkedBox: inCheckedBox },
          });
          currentText = '';
        }
        inStrikethrough = !inStrikethrough;
        i += 2;
        continue;
      }
      
      // 處理 • [ ] 顯示為 □
      if (text.startsWith('[ ]', i) && !inCode) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/[`*]/g, ''),
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough, checkedBox: inCheckedBox },
          });
          currentText = '';
        }
        segments.push({
          text: '□',
          style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough },
        });
        inCheckedBox = !inCheckedBox;
        i += 5; // 跳過 '• [ ]'
        continue;
      }
      

      // 斜體 *文字*
      if (text[i] === '*' && !text.startsWith('**', i) && !inCode) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/[`*]/g, ''),
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough, checkedBox: inCheckedBox }
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
        style: { bold: inBold, italic: inItalic, code: inCode, highlight: inHighlight, strikethrough: inStrikethrough, checkedBox: inCheckedBox },
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
        const segments = this.parseInline(listMatch[1]);
        if (currentBlock?.type !== 'list') {
          if (currentBlock) blocks.push(currentBlock)
          currentBlock = {
            type: 'list',
            content: this.cleanMarkdown(listMatch[1]), 
            segments: segments
          }
        } else {
           // 如果已經是列表項，附加新的 segments
          currentBlock.segments = [
            ...(currentBlock.segments || []),
            ...segments
          ];
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

  static getTextStyle = (
    style?: 
      { bold?: boolean; 
        highlight?: boolean; 
        italic?: Boolean; 
        strikethrough?: Boolean 
      }) => {
    return {
      fontWeight: style?.bold ? 'bold' : 'normal' as 'bold' | 'normal',
      fill: style?.highlight ? "#DFA424" : "#232323",
      italic: style?.italic ? true : false,
      textDecoration: style?.strikethrough ? "strikethrough" as 'none' | 'strikethrough' | 'underline' : "none" as 'none' | 'strikethrough' | 'underline',
      fontSize: MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE
    }
  }

  // Figma 上的渲染樣式
  static renderBlock(block: StyledBlock, index: number) {
    // 列表
    if (block.type === 'list') {
      const lines = block.content.split('\n');
      const formattedContent = lines.map(line => `• ${line}`).join('\n');
      
      return (
        <Text 
          key={index}
          width={CONTAINER_SIZE.WIDTH-CONTAINER_SIZE.PADDING*2}
          fontSize={MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE}
          lineHeight={28}
        >
          {block.segments ? (
            block.segments.map((segment, segIndex) => (
              <Span 
                key={`${index}-${segIndex}`}
                {...MarkdownParser.getTextStyle(segment.style)}
              >
                {`• ${segment.text}${segIndex < block.segments!.length - 1 ? '\n' : ''}`}
              </Span>
            ))
          ) : (
            formattedContent
          )}
        </Text>
      );
    }
    return (
      <Text 
        key={index}
        width={CONTAINER_SIZE.WIDTH-CONTAINER_SIZE.PADDING*2}
        fill={"#232323"}
        fontSize={
          block.type === 'heading' 
          ? MARKDOWN_CONSTANTS.HEADING_SIZES[block.level as keyof typeof MARKDOWN_CONSTANTS.HEADING_SIZES] 
          : MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE
        }
        fontWeight={block.type === 'heading' ? 'extra-bold' : 'normal'}
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
              {...MarkdownParser.getTextStyle(segment.style)}
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