import { MD_CONST } from "../constants/markdown";

export interface TextStyle {
  bold?: boolean;
  code?: boolean;
  highlight?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  href?: string;
  heading?: {
    level: number;
  };
}

export const getTextStyle = (style?: TextStyle, href?: string) => {
  const textDecoration = href
    ? "underline"
    : style?.strikethrough
    ? "strikethrough"
    : "none";

  const validHref = href && (href.startsWith('http://') || href.startsWith('https://'))

  const fontSize = style?.heading
    ? MD_CONST.HEADING_SIZES[style.heading.level as keyof typeof MD_CONST.HEADING_SIZES]
    : MD_CONST.FONT_SIZE;

  const lineHeight = style?.heading
    ? MD_CONST.HEADING_SIZES[style.heading.level as keyof typeof MD_CONST.HEADING_SIZES] * 1.6
    : undefined;

  return {
    fontWeight: style?.heading ? "extra-bold" : (style?.bold ? "bold" : "normal"),
    fill: href
      ? MD_CONST.COLOR.PRIMARY
      : style?.code
      ? MD_CONST.COLOR.GRAY
      : style?.highlight
      ? MD_CONST.COLOR.HIGHLIGHT
      : MD_CONST.COLOR.BLACK,
    italic: Boolean(style?.italic),
    textDecoration: textDecoration as "none" | "strikethrough" | "underline",
    fontSize,
    lineHeight,
    fontFamily: style?.code ? "JetBrains Mono" : "Inter",
    ...(validHref ? { href } : {}),
  };
};
