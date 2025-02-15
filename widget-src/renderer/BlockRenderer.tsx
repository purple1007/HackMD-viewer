const { widget } = figma
const { AutoLayout, Span, Text } = widget

import { StyledBlock } from '../types/block';
import { getTextStyle } from '../utils/styles';
import { MD_CONST, CONTAINER_SIZE } from '../constants/markdown';
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
      <AutoLayout key={index} width="fill-parent" direction="vertical">
        <Text
          width="fill-parent"
          fill={MD_CONST.COLOR.BLACK}
          fontSize={
            block.type === 'heading'
              ? MD_CONST.HEADING_SIZES[block.level as keyof typeof MD_CONST.HEADING_SIZES]
              : MD_CONST.FONT_SIZE
          }
          fontWeight={block.type === 'heading' ? 'extra-bold' : 'normal'}
          lineHeight={
            block.type === 'heading'
              ? MD_CONST.HEADING_SIZES[block.level as keyof typeof MD_CONST.HEADING_SIZES] * 1.6
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
      </AutoLayout>
    );
  }
}