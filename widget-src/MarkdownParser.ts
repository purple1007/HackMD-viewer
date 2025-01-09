// 在字體常數定義
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
}

/// Markdown 解析器
export class MarkdownParser {
  static parseInline(text: string) {
    const segments: Array<{
      text: string;
      style?: { bold?: boolean; italic?: boolean; code?: boolean; highlight?: boolean };
    }> = [];
  
    let currentText = '';
    let inBold = false;
    let inItalic = false;
    let inCode = false;
    let inHighlight = false;
    let i = 0;
  
    while (i < text.length) {
      // 偵測程式碼符號 `
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
  
      // 偵測 ==...==
      if (text.startsWith('==', i)) {
        // 先將前面累積文字丟進 segments（屬於之前的 inHighlight 狀態）
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
  
      // 偵測 **...**
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
  
      // 偵測 *...*
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
  
      // 若以上檢測都不符合，累積字元
      currentText += text[i];
      i++;
    }
  
    // 迴圈結束後，如果還有累積文字，加入 segments
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
      blocks.push(currentBlock)
    }

    return blocks
  }
}
