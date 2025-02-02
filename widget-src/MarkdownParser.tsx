import { TextSegment } from './types/text'
import { StyledBlock } from './types/block'
import { BlockParser } from './parser/BlockParser'
import { BlockRenderer } from './renderer/BlockRenderer'

export { MARKDOWN_CONSTANTS, CONTAINER_SIZE } from './constants/markdown'

export class MarkdownParser {
  static parseBlock(markdown: string): StyledBlock[] {
    return BlockParser.parseBlock(markdown)
  }

  static renderBlock(block: StyledBlock, index: number) {
    return BlockRenderer.renderBlock(block, index)
  }
}