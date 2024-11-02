import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

interface SerialPortContextType {
  port: SerialPort | null
  isConnected: boolean
  settings: {
    baudRate: number
    dataBits: 7 | 8
    stopBits: 1 | 2
    parity: 'none' | 'even' | 'odd'
    flowControl: 'none' | 'hardware'
    bufferSize: number
    packageTimeout: number // 合包时间设置
  }
  logs: Array<{
    type: 'send' | 'receive'
    data: string
    timestamp: number
  }>
  connect: (port: SerialPort) => void
  disconnect: () => Promise<void>
  sendData: (data: string) => Promise<void>
  updateSettings: (newSettings: Partial<SerialPortContextType['settings']>) => void
  clearLogs: () => void
}

const SerialPortContext = createContext<SerialPortContextType | null>(null)

export const SerialPortProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [port, setPort] = useState<SerialPort | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [logs, setLogs] = useState<SerialPortContextType['logs']>([])
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
  const readLoopRef = useRef<boolean>(false)
  const serialDataRef = useRef<Uint8Array[]>([])
  const serialTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [settings, setSettings] = useState<SerialPortContextType['settings']>({
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    flowControl: 'none',
    bufferSize: 1024,
    packageTimeout: 100, // 默认不进行合包
  })

  const addLog = useCallback((type: 'send' | 'receive', data: string) => {
    setLogs(prev => [...prev, { type, data, timestamp: Date.now() }])
  }, [])

  const processReceivedData = useCallback((data: Uint8Array) => {
    if (settings.packageTimeout === 0) {
      // 不进行合包，直接处理
      const decoder = new TextDecoder()
      const text = decoder.decode(data)
      addLog('receive', text)
      return
    }

    // 合包处理
    serialDataRef.current.push(data)

    // 清除之前的定时器
    if (serialTimerRef.current) {
      clearTimeout(serialTimerRef.current)
    }

    // 设置新的定时器
    serialTimerRef.current = setTimeout(() => {
      // 合并所有数据
      const totalLength = serialDataRef.current.reduce((acc, curr) => acc + curr.length, 0)
      const combinedData = new Uint8Array(totalLength)

      let offset = 0
      serialDataRef.current.forEach((chunk) => {
        combinedData.set(chunk, offset)
        offset += chunk.length
      })

      // 处理合并后的数据
      const decoder = new TextDecoder()
      const text = decoder.decode(combinedData)
      addLog('receive', text)

      // 清空缓存的数据
      serialDataRef.current = []
    }, settings.packageTimeout)
  }, [settings.packageTimeout, addLog])

  const startReading = useCallback(async (port: SerialPort) => {
    readLoopRef.current = true

    while (readLoopRef.current && port.readable) {
      try {
        readerRef.current = port.readable.getReader()

        while (true) {
          const { value, done } = await readerRef.current.read()
          if (done || !readLoopRef.current) {
            break
          }

          processReceivedData(value)
        }
      }
      catch (error) {
        console.error('Error reading data:', error)
      }
      finally {
        if (readerRef.current) {
          readerRef.current.releaseLock()
          readerRef.current = null
        }
      }
    }
  }, [processReceivedData])

  const connect = useCallback(async (newPort: SerialPort) => {
    try {
      await newPort.open(settings)
      setPort(newPort)
      setIsConnected(true)
      startReading(newPort)
    }
    catch (error) {
      console.error('Error connecting to port:', error)
      throw error
    }
  }, [settings, startReading])

  const disconnect = useCallback(async () => {
    readLoopRef.current = false

    // 清理合包相关的状态
    if (serialTimerRef.current) {
      clearTimeout(serialTimerRef.current)
      serialTimerRef.current = null
    }
    serialDataRef.current = []

    if (readerRef.current) {
      try {
        await readerRef.current.cancel()
      }
      finally {
        readerRef.current = null
      }
    }

    if (port) {
      try {
        await port.close()
      }
      catch (error) {
        console.error('Error closing port:', error)
      }
    }

    setPort(null)
    setIsConnected(false)
  }, [port])

  const sendData = useCallback(async (data: string) => {
    if (!port || !port.writable) {
      throw new Error('Serial port is not ready for writing')
    }

    const writer = port.writable.getWriter()
    try {
      const encoder = new TextEncoder()
      const encoded = encoder.encode(data)
      await writer.write(encoded)
      addLog('send', data)
    }
    finally {
      writer.releaseLock()
    }
  }, [port, addLog])

  const updateSettings = useCallback((newSettings: Partial<SerialPortContextType['settings']>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  // 在组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (serialTimerRef.current) {
        clearTimeout(serialTimerRef.current)
      }
      if (isConnected) {
        disconnect()
      }
    }
  }, [isConnected, disconnect])

  const value = {
    port,
    isConnected,
    settings,
    logs,
    connect,
    disconnect,
    sendData,
    updateSettings,
    clearLogs,
  }

  return (
    <SerialPortContext.Provider value={value}>
      {children}
    </SerialPortContext.Provider>
  )
}

export function useSerialPort() {
  const context = useContext(SerialPortContext)
  if (!context) {
    throw new Error('useSerialPort must be used within a SerialPortProvider')
  }
  return context
}
