const { widget } = figma
const { AutoLayout, Span, Text, SVG } = widget

import { CheckIcon, UnCheckIcon, Dot } from '../components/icons';
import { StyledBlock } from '../types/block';
import { CONTAINER_SIZE } from '../constants/markdown';

export class ListRenderer {
  static renderList(block: StyledBlock, index: number) {
    return (
      <AutoLayout
        key={index}
        direction="vertical"
        width={CONTAINER_SIZE.WIDTH - CONTAINER_SIZE.PADDING * 2}
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
            {item.ordered ? (
              <Text fill="#232323" width={18}>{itemIndex + 1}.</Text>
            ) : (
              item.checkable ? 
                <SVG src={item.checked ? CheckIcon : UnCheckIcon} /> : 
                <SVG src={Dot} />
            )}
            <Text width="fill-parent">
              {item.segments?.map((segment, segIndex) => (
                <Span key={segIndex} {...this.getTextStyle(segment.style)}>
                  {segment.text}
                </Span>
              ))}
            </Text>
          </AutoLayout>
        ))}
      </AutoLayout>
    );
  }

  static getTextStyle(style?: { bold?: boolean; italic?: boolean; href?: string; strikethrough?: boolean }) {
    return {
      fontWeight: style?.bold ? 'bold' : 'normal' as 'bold' | 'normal',
      fill: style?.href ? "#0066CC" : "#232323",
      italic: style?.italic ? true : false,
      textDecoration: style?.href ? "underline" : style?.strikethrough ? "strikethrough" as 'none' | 'strikethrough' | 'underline' : "none" as 'none' | 'strikethrough' | 'underline',
    };
  }
}