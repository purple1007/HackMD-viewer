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
              {...getTextStyle(segment.style , segment.href)}  
          >
            {segment.text}
          </Span>
        ))}
      </Text>
    );
  }
}