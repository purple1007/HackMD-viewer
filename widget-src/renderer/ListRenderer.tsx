const { widget } = figma
const { AutoLayout, Span, Text, SVG } = widget
import { getTextStyle } from '../utils/styles';

import { CheckIcon, UnCheckIcon, Dot } from '../components/icons';
import { StyledBlock } from '../types/block';
import { TextSegment } from '../types/text';
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
                <Span key={segIndex} 
                  {...getTextStyle(segment.style , segment.href)} >
                  {segment.text}
                </Span>
              ))}
            </Text>
          </AutoLayout>
        ))}
      </AutoLayout>
    );
  }
}