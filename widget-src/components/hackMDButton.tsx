const { widget } = figma;
const { AutoLayout, Text, Frame, SVG } = widget;
import { LinkIcon, LogoIcon, LogoWordMark } from "./icons";

import { MD_CONST } from "../constants/markdown";

interface HackMDButtonProps {
  onClick: () => Promise<void>;
}

export const HackMDButton = ({ onClick }: HackMDButtonProps) => {
  return (
    <AutoLayout
      name="Frame7"
      fill="#FFF"
      stroke="#C7C7C7"
      cornerRadius={8}
      overflow="visible"
      direction="vertical"
      spacing={6}
      padding={{ vertical: 20, horizontal: 16 }}
      width={325}
    >
      <Frame name="HackMD Logo" width={114} height={24}>
        <Frame
          name="HackMD Logo / Icon / Primary"
          x={{
            type: "horizontal-scale",
            leftOffsetPercent: 0,
            rightOffsetPercent: 77.43,
          }}
          y={{
            type: "vertical-scale",
            topOffsetPercent: 0,
            bottomOffsetPercent: 0,
          }}
          width={25.73}
          height={24}
        >
          <SVG
            name="Vector"
            x={{
              type: "horizontal-scale",
              leftOffsetPercent: 0,
              rightOffsetPercent: 0,
            }}
            y={{
              type: "vertical-scale",
              topOffsetPercent: 0,
              bottomOffsetPercent: 0.598,
            }}
            height={24}
            width={26}
            src={LogoIcon}
          />
        </Frame>
        <Frame
          name="HackMD Logo / Wordmark"
          x={{
            type: "horizontal-scale",
            leftOffsetPercent: 27.395,
            rightOffsetPercent: 0.84,
          }}
          y={{
            type: "vertical-scale",
            topOffsetPercent: 15.789,
            bottomOffsetPercent: 21.02,
          }}
          overflow="visible"
          width={81.813}
          height={15.166}
        >
          <SVG
            name="HackMD"
            x={{
              type: "horizontal-scale",
              leftOffsetPercent: 0,
              rightOffsetPercent: 0.013,
            }}
            y={{
              type: "vertical-scale",
              topOffsetPercent: 0,
              bottomOffsetPercent: 0.019,
            }}
            height={15}
            width={82}
            src={LogoWordMark}
          />
        </Frame>
      </Frame>

      <AutoLayout
        name="Frame 8"
        overflow="visible"
        spacing={10}
        padding={{
          top: 0,
          right: 0,
          bottom: 16,
          left: 0,
        }}
        width="fill-parent"
        horizontalAlignItems="center"
        verticalAlignItems="center"
      >
        <AutoLayout direction="vertical" spacing={4} width="fill-parent">
          <Text
            name="Title"
            fill="#747474"
            width="fill-parent"
            fontFamily="Inter"
            fontSize={18}
            fontWeight={500}
          >
            View a HackMD note in Figma
          </Text>
          <Text
            name="Private note hint"
            fill={MD_CONST.COLOR.GRAY}
            width="fill-parent"
            fontFamily="Inter"
            fontSize={12}
            lineHeight={18}
          >
            Public notes load right away. For private or team notes, add an API
            token from the toolbar.
          </Text>
        </AutoLayout>
      </AutoLayout>

      <AutoLayout
        name="Button"
        fill={MD_CONST.COLOR.PRIMARY}
        hoverStyle={{
          fill: "#625aff",
        }}
        cornerRadius={8}
        overflow="visible"
        spacing={5}
        padding={{
          vertical: 8,
          horizontal: 12,
        }}
        width="fill-parent"
        horizontalAlignItems="center"
        verticalAlignItems="center"
        onClick={onClick}
      >
        <Text
          name="Get started"
          fill="#FFF"
          fontFamily="Inter"
          fontSize={20}
          fontWeight={500}
        >
          Get started
        </Text>
      </AutoLayout>
    </AutoLayout>
  );
};
