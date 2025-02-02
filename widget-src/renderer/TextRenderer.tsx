const { widget } = figma
const { AutoLayout, Span, Text, SVG } = widget

import { TextSegment } from '../types/text';
import { MARKDOWN_CONSTANTS } from '../constants/markdown';

export class TextRenderer {
  static render(segments: TextSegment[]) {
    return (
      <Text fill="#232323" fontSize={MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE}>
        {segments.map((segment, index) => (
          <Span
            key={index}
            fontWeight={segment.style?.bold ? 'bold' : 'normal'}
            fill={segment.style?.href ? "#0066CC" : segment.style?.highlight ? "#DFA424" : "#232323"}
            italic={segment.style?.italic}
            textDecoration={segment.style?.href ? "underline" : segment.style?.strikethrough ? "strikethrough" : "none"}
          >
            {segment.text}
          </Span>
        ))}
      </Text>
    );
  }
}