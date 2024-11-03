import { ClearOutlined, CopyOutlined, DownloadOutlined, SendOutlined, SettingOutlined } from '@ant-design/icons'
import { AnsiUp } from 'ansi_up'
import { Button, Card, Dropdown, Input, message, Select, Space, Switch, Tooltip } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useSerialPort } from '../context/PortContext'

const { Option } = Select

const ansiUp = new AnsiUp()
const textDecoder = new TextDecoder()

// 接口定义
interface TerminalOptions {
  logType: ('hex' | 'text' | 'ansi')[]
  showTime: boolean
  autoScroll: boolean
  lineEnding: string
}

interface LogLineProps {
  type: 'send' | 'receive' | 'system'
}

// 样式组件
const TerminalContainer = styled(Card)`
  height: calc(100vh - 220px);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  overflow: hidden;

  .ant-card-body {
    padding: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
`

const TerminalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #d9d9d9;
`

const SettingsPanel = styled.div`
  padding: 12px;
  border-bottom: 1px solid #d9d9d9;
  transition: height 0.3s ease-in-out;

  .setting-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    label {
      margin-right: 12px;
      min-width: 100px;
    }
  }
`

const TerminalOutput = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: #1e1e1e;
  color: #d4d4d4;
  scroll-behavior: smooth;

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

const LogLine = styled.div<LogLineProps>`
  margin: 2px 0;
  color: ${(props) => {
    switch (props.type) {
      case 'send':
        return '#3dd68c'
      case 'receive':
        return '#61afef'
      case 'system':
        return '#e5c07b'
      default:
        return 'inherit'
    }
  }};
`

const TerminalInput = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  background: #2c2c2c;
  border-top: 1px solid #3c3c3c;

  .ant-input-affix-wrapper {
    background: #1e1e1e;
    border: 1px solid #3c3c3c;

    &:focus,
    &-focused {
      border-color: #177ddc;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }

    input {
      background: transparent;

      &::placeholder {
      }
    }
  }

  .ant-btn {
    margin-left: 8px;
  }
`

const ToolbarButton = styled(Button)`
  &.ant-btn-text {
    &:hover {
      color: #40a9ff;
    }
  }
`

// 常量定义
const LINE_ENDINGS = {
  none: '',
  CR: '\r',
  LF: '\n',
  CRLF: '\r\n',
}

// 工具函数
function formatDate(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function HTMLEncode(html: string): string {
  const temp = document.createElement('div')
  temp.textContent = html
  return temp.innerHTML
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  }
  catch {
    message.error('复制失败')
  }
}

// 组件接口
interface SerialTerminalProps {
  height?: number | string
}

