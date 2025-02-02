import { MARKDOWN_CONSTANTS } from '../constants/markdown';

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
    fill: href ? '#0066CC' : style?.highlight ? '#DFA424' : '#232323',
    italic: Boolean(style?.italic),
    textDecoration: textDecoration as 'none' | 'strikethrough' | 'underline',
    fontSize: MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE,
    ...(href && { href })
  };
}