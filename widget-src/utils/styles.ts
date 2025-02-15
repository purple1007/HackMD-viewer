import { MD_CONST } from '../constants/markdown';

export interface TextStyle {
  bold?: boolean;
  highlight?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
}

export const getTextStyle = (style?: TextStyle, href?: string) => {
  const textDecoration = href 
    ? 'underline' 
    : style?.strikethrough 
      ? 'strikethrough'
      : 'none';

  return {
    fontWeight: style?.bold ? 'bold' : 'normal',
    fill: href ? MD_CONST.COLOR.PRIMARY : style?.highlight ? MD_CONST.COLOR.HIGHLIGHT : MD_CONST.COLOR.BLACK,
    italic: Boolean(style?.italic),
    textDecoration: textDecoration as 'none' | 'strikethrough' | 'underline',
    fontSize: MD_CONST.FONT_SIZE,
    ...(href && { href })
  };
}