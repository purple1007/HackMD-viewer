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

     // 列表處理
     const orderedListRegex = /^(\d+)\.\s+(.+)/;
     const uncheckedRegex = /^(?:[*-]\s*)?\[\s\]\s*(.*)$/;
     const checkedRegex = /^(?:[*-]\s*)?\[x\]\s*(.*)$/i;
     const listRegex = /^[-*]\s+(.+)/;

     const orderedListMatch = line.match(orderedListRegex);
     const uncheckedMatch = line.match(uncheckedRegex);
     const checkedMatch = line.match(checkedRegex);
     const listMatch = line.match(listRegex);

     if (uncheckedMatch || checkedMatch || listMatch || orderedListMatch) {
       const match = orderedListMatch || checkedMatch || uncheckedMatch || listMatch;
       if (!match) continue;

       const content = orderedListMatch ? match[2] : match[1];
       const segments = InlineParser.parseInline(content);

       const listItem = {
         content: InlineParser.cleanMarkdown(content),
         segments,
         checkable: Boolean(checkedMatch || uncheckedMatch),
         checked: Boolean(checkedMatch),
         ordered: Boolean(orderedListMatch),
         number: orderedListMatch ? parseInt(match[1]) : undefined
       };

       if (!currentBlock || currentBlock.type !== 'list') {
         if (currentBlock) blocks.push(currentBlock);
         currentBlock = {
           type: 'list',
           content: '',
           items: [listItem]
         };
       } else {
         currentBlock.items?.push(listItem);
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