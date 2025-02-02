import { TextSegment } from '../types/text';

export class InlineParser {
  static cleanMarkdown(text: string): string {
    return text.replace(/[`*]/g, '').trim();
  }

  static parseInline(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    let currentText = '';
    let inBold = false;
    let inItalic = false;
    let inCode = false;
    let inHighlight = false;
    let inStrikethrough = false;
    let inUrl = false;
    let urlText = '';
    let url = '';
    let i = 0;

    while (i < text.length) {

      // URL 解析邏輯 - 開始標記
      if (text[i] === '[' && !inCode && !inBold && !inItalic && !inHighlight && !inStrikethrough) {
        if (currentText.trim()) {  // 只有當有實際文字時才加入 segment
          segments.push({
            text: currentText,
            style: { 
              bold: inBold, 
              italic: inItalic, 
              highlight: inHighlight, 
              strikethrough: inStrikethrough 
            }
          });
        }
        currentText = '';
        inUrl = true;
        i++;
        continue;
      }

      // URL 解析邏輯 - 處理結束
      if (text[i] === ']' && inUrl) {
        urlText = currentText;
        currentText = '';
        i++;
        
        // 檢查 URL 部分
        if (text[i] === '(' && i < text.length) {
          i++; // 跳過 '('
          while (i < text.length && text[i] !== ')') {
            url += text[i];
            i++;
          }
          if (text[i] === ')' && urlText.trim()) {  // 確保 urlText 不為空
            segments.push({
              text: urlText,
              href: url,
              style: { 
                bold: inBold, 
                italic: inItalic, 
                highlight: inHighlight, 
                strikethrough: inStrikethrough,
              }
            });
            inUrl = false;
            urlText = '';
            url = '';
            i++;
            continue;
          }
        }
      }

      // code inline `文字`
      if (text[i] === '`' && !inBold && !inItalic) {
        if (currentText) {
          segments.push({
            text: currentText,
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough },
          });
          currentText = '';
        }
        inCode = !inCode;
        i++;
        continue;
      }
      // highlight inline ==文字==
      if (text.startsWith('==', i)) {
        if (currentText) {
          segments.push({
            text: currentText,
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough },
          });
          currentText = '';
        }
        inHighlight = !inHighlight;
        i += 2;
        continue;
      }

      // bold inline **文字**
      if (text.startsWith('**', i) && !inCode) {
        if (currentText) {
          segments.push({
            text: currentText,
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough },
          });
          currentText = '';
        }
        inBold = !inBold;
        i += 2;
        continue;
      }

      if (text.startsWith('~~', i) && !inCode) {
        if (currentText) {
          segments.push({
            text: currentText,
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough },
          });
          currentText = '';
        }
        inStrikethrough = !inStrikethrough;
        i += 2;
        continue;
      }

      // italic inline *文字*
      if (text[i] === '*' && !text.startsWith('**', i) && !inCode) {
        if (currentText) {
          segments.push({
            text: currentText,
            style: { bold: inBold, italic: inItalic, highlight: inHighlight, strikethrough: inStrikethrough },
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

    if (currentText.trim()) {
      segments.push({
        text: currentText,
        style: { 
          bold: inBold, 
          italic: inItalic, 
          highlight: inHighlight, 
          strikethrough: inStrikethrough 
        }
      });
    }

    return segments;
  }
}