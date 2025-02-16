
const { widget } = figma;
const { AutoLayout, Text, Frame, SVG, Line } = widget;

import { MD_CONST } from '../constants/markdown';
import { LinkIcon, LogoIconWhite, LogoWordMarkWhite } from './icons';

interface ContentLayoutProps {
  children: React.ReactNode;
  lastSyncTime?: string;
}

export const ContentLayout = ({ children, url, lastSyncTime }: ContentLayoutProps) => {
  return (
    <AutoLayout
    name="Container"
    fill="#FAFAFA"
    stroke="#B5B5B599"
    cornerRadius={16}
    strokeWidth={2}
    direction="vertical"
    width={620}
    verticalAlignItems="center"
    horizontalAlignItems="center"
  >
    <AutoLayout
      name="Banner"
      fill={{
        type: "gradient-linear",
        gradientHandlePositions:
          [
            {
              x: 0.348,  y: -1.407,
            },
            {
              x: 0.472, y: 2.093,
            },
            {
              x: 0.728,  y: -2.33,
            },
          ],
        gradientStops: [
          {
            position: 0,
            color: { r: 0.5960784554481506, g: 0.5803921818733215, b: 0.9764705896377563, a: 1 },
          },
          {
            position: 1,
            color: { r: 0.2705882489681244, g: 0.22745098173618317, b: 1, a: 1 },
          },
        ],
      }}
      overflow="visible"
      spacing="auto"
      padding={{
        vertical: 24,
        horizontal: 28,
      }}
      width="fill-parent"
      verticalAlignItems="center"
    >
      <AutoLayout
        name="Plugin Name"
        overflow="visible"
        spacing={6}
        verticalAlignItems="center"
      >
        <Frame
          name="HackMD Logo"
          width={91}
          height={20}
        >
          <Frame
            name="HackMD Logo / Icon"
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
            width={20.539}
            height={20}
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
              height={20}
              width={21}
              src={LogoIconWhite}
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
            width={65.306}
            height={12.638}
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
              height={13}
              width={65}
              src={LogoWordMarkWhite}
            />
          </Frame>
        </Frame>
        <Text
          name="Viewer"
          fill="#FFF"
          fontFamily="Inter"
          fontSize={18}
          fontWeight={700}
        >
          Viewer
        </Text>
      </AutoLayout>
      <AutoLayout
        name="Link Button"
        fill="#7B75E1"
        cornerRadius={8}
        overflow="visible"
        spacing={2}
        padding={{
          vertical: 4,
          horizontal: 12,
        }}
        horizontalAlignItems="end"
        verticalAlignItems="center"
      >
        <Frame
          name="ArrowSquareOut"
          strokeWidth={
            0.125
          }
          width={18}
          height={18}
        >
          <SVG
            name="Vector_Vector_Vector_Vector"
            height={18}
            width={18}
            src={LinkIcon}
          />
        </Frame>
        <Text
          name="Link Text"
          fill="#FFF"
          fontFamily="Inter"
          href={url}
        >
          View Original Note{" "}
        </Text>
      </AutoLayout>
    </AutoLayout>
    <AutoLayout
      name="Body"
      overflow="visible"
      direction="vertical"
      spacing={12}
      padding={28}
      width="fill-parent"
    >
      <AutoLayout
        name="Note-Content Container"
        overflow="visible"
        spacing={10}
        width="fill-parent"
        horizontalAlignItems="center"
        verticalAlignItems="center"
      >
        <AutoLayout
          name="Content"
          width="fill-parent"
        >
          {children}
        </AutoLayout>
      </AutoLayout>
      <AutoLayout
        name="SyncInfoContainer"
        overflow="visible"
        direction="vertical"
        spacing={12}
        width="fill-parent"
        verticalAlignItems="center"
      >
        <Line length="fill-parent" stroke="#D9D9D9"/>
        <AutoLayout
          name="Frame 9"
          overflow="visible"
          spacing={4}
          verticalAlignItems="center"
        >
          <Text
            name="Sync Label"
            fill={MD_CONST.COLOR.GRAY}
            fontFamily="Inter"
            fontSize={14}
            fontWeight={500}
          >
            Last Synced:{" "}
          </Text>
          <Text
            name="Sync Date"
            fill={MD_CONST.COLOR.BLACK}
            fontFamily="Inter"
            fontSize={14}
            fontWeight={500}
          >
          {lastSyncTime || 'Not synced yet'}
          </Text>
        </AutoLayout>
      </AutoLayout>
    </AutoLayout>
  </AutoLayout>
  )
}

