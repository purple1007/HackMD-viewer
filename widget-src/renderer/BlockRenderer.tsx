const { widget } = figma
const { AutoLayout, Span, Text } = widget

import { StyledBlock } from '../types/block';
import { getTextStyle } from '../utils/styles';
import { MARKDOWN_CONSTANTS, CONTAINER_SIZE } from '../constants/markdown';
import { ListRenderer } from './ListRenderer';

export class BlockRenderer {
  static renderBlock(block: StyledBlock, index: number) {
    if (block.type === 'list') {
      return ListRenderer.renderList(block, index);
    }

    return this.renderText(block, index);
  }

  private static renderText(block: StyledBlock, index: number) {
    return (
      <Text
        key={index}
        width={CONTAINER_SIZE.WIDTH - CONTAINER_SIZE.PADDING * 2}
        fill="#232323"
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
              {...getTextStyle(segment.style , segment.href)}
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