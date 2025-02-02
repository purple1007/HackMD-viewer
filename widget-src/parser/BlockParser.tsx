import { StyledBlock } from '../types/block';
import { InlineParser } from './InlineParser';

export class BlockParser {
  static parseBlock(markdown: string): StyledBlock[] {
    const blocks: StyledBlock[] = [];
    const lines = markdown.split('\n');
    
    let currentBlock: StyledBlock | null = null;

    for (const line of lines) {
      // 標題
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          type: 'heading',
          content: InlineParser.cleanMarkdown(headingMatch[2]),
          level: headingMatch[1].length,
        };
        continue;
      }

      // 列表項處理
      const listMatch = line.match(/^[-*]\s+(.+)/);
      if (listMatch) {
        const segments = InlineParser.parseInline(listMatch[1]);
        if (!currentBlock || currentBlock.type !== 'list') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            type: 'list',
            content: '',
            items: [{ content: listMatch[1], segments }],
          };
        } else {
          currentBlock.items?.push({ content: listMatch[1], segments });
        }
        continue;
      }

      // 段落
      if (line.trim()) {
        const segments = InlineParser.parseInline(line);
        if (!currentBlock || currentBlock.type !== 'paragraph') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            type: 'paragraph',
            content: InlineParser.cleanMarkdown(line),
            segments,
          };
        } else {
          currentBlock.segments?.push(...segments);
          currentBlock.content += ' ' + InlineParser.cleanMarkdown(line);
        }
        continue;
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }
}