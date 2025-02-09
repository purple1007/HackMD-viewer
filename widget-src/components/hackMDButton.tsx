const { widget } = figma;
const { AutoLayout, Text, Frame, SVG } = widget;
import { LinkIcon, LogoIcon, LogoWordMark } from './icons';

interface HackMDButtonProps {
  onSuccess: (url: string, noteId: string) => Promise<void>;
}

export const HackMDButton = ({ onSuccess }: HackMDButtonProps) => {
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
        <Text
          name="Past your hackmd note into Figma"
          fill="#747474"
          width="fill-parent"
          fontFamily="Inter"
          fontSize={18}
          fontWeight={500}
        >
          Paste your HackMD note into Figma
        </Text>
      </AutoLayout>

      <AutoLayout
        name="Frame 4"
        fill="#564DFF"
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
      >
        <Text
          name="Get started"
          fill="#FFF"
          fontFamily="Inter"
          fontSize={20}
          fontWeight={500}
          onClick={() => {
            return new Promise((resolve) => {
              figma.showUI(__html__, { 
                width: 280, 
                height: 200, 
                title: "HackMD URL setting" 
              });
              figma.ui.onmessage = async (msg) => {
                if (msg.type === 'url' && msg.value) {
                  await onSuccess(msg.value, msg.noteId);
                  resolve();
                }
              };
            });
          }}
        >
          Get started
        </Text>
      </AutoLayout>
    </AutoLayout>
  );
};