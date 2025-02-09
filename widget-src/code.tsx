const { widget } = figma
const { AutoLayout, Input, Text, useSyncedState, usePropertyMenu, useEffect, useWidgetId } = widget

import { Parser } from '../node_modules/marked/lib/marked'
import { HackMDButton } from './components/hackMDButton'
import { MarkdownParser } from './MarkdownParser'
import { CONTAINER_SIZE } from './constants/markdown'
import { getHackMDId } from './utils/hackMDId'

function HackMDViewer() {
  
  const [url, setUrl] = useSyncedState('url', '')
  const [content, setContent] = useSyncedState('content', '')
  const [loading, setLoading] = useSyncedState('loading', false)
  const [error, setError] = useSyncedState('error', '')

  const fetchHackMDContent = async (hackmdUrl: string, noteId?: string) => {
    try {
      setLoading(true)
      setError('')
      
      // 如果沒有傳入 noteId，則從 URL 解析
      const usedNoteId = noteId || getHackMDId(hackmdUrl)
      const publicResponse = await fetch(`https://hackmd.io/${usedNoteId}/download?t=${new Date().getTime()}`)
      if (!publicResponse.ok) {
        throw new Error('無法載入文件')
      }
      
      const content = await publicResponse.text()
      await setContent(content)
    } catch (err) {
      const error = err as Error
      setError(error.message || '無法讀取文件，請確認網址連結或瀏覽權限')
    } finally {
      setLoading(false)
    }
  }

 if (!url===false) {
  usePropertyMenu(
    [
      {
        itemType: 'action',
        propertyName: 'refresh',
        tooltip: '重新整理'
      }
    ],
    async ({ propertyName }: { propertyName: string }) => {
      if (propertyName === 'refresh' && url) {
        await fetchHackMDContent(url)
      }}
  )
 }

  

  const renderContent = () => {
    if (loading) {
      return (
        <AutoLayout>
          <Text>載入中...</Text>
        </AutoLayout>
      )
    }

    if (error) {
      return (
        <AutoLayout>
          <Text fill="#FF0000">{error}</Text>
        </AutoLayout>
      )
    }

    if (content) {
      const blocks = MarkdownParser.parseBlock(content)
      console.log('URL:', url)
      console.log('Parsed blocks:', blocks)
      return (
        <AutoLayout direction="vertical">
          {blocks.map((block, index) => MarkdownParser.renderBlock(block, index))}
        </AutoLayout>
      )
    }
    return null
  }

  return (
    <AutoLayout
      direction="vertical"
      width="hug-contents"
    >
        {/* 顯示按鈕 */}
        {!url ? (
            <HackMDButton 
              onSuccess={async (url, noteId) => {
                await setUrl(url)
                await fetchHackMDContent(url, noteId)
              }}
            />
          ) : (
          <AutoLayout
                  direction="vertical"
                  padding={CONTAINER_SIZE.PADDING}
                  width="hug-contents"
                  fill="#F5F5F5"
                  cornerRadius={8}
                  effect={{
                    type: 'drop-shadow',
                    color: { r: 0, g: 0, b: 0, a: 0.1 },
                    offset: { x: 0, y: 2 },
                    blur: 4
                  }}
                  spacing={8}
              >
              {renderContent()}
              </AutoLayout>
          )}
    </AutoLayout>
  )
}

widget.register(HackMDViewer)