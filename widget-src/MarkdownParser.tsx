const { widget } = figma
const { AutoLayout, Span, Text, SVG } = widget
import { CheckIcon, UnCheckIcon, Dot } from './components/icons'


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
  };
}

interface StyledBlock {
  segments?: TextSegment[];
  type: string;
  content: string;
  level?: number;
  items?: {
    content: string;
    checked?: boolean;
    segments: TextSegment[];
    checkable?: boolean;
  }[];
  style?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
  };
}

export class MarkdownParser {


  static parseInline(text: string) {
    const segments: TextSegment[] = [];

    let currentText = ''
    let inBold = false
    let inItalic = false
    let inCode = false
    let inHighlight = false
    let inStrikethrough = false
    let i = 0
    
    while (i < text.length) {

      // code inline `文字`
      if (text[i] === '`' && !inBold && !inItalic) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/[`*]/g, ''),
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough },
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
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough },
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
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough },
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
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough},
          });
          currentText = '';
        }
        inStrikethrough = !inStrikethrough;
        i += 2;
        continue;
      }
    
      // 斜體 *文字*
      if (text[i] === '*' && !text.startsWith('**', i) && !inCode) {
        if (currentText) {
          segments.push({
            text: currentText.replace(/[`*]/g, ''),
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough }
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
        style: { bold: inBold, italic: inItalic, code: inCode, highlight: inHighlight, strikethrough: inStrikethrough },
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

      // 列表項處理
      const uncheckedRegex = /^(?:[*-]\s*)?\[\s\]\s*(.*)$/
      const checkedRegex = /^(?:[*-]\s*)?\[x\]\s*(.*)$/i
      const listRegex = /^[-*]\s+(.+)/
      
      const uncheckedMatch = line.match(uncheckedRegex)
      const checkedMatch = line.match(checkedRegex)
      const listMatch = line.match(listRegex)

      // 統一處理所有列表類型
      if (uncheckedMatch || checkedMatch || listMatch) {
        const match = checkedMatch || uncheckedMatch || listMatch
        if (!match) continue;
        const content = match[1]
        const segments = this.parseInline(content)
        
        const listItem = {
          content: this.cleanMarkdown(content),
          checkable: Boolean(checkedMatch || uncheckedMatch),
          checked: Boolean(checkedMatch),
          segments
        }

        if (currentBlock?.type !== 'list') {
          if (currentBlock) blocks.push(currentBlock)
          currentBlock = {
            type: 'list',
            content: '',
            items: [listItem]
          }
        } else {
          currentBlock.items?.push(listItem)
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
        strikethrough?: Boolean;
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
      return (
        <AutoLayout
          key={index}
          direction="vertical"
          width={CONTAINER_SIZE.WIDTH - CONTAINER_SIZE.PADDING * 2}
          spacing={8}
        >
          {block.items?.map((item, itemIndex) => (
            <AutoLayout 
              key={itemIndex}
              direction="horizontal" 
              spacing={3} 
              verticalAlignItems="center" 
              width="fill-parent"
            >
               {item.checkable ?  <SVG src={item.checked ? CheckIcon : UnCheckIcon} /> : <SVG src={Dot} />}
              <Text width="fill-parent">
                {item.segments?.map((segment, segIndex) => (
                  <Span key={segIndex} {...MarkdownParser.getTextStyle(segment.style)}>
                    {segment.text}
                  </Span>
                ))}
              </Text>
            </AutoLayout>
          ))}
        </AutoLayout>
      )
    }
    return (
      <Text
        key={index}
        width={CONTAINER_SIZE.WIDTH - CONTAINER_SIZE.PADDING * 2}
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