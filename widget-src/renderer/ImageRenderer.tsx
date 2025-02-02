const { widget } = figma
const { AutoLayout, Image, Text, Span, SVG } = widget
import { ImageBroken } from '../components/icons'
import { styledImage } from '../types/block'

export class ImageRenderer {
  static renderImage(block: styledImage, index: number) {
    檢查圖片 URL 是否有效
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch (e) {
        console.error(`Invalid URL: ${url}`);
        return false;
      }
    };

    if (!isValidUrl(block.src)) {
      const RedText = '#CF7E7E';
      return (
        <AutoLayout key={index} padding={12} width={'fill-parent'} fill={'#F2E1E3'} direction='vertical' spacing={6} cornerRadius={4} >
          <SVG  src={ImageBroken} />
          <Text fill={RedText}>
            圖片網址無效
          </Text>
          <Text fill={RedText}>圖片網址：<Span href={block.src} textDecoration='underline'>{block.src}</Span> </Text>
          <Text fill={RedText}> 網址無效的原因，可能是 CORS 問題，請更換圖片網址。</Text>
        </AutoLayout>
      );
    }

    return (
      <Image
        key={index}
        src={block.src}
        width='fill-parent'
        height={300}
        cornerRadius={6}
        onError={() => {
          console.error('Unable to load image:', block.src);
        }}
      />
    );
  }
}