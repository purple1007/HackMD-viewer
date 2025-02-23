import { MD_CONST } from "../constants/markdown";

export interface TextStyle {
  bold?: boolean;
  code?: boolean;
  highlight?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  href?: string;
  heading?: {
    level: number;
  };
  footnote?: boolean;
  sup?: boolean;
  sub?: boolean;
  ruby?: boolean;
  rt?: boolean;
}

export const getTextStyle = (style?: TextStyle, href?: string) => {
  const textDecoration = style?.underline || href
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
    : 28;

  return {
    fontWeight: style?.heading ? "extra-bold" : (style?.bold ? "bold" : "normal"),
    fill: href || style?.footnote
      ? MD_CONST.COLOR.PRIMARY
      : style?.code
      ? MD_CONST.COLOR.GRAY
      : style?.highlight
      ? MD_CONST.COLOR.HIGHLIGHT
      : MD_CONST.COLOR.BLACK,
    italic: Boolean(style?.italic),
    textDecoration: textDecoration as "none" | "strikethrough" | "underline",
    fontSize: style?.footnote ? 12 : fontSize,
    lineHeight,
    fontFamily: style?.code ? "JetBrains Mono" : "Inter",
    ...(validHref ? { href } : {}),
    ...(style?.footnote ? { baselineOffset: 4 } : {}),
    ...(style?.sup ? { baselineOffset: 8, fontSize: fontSize * 0.8 } : {}),
    ...(style?.sub ? { baselineOffset: -4, fontSize: fontSize * 0.8 } : {}),
    ...(style?.rt ? { baselineOffset: 12, fontSize: fontSize * 0.6 } : {}),
  };
};
