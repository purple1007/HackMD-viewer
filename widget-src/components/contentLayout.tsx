
const { widget } = figma;
const { AutoLayout, Text, Frame, SVG, Line } = widget;
import { LinkIcon } from './icons';

interface ContentLayoutProps {
  children: React.ReactNode;
  lastSyncTime?: string;
}

export const ContentLayout = ({ children, url, lastSyncTime }: ContentLayoutProps) => {
  return (
    <AutoLayout
      name="Container"
      fill="#FAFAFA"
      stroke="#C7C7C7"
      cornerRadius={16}
      overflow="visible"
      direction="vertical"
      spacing={12}
      padding={28}
      width={620}
      verticalAlignItems="center"
      horizontalAlignItems="center"
      >
      <AutoLayout
        name="Container"
        overflow="visible"
        direction="vertical"
        spacing={10}
        width="fill-parent"
        horizontalAlignItems="end"
      >
        <AutoLayout
          name="Link Button"
          fill="#F3F3F3"
          cornerRadius={4}
          overflow="visible"
          spacing={2}
          padding={{ vertical: 4, horizontal: 10 }}
          horizontalAlignItems="end"
          verticalAlignItems="center"
        >
          <Frame
            name="ArrowSquareOut"
            strokeWidth={0}
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
            fill="#564DFF"
            fontFamily="Inter"
            href={url}
          >
            View Original Note{" "}
          </Text>
        </AutoLayout>
      </AutoLayout>
      <Line length="fill-parent" stroke="#D9D9D9"/>
      <AutoLayout
        name="Note-Content Container"
        overflow="visible"
        spacing={10}
        width="fill-parent"
        horizontalAlignItems="center"
        verticalAlignItems="center"
      >
        {children}
      </AutoLayout>
      <AutoLayout
          name="SyncInfoContainer"
          overflow="visible"
          direction="vertical"
          spacing={12}
          width={564}
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
              fill="#ADADAD"
              fontFamily="Inter"
              fontSize={14}
              fontWeight={500}
            >
              Last Synced:{" "}
            </Text>
            <Text
              name="Sync Date"
              fill="#444"
              fontFamily="Inter"
              fontSize={14}
              fontWeight={500}
            >
              {lastSyncTime || 'Not synced yet'}
            </Text>
          </AutoLayout>
        </AutoLayout>
      </AutoLayout>
  )
}

