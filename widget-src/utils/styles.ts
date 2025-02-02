import { MARKDOWN_CONSTANTS } from '../constants/markdown';

export interface TextStyle {
  bold?: boolean;
  highlight?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  href?: string;
}

export const getTextStyle = (style?: TextStyle) => {
  return {
    fontWeight: style?.bold ? 'bold' : 'normal' as 'bold' | 'normal',
    fill: style?.href ? "#0066CC" : style?.highlight ? "#DFA424" : "#232323",
    italic: style?.italic ? true : false,
    textDecoration: style?.href ? "underline" : style?.strikethrough ? "strikethrough" as 'none' | 'strikethrough' | 'underline' : "none" as 'none' | 'strikethrough' | 'underline',  
    fontSize: MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE
  }
}