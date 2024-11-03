import { Avatar, Card, Typography } from 'antd'
import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useSerialPort } from '../context/PortContext' // 引入 SerialPortContext

interface Message {
  content: string
  timestamp: number
  sender: 'me' | 'other' | 'system' // 添加 system 类型
}

const Container = styled(Card)`
  overflow: hidden;
  border-radius: 8px;
  height: calc(100vh - 220px);
  min-height: 400px;
  background: #1f1f1f;
  display: flex;
  flex-direction: column;

  .ant-card-body {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
`

const ScrollableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #1e1e1e;
  padding: 0 12px;

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`

const MessageContainer = styled.div<{ isSender: boolean }>`
  display: flex;
  flex-direction: ${props => (props.isSender ? 'row-reverse' : 'row')};
  align-items: flex-start;
  margin: 12px 0;
  gap: 12px;
`

const MessageContent = styled.div<{ isSender: boolean }>`
  background: ${props => (props.isSender ? '#1890ff' : '#2f2f2f')};
  padding: 12px;
  border-radius: 12px;
  border-top-${props => (props.isSender ? 'right' : 'left')}-radius: 4px;
  word-break: break-word; /* 确保长文本正确换行 */
`

const AvatarWrapper = styled.div`
  flex-shrink: 0; /* 防止头像被压缩 */
  width: 40px;
  height: 40px;
`

const StyledAvatar = styled(Avatar) <{ isSender: boolean }>`
  width: 40px;
  height: 40px;
  line-height: 40px;
  flex-shrink: 0;
  background: ${props => (props.isSender ? '#1890ff' : '#87d068')};
`

const TimeStamp = styled(Typography.Text)`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  display: block;
  margin-top: 4px;
`

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
const SystemAvatar = styled(StyledAvatar)`
  background: #722ed1; // 系统消息使用紫色
`

const SystemMessageContent = styled(MessageContent)`
  background: #391085;
  border-radius: 8px;
  opacity: 0.9;
  white-space: pre-line; // 保持换行符
`

function parseMessage(log: { data: string, timestamp: number, type: 'send' | 'receive' }): Message[] {
  const messages: Message[] = []

  // 按 \r\n 分割消息
  const contents = log.data.split(/\r\n/).filter(content => content.trim())

  // 用于存储系统消息
  const systemMessages: string[] = []
  // 用于存储发送的消息
  const sentContent: string[] = []
  // 用于存储接收的消息
  const receivedContent: string[] = []

  contents.forEach((content) => {
    // 检查是否是系统消息
    if (content.startsWith('ssapc') || content.startsWith('[sle')) {
      systemMessages.push(content)
    }
    // 检查是否是对话内容
    else if (content.includes('This is the content of the')) {
      // 提取实际内容
      const match = content.match(/This is the content of the (?:client|server):(.*)/)
      if (match && match[1]) {
        receivedContent.push(match[1].trim())
      }
    }
    // 处理自己发送的消息
    else if (log.type === 'send') {
      sentContent.push(content.trim())
    }
  })

  // 如果有系统消息，将它们合并为一条
  if (systemMessages.length > 0) {
    messages.push({
      content: systemMessages.join('\n'),
      timestamp: log.timestamp,
      sender: 'system',
    })
  }

  // 如果有发送的内容，将它们合并为一条
  if (sentContent.length > 0) {
    messages.push({
      content: sentContent.join(' '), // 使用空格连接多段内容
      timestamp: log.timestamp,
      sender: 'me',
    })
  }

  // 如果有接收的内容，将它们合并为一条
  if (receivedContent.length > 0) {
    messages.push({
      content: receivedContent.join(' '), // 使用空格连接多段内容
      timestamp: log.timestamp,
      sender: 'other',
    })
  }

  return messages
}


const ChatUI: React.FC = () => {
  const { logs } = useSerialPort()

  // 处理所有消息
  const messages: Message[] = logs.flatMap(log => parseMessage(log))

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const renderMessage = (message: Message, index: number) => {
    const isSender = message.sender === 'me'
    const isSystem = message.sender === 'system'

    if (isSystem) {
      return (
        <MessageContainer key={index} isSender={false}>
          <AvatarWrapper>
            <SystemAvatar isSender={false}>
              系统
            </SystemAvatar>
          </AvatarWrapper>
          <div>
            <SystemMessageContent isSender={false}>
              <Typography.Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                {message.content}
              </Typography.Text>
            </SystemMessageContent>
            <TimeStamp>
              {formatTimestamp(message.timestamp)}
            </TimeStamp>
          </div>
        </MessageContainer>
      )
    }

    return (
      <MessageContainer
        key={index}
        isSender={isSender}
      >
        <AvatarWrapper>
          <StyledAvatar isSender={isSender}>
            {isSender ? '我' : '对'}
          </StyledAvatar>
        </AvatarWrapper>
        <div>
          <MessageContent isSender={isSender}>
            <Typography.Text style={{ color: isSender ? '#fff' : 'rgba(255, 255, 255, 0.85)' }}>
              {message.content}
            </Typography.Text>
          </MessageContent>
          <TimeStamp>
            {formatTimestamp(message.timestamp)}
          </TimeStamp>
        </div>
      </MessageContainer>
    )
  }

  return (
    <Container bordered={false}>
      <ScrollableContainer ref={scrollRef}>
        {messages.map((message, index) => renderMessage(message, index))}
      </ScrollableContainer>
    </Container>
  )
}

export default ChatUI
