const { widget } = figma
const { AutoLayout, Span, Text } = widget

import { StyledBlock } from '../types/block';
import { getTextStyle } from '../utils/styles';


export class BlockRenderer {
  static renderBlock(block: StyledBlock, index: number) {
    if (block.type === 'list') {
      return this.renderList(block, index);
    }

    return this.renderText(block, index);
  }

  private static renderList(block: StyledBlock, index: number) {
    return (
      <AutoLayout
        key={index}
        direction="vertical"
        spacing={12}
        padding={{ top: 12, bottom: 12 }}
      >
        {block.items?.map((item, itemIndex) => (
          <AutoLayout
            key={itemIndex}
            direction="horizontal"
            spacing={3}
            verticalAlignItems="center"
            width="fill-parent"
            padding={{ left: 6 }}
          >
            <Text fill="#232323" width={18}>
              {item.ordered ? `${itemIndex + 1}.` : ''}
            </Text>
            <Text width="fill-parent">
              {item.segments?.map((segment, segIndex) => (
                <Span key={segIndex} {...getTextStyle(segment.style)}>
                  {segment.text}
                </Span>
              ))}
            </Text>
          </AutoLayout>
        ))}
      </AutoLayout>
    );
  }

  private static renderText(block: StyledBlock, index: number) {
    return (
      <Text
        key={index}
        fill="#232323"
        fontSize={block.level ? 24 - block.level * 2 : 16}
        fontWeight={block.type === 'heading' ? 'bold' : 'normal'}
      >
        {block.segments?.map((segment, segIndex) => (
          <Span key={`${index}-${segIndex}`} {...getTextStyle(segment.style)}>
            {segment.text}
          </Span>
        ))}
      </Text>
    );
  }
}