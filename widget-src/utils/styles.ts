import { MD_CONST } from "../constants/markdown";

export interface TextStyle {
  bold?: boolean;
  code?: boolean;
  highlight?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  href?: string;
}

export const getTextStyle = (style?: TextStyle, href?: string) => {
  const textDecoration = href
    ? "underline"
    : style?.strikethrough
    ? "strikethrough"
    : "none";

  const validHref = href && (href.startsWith('http://') || href.startsWith('https://'))

  return {
    fontWeight: style?.bold ? "bold" : "normal",
    fill: href
      ? MD_CONST.COLOR.PRIMARY
      : style?.code
      ? MD_CONST.COLOR.GRAY
      : style?.highlight
      ? MD_CONST.COLOR.HIGHLIGHT
      : MD_CONST.COLOR.BLACK,
    italic: Boolean(style?.italic),
    textDecoration: textDecoration as "none" | "strikethrough" | "underline",
    fontSize: MD_CONST.FONT_SIZE,
    fontFamily: style?.code ? "JetBrains Mono" : "Inter",
    ...(validHref ? { href } : {}),
  };
};
