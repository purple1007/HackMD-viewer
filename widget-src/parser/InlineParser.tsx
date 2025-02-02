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
    let i = 0;

    while (i < text.length) {
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

    if (currentText) {
      segments.push({
        text: InlineParser.cleanMarkdown(currentText), // 改用 InlineParser.cleanMarkdown
        style: { bold: inBold, italic: inItalic, code: inCode, highlight: inHighlight, strikethrough: inStrikethrough },
      });
    }

    return segments;
  }
}