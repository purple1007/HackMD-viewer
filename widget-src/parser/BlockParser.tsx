import { StyledBlock } from "../types/block";
import { InlineParser } from "./InlineParser";

export class BlockParser {

  // 新增計算縮排層級的輔助函數
  static getIndentationLevel(line: string): number {
    const spaces = line.match(/^\s*/)?.[0].length || 0;
    return Math.floor(spaces / 4); // 每 4 個空格算一層縮排
  }

  static parseBlock(markdown: string): StyledBlock[] {
    const blocks: StyledBlock[] = [];
    const lines = markdown.split("\n");

    let currentBlock: StyledBlock | null = null;

    for (const line of lines) {
      // 標題
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          type: "heading",
          content: InlineParser.cleanMarkdown(headingMatch[2]),
          level: headingMatch[1].length,
        };
        continue;
      }
      // 圖片
      const imageMatch = line.match(
        /^!\[(.*?)\]\((.*?)(?:\s*=\s*(\d+%?x?))?\)$/
      );
      if (imageMatch) {
        if (currentBlock) blocks.push(currentBlock);
        let width = imageMatch[3] || "fill-parent";
        width = width.replace("x", ""); // 刪除寬度中的 'x'
        let widthNumber: number | string = width.includes("%")
          ? parseFloat(width)
          : parseInt(width, 10);
        currentBlock = {
          type: "image",
          src: imageMatch[2], // 圖片 URL
          alt: imageMatch[1], // 圖片替代文字
          width: widthNumber || "fill-parent", // 圖片寬度
        };
        blocks.push(currentBlock);
        currentBlock = null;
        continue;
      }

      // 列表處理
      const orderedListRegex = /^(\s*)(\d+)\.\s+(.+)/;
      const uncheckedRegex = /^(\s*)[-*]\s*\[\s\]\s*(.+)$/;
      const checkedRegex = /^(\s*)[-*]\s*\[x\]\s*(.+)$/i;
      const listRegex = /^(\s*)[-*]\s+(.+)/;

      const orderedListMatch = line.match(orderedListRegex);
      const uncheckedMatch = line.match(uncheckedRegex);
      const checkedMatch = line.match(checkedRegex);
      const listMatch = line.match(listRegex);

      if (uncheckedMatch || checkedMatch || listMatch || orderedListMatch) {
        const match =
          orderedListMatch || checkedMatch || uncheckedMatch || listMatch;
        if (!match) continue;

        const indentSpaces = match[1] || '';
        const indentLevel = BlockParser.getIndentationLevel(line);
        
        // 取得內容
        let content;
        if (orderedListMatch) {
          content = orderedListMatch[3];
        } else if (checkedMatch) {
          content = checkedMatch[2];
        } else if (uncheckedMatch) {
          content = uncheckedMatch[2];
        } else if (listMatch) {
          content = listMatch[2];
        }

        const segments = InlineParser.parseInline(content);

        const listItem = {
          content: InlineParser.cleanMarkdown(content),
          segments,
          checkable: Boolean(checkedMatch || uncheckedMatch),
          checked: Boolean(checkedMatch),
          ordered: Boolean(orderedListMatch),
          number: orderedListMatch ? parseInt(orderedListMatch[2]) : undefined,
          level: indentLevel, // 新增縮排層級
        };

        if (!currentBlock || currentBlock.type !== "list" || 
          (currentBlock.type === "list" && currentBlock.level !== indentLevel)) {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            type: "list",
            content: "",
            items: [listItem],
            level: indentLevel, // 新增縮排層級
          };
        } else {
          currentBlock.items?.push(listItem);
        }
        continue;
      }

      // 段落
      if (line.trim()) {
        const segments = InlineParser.parseInline(line);
        // 每行都建立新的段落區塊
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          type: "paragraph",
          content: InlineParser.cleanMarkdown(line),
          segments,
        };
        continue;
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }
}
