const { widget } = figma;
const { AutoLayout, Span, Text, SVG } = widget;
import { getTextStyle } from "../utils/styles";

import { CheckIcon, UnCheckIcon, Dot } from "../components/icons";
import { StyledBlock } from "../types/block";
import { TextSegment } from "../types/text";
import { CONTAINER_SIZE, MD_CONST } from "../constants/markdown";

export class ListRenderer {
  static renderList(block: StyledBlock, index: number) {
    return (
      <AutoLayout
        key={index}
        direction="vertical"
        width="fill-parent"
        spacing={6}
        padding={{ top: block.level !== 0 ? 0 : 12, bottom: 12, left: block.level * 16 }}
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
              <Text fill={MD_CONST.COLOR.BLACK} width={18}>
                {itemIndex + 1}.
              </Text>
            ) : item.checkable ? (
              <SVG src={item.checked ? CheckIcon : UnCheckIcon} />
            ) : (
              <SVG src={Dot} />
            )}
            <Text width="fill-parent">
              {item.segments?.map((segment, segIndex) => (
                <Span
                  key={segIndex}
                  {...getTextStyle(segment.style, segment.href)}
                >
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
