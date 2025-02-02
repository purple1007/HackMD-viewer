const { widget } = figma
const { AutoLayout, Input, Text, useSyncedState, usePropertyMenu } = widget as any

import { Parser } from '../node_modules/marked/lib/marked'
import { MarkdownParser } from './MarkdownParser'
import { CONTAINER_SIZE } from './constants/markdown'

function HackMDViewer() {
  const [url, setUrl] = useSyncedState('url', '')
  const [content, setContent] = useSyncedState('content', '')
  const [loading, setLoading] = useSyncedState('loading', false)
  const [error, setError] = useSyncedState('error', '')

  const getHackMDId = (urlString: string): string => {
    const urlPattern = /hackmd\.io\/(?:@[^/]+\/)?([^/]+)/
    const match = urlString.match(urlPattern)
    
    if (!match || !match[1]) {
      throw new Error('不是有效的 HackMD 連結')
    }
    
    return match[1]
  }


  const fetchContent = async () => {
    if (!url) {
      setError('請輸入 HackMD 連結')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const noteId = getHackMDId(url)
      const publicResponse = await fetch(`https://hackmd.io/${noteId}/download?t=${new Date().getTime()}`)
      
      if (!publicResponse.ok) {
        throw new Error('無法載入文件')
      }
      
      const content = await publicResponse.text()
      setContent(content)
      
    } catch (err) {
      const error = err as Error
      setError(error.message || '無法讀取文件，請確認文件權限或 API Key 設定')
    } finally {
      setLoading(false)
    }
  }

  usePropertyMenu(
    [
      {
        itemType: 'action',
        propertyName: 'refresh',
        tooltip: '重新整理'
      }
    ],
    async ({ propertyName }: { propertyName: string }) => {
      if (propertyName === 'refresh') {
        await fetchContent()
      }
    }
  )

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
      padding={CONTAINER_SIZE.PADDING}
      width={CONTAINER_SIZE.WIDTH}
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
      <AutoLayout 
        width="fill-parent"
        fill="#eee"
        padding={10}
        cornerRadius={4}
      >
        <Input
          value={url}
          placeholder="輸入 HackMD 連結..."
          onTextEditEnd={(e: { characters: string }) => {
            setUrl(e.characters)
            fetchContent()
          }}
          width="fill-parent"
        />
      </AutoLayout>
      {renderContent()}
    </AutoLayout>
  )
}

widget.register(HackMDViewer)