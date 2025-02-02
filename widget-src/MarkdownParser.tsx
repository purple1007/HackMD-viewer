import { TextSegment } from './types/text'
import { StyledBlock, styledImage } from './types/block'

import { BlockParser } from './parser/BlockParser'
import { BlockRenderer } from './renderer/BlockRenderer'
import { ListRenderer } from './renderer/ListRenderer'
import { ImageRenderer } from './renderer/ImageRenderer'

export { MARKDOWN_CONSTANTS, CONTAINER_SIZE } from './constants/markdown'

export class MarkdownParser {
  static parseBlock(markdown: string): StyledBlock[] {
    return BlockParser.parseBlock(markdown)
  }

  static renderBlock(block: StyledBlock, index: number) {
    if (block.type === 'list') {
      return ListRenderer.renderList(block, index)
    }
    if (block.type === 'image') {
      return ImageRenderer.renderImage(block as styledImage, index)
    }
    return BlockRenderer.renderBlock(block, index)
  }
}