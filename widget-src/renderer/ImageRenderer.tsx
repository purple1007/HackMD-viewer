const { widget } = figma;
const { AutoLayout, Image, Text, Span, Frame, SVG } = widget;
import { WarningDiamond } from "../components/icons";
import { styledImage } from "../types/block";
import { MD_CONST } from "../constants/markdown";

export class ImageRenderer {
  static renderErrorMessage(src: string, index: number) {
    return (
      <AutoLayout
        name="ImageErrorBlock"
        key={index}
        fill="#FFF3F4"
        stroke="#FFDFDF"
        cornerRadius={12}
        overflow="visible"
        direction="vertical"
        spacing={6}
        padding={{
          vertical: 32,
          horizontal: 24,
        }}
        width="fill-parent"
        verticalAlignItems="center"
      >
        <Frame name="Error-WarningDiamond" width={24} height={24}>
          <SVG
            name="Vector"
            x={{
              type: "horizontal-scale",
              leftOffsetPercent: 6.276,
              rightOffsetPercent: 6.25,
            }}
            y={{
              type: "vertical-scale",
              topOffsetPercent: 6.253,
              bottomOffsetPercent: 6.253,
            }}
            height={21}
            width={21}
            src={WarningDiamond}
          />
        </Frame>
        <Text
          name="Error Title"
          fill={MD_CONST.COLOR.ERROR}
          lineHeight={25}
          fontFamily="Inter"
          fontWeight={600}
        >
          圖片無法載入
        </Text>
        <AutoLayout
          name="Error Message"
          opacity={0.6}
          direction="vertical"
          spacing={1}
          width="fill-parent"
        >
          <Text
            name="Message"
            fill={MD_CONST.COLOR.ERROR}
            lineHeight={25}
            fontWeight={500}
          >
            圖片網址: {src}
          </Text>
          <Text
            name="Message"
            fill={MD_CONST.COLOR.ERROR}
            lineHeight={25}
            fontWeight={500}
          >
            可能是 CORS 問題或存取權限不足，請更換圖片網址。
          </Text>
        </AutoLayout>
      </AutoLayout>
    );
  }

  static renderImage(block: styledImage, index: number) {
    const isValidUrl = (url: string) => {
      try {
        const urlPattern = new RegExp(
          "^(https?:\\/\\/)?" +
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
            "((\\d{1,3}\\.){3}\\d{1,3}))" +
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
            "(\\?[;&a-z\\d%_.~+=-]*)?" +
            "(\\#[-a-z\\d_]*)?$",
          "i"
        );
        return urlPattern.test(url);
      } catch (e) {
        console.error(`Error checking URL: ${url}`, e);
        return false;
      }
    };

    if (!isValidUrl(block.src)) {
      return this.renderErrorMessage(block.src, index);
    }

    return (
      <AutoLayout key={index} width="fill-parent">
        <Image
          src={block.src}
          width="fill-parent"
          height={300}
          cornerRadius={6}
        />
      </AutoLayout>
    );
  }
}
