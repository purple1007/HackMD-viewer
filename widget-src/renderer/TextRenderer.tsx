const { widget } = figma
const { AutoLayout, Span, Text, SVG } = widget

import { TextSegment } from '../types/text';
import { MD_CONST } from '../constants/markdown';

export class TextRenderer {
  static render(segments: TextSegment[]) {
    return (
      {segments.map((segment, index) => (
        <Text 
          key={index}
          fill={MD_CONST.COLOR.BLACK} 
          fontSize={MD_CONST.FONT_SIZE}
          width="hug-content"
        >
          <Span {...getTextStyle(segment.style, segment.href)}>
            {segment.text}
          </Span>
        </Text>
      ))}
    );
  }
}