const SerialTerminal: React.FC<SerialTerminalProps> = ({ height }) => {
  const { sendData, logs, isConnected, clearLogs } = useSerialPort()
  const [input, setInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showSettings, setShowSettings] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<any>(null)

  const [options, setOptions] = useState<TerminalOptions>({
    logType: ['text', 'hex'],
    showTime: true,
    autoScroll: true,
    lineEnding: 'none',
  })

  // 渲染日志内容
  const renderLogContent = (data: number[] | string, includeHex: boolean): string => {
    let content = ''
    const dataArray = Array.isArray(data) ? data : Array.from(new TextEncoder().encode(data))

    if (includeHex) {
      const dataHex = dataArray.map(d => (`0${d.toString(16).toUpperCase()}`).slice(-2))
      if (options.logType.length > 1) {
        content += 'HEX: '
      }
      content += `${dataHex.join(' ')}\n`
    }

    if (options.logType.includes('text')) {
      const dataText = textDecoder.decode(Uint8Array.from(dataArray))
      if (options.logType.length > 1) {
        content += 'TEXT: '
      }
      content += HTMLEncode(dataText)
    }

    if (options.logType.includes('ansi')) {
      const dataText = textDecoder.decode(Uint8Array.from(dataArray))

      if (options.logType.length > 1) {
        content += 'ANSI: \n'
      }

      content += ansiUp.ansi_to_html(dataText)
    }

    return content
  }

  // 获取日志文本
  const getLogsText = (includeHex: boolean = true) => {
    return logs.map((log) => {
      const timestamp = options.showTime ? `[${formatDate(new Date(log.timestamp))}] ` : ''
      const direction = log.type === 'send' ? '>>> ' : '<<< '
      const content = renderLogContent(log.data, includeHex)
      return `${timestamp}${direction}${content}`
    }).join('\n')
  }

  // 导出日志
  const handleExport = (includeHex: boolean = true) => {
    const content = getLogsText(includeHex)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `serial-logs-${new Date().toISOString()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 自动滚动
  useEffect(() => {
    if (options.autoScroll && terminalRef.current) {
      const scrollTimeout = setTimeout(() => {
        terminalRef.current!.scrollTop = terminalRef.current!.scrollHeight
      }, 0)
      return () => clearTimeout(scrollTimeout)
    }
  }, [logs, options.autoScroll])

  // 发送数据
  const handleSend = async () => {
    if (input.trim()) {
      try {
        const dataToSend = input.trim() + LINE_ENDINGS[options.lineEnding as keyof typeof LINE_ENDINGS]
        await sendData(dataToSend)
        setCommandHistory(prev => [...prev, input.trim()])
        setHistoryIndex(-1)
        setInput('')
      }
      catch (error) {
        console.error('Failed to send data:', error)
        message.error('发送失败')
      }
    }
  }

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex)
          setInput(commandHistory[commandHistory.length - 1 - newIndex])
        }
      }
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      }
      else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  return (
    <TerminalContainer style={{ height }}>
      <TerminalHeader>
        <Space>
          <div className="title">串口执行日志</div>
          <Tooltip title="设置">
            <ToolbarButton
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setShowSettings(!showSettings)}
            />
          </Tooltip>
        </Space>
        <Space>
          <Tooltip title="复制日志内容">
            <Dropdown menu={{
              items: [
                {
                  key: '1',
                  label: '带 HEX 信息',
                  onClick: () => copyToClipboard(getLogsText(true)),
                },
                {
                  key: '2',
                  label: '不带 HEX 信息',
                  onClick: () => copyToClipboard(getLogsText(false)),
                },
              ],
            }}
            >
              <ToolbarButton onClick={() => copyToClipboard(getLogsText(true))} type="text" icon={<CopyOutlined />} />
            </Dropdown>
          </Tooltip>
          <Tooltip title="清屏">
            <ToolbarButton
              type="text"
              icon={<ClearOutlined />}
              onClick={clearLogs}
            />
          </Tooltip>
          <Tooltip title="导出日志">
            <Dropdown menu={{
              items: [
                {
                  key: '1',
                  label: '带 HEX 信息',
                  onClick: () => handleExport(true),
                },
                {
                  key: '2',
                  label: '不带 HEX 信息',
                  onClick: () => handleExport(false),
                },
              ],
            }}
            >
              <ToolbarButton type="text" icon={<DownloadOutlined />} />
            </Dropdown>
          </Tooltip>
        </Space>
      </TerminalHeader>

      {showSettings && (
        <SettingsPanel>
          <div className="setting-row">
            <label>显示格式:</label>
            <Select
              mode="multiple"
              style={{ width: 200 }}
              value={options.logType}
              onChange={value => setOptions(prev => ({ ...prev, logType: value }))}
            >
              <Option value="text">Text</Option>
              <Option value="hex">Hex</Option>
              <Option value="ansi">ANSI</Option>
            </Select>
          </div>
          <div className="setting-row">
            <label>显示时间:</label>
            <Switch
              checked={options.showTime}
              onChange={checked => setOptions(prev => ({ ...prev, showTime: checked }))}
            />
          </div>
          <div className="setting-row">
            <label>自动滚动:</label>
            <Switch
              checked={options.autoScroll}
              onChange={checked => setOptions(prev => ({ ...prev, autoScroll: checked }))}
            />
          </div>
          <div className="setting-row">
            <label>发送结尾追加换行符:</label>
            <Select
              style={{ width: 120 }}
              value={options.lineEnding}
              onChange={value => setOptions(prev => ({ ...prev, lineEnding: value }))}
            >
              <Option value="none">None</Option>
              <Option value="CR">CR</Option>
              <Option value="LF">LF</Option>
              <Option value="CRLF">CR+LF</Option>
            </Select>
          </div>
        </SettingsPanel>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TerminalOutput ref={terminalRef}>
          {logs.map((log, index) => (
            <LogLine key={index} type={log.type}>
              {options.showTime && `[${formatDate(new Date(log.timestamp))}] `}
              {log.type === 'send' ? '>>> ' : '<<< '}
              <span
                dangerouslySetInnerHTML={{
                  __html: renderLogContent(log.data, options.logType.includes('hex')),
                }}
              />
            </LogLine>
          ))}
        </TerminalOutput>

        <TerminalInput>
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? '输入聊天内容...' : '请先连接到串口...'}
            disabled={!isConnected}
            suffix={(
              <Tooltip title="发送 (Enter)">
                <SendOutlined
                  style={{ color: isConnected && input.trim() ? '#52c41a' : '#666' }}
                  onClick={handleSend}
                />
              </Tooltip>
            )}
          />

        </TerminalInput>
      </div>
    </TerminalContainer>
  )
}

export default React.memo(SerialTerminal)
