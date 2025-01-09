/// <reference types="@figma/widget-typings" />
import { MarkdownParser, MARKDOWN_CONSTANTS} from './MarkdownParser'

const { widget } = figma
const { AutoLayout,Span, Text, Input, useSyncedState, usePropertyMenu } = widget

const CONTAINER_SIZE = {
  WIDTH: 600,
  PADDING: 16,
}


const refreshIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.65 2.35a8 8 0 1 0 1.4 1.4L13.65 2.35z" fill="currentColor"/></svg>`
const keyIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.33a4.67 4.67 0 0 1 4.67 4.67A4.67 4.67 0 0 1 8 10.67 4.67 4.67 0 0 1 3.33 6 4.67 4.67 0 0 1 8 1.33z" fill="currentColor"/></svg>`


function HackMDViewer() {
  const [url, setUrl] = useSyncedState('url', '')
  const [content, setContent] = useSyncedState('content', '')
  const [loading, setLoading] = useSyncedState('loading', false)
  const [error, setError] = useSyncedState('error', '')
  const [apiKey, setApiKey] = useSyncedState('apiKey', '')

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
      
      if (apiKey) {
        try {
          const response = await fetch(`https://api.hackmd.io/v1/notes/${noteId}?t=${new Date().getTime()}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (!response.ok) {
            throw new Error(`API 錯誤: ${response.status}`)
          }
          
          const data = await response.json()
          setContent(data.content)
          return
        } catch (err) {
          console.error('API request failed:', err)
        }
      }
      
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
        tooltip: '重新整理',
        icon: refreshIcon
      },
      {
        itemType: 'separator'
      },
      {
        itemType: 'action',
        propertyName: 'setApiKey',
        tooltip: '設定 API Key',
        icon: keyIcon
      }
    ],
    async ({ propertyName }) => {
      if (propertyName === 'refresh') {
        await fetchContent()
      } else if (propertyName === 'setApiKey') {
        figma.showUI(__html__, { width: 320, height: 160 })
        figma.ui.onmessage = (message) => {
          if (message.type === 'setApiKey' && message.apiKey) {
            setApiKey(message.apiKey)
            figma.closePlugin()
          }
        }
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
        <AutoLayout direction="vertical" fill="#ffffff">
          {blocks.map((block, index) => (
            <Text 
              key={index}
              width={CONTAINER_SIZE.WIDTH-CONTAINER_SIZE.PADDING*2}
              fontSize={
                block.type === 'heading' 
                ? MARKDOWN_CONSTANTS.HEADING_SIZES[block.level as keyof typeof MARKDOWN_CONSTANTS.HEADING_SIZES] 
                : MARKDOWN_CONSTANTS.REGULAR_FONT_SIZE
              }
              fontWeight={block.type === 'heading' ? 'extra-bold' : 'normal'}
              horizontalAlignText="left"
              lineHeight={
                block.type === 'heading' 
                ? MARKDOWN_CONSTANTS.HEADING_SIZES[block.level as keyof typeof MARKDOWN_CONSTANTS.HEADING_SIZES] * 1.6
                : 28
              }
            >
              {block.segments ? (
                block.segments.map((segment, segIndex) => (
                  <Span 
                    key={`${index}-${segIndex}`}
                    fontWeight={segment.style?.bold ? 'bold' : 'normal'}
                    fill={segment.style?.highlight ? "#FF0000" : "#000000"}
                    fontSize={segment.style?.highlight ? 40 : 16}
                  >
                    {segment.text}
                  </Span>
                ))
                )   : (
                block.content
              )}
            </Text>
          ))} 
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
      fill="#FFFFFF"
      cornerRadius={8}
      effect={{
        type: 'drop-shadow',
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 2 },
        blur: 4
      }}
      spacing={8}
    >
      <AutoLayout width="fill-parent">
        <Input
          value={url}
          placeholder="輸入 HackMD 連結..."
          onTextEditEnd={(e) => {
            setUrl(e.characters)
            fetchContent()
          }}
          width="fill-parent"
        />
      </AutoLayout>
      
      {renderContent()}
      
      {!apiKey && (
        <AutoLayout>
          <Text fill="#FF6B00">提示：設定 API Key 可以存取私人文件</Text>
        </AutoLayout>
      )}
    </AutoLayout>
  )
}

widget.register(HackMDViewer)