import { Badge, Button, Card, Form, InputNumber, message, Select, Space, Typography } from 'antd'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useSerialPort } from '../context/PortContext'

const { Option } = Select
const { Title } = Typography

const ControlPanel = styled(Card)`
  margin-bottom: 16px;

  .ant-card-body {
    padding: 16px;
  }
`

const StatusBadge = styled(Badge)`
  margin-left: 8px;
`

const ControlForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 12px;
  }
`

const baudRateOptions = [
  110,
  300,
  600,
  1200,
  2400,
  4800,
  9600,
  14400,
  19200,
  38400,
  57600,
  115200,
  128000,
  256000,
]

const flowControlOptions = [
  { label: 'None', value: 'none' },
  { label: 'Hardware', value: 'hardware' },
]

const PortControl: React.FC = () => {
  const {
    isConnected,
    settings,
    updateSettings,
    connect,
    disconnect,
  } = useSerialPort()

  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true) // 控制组件可见性的状态

  // 请求并连接串口
  const handleRequestAndConnect = useCallback(async () => {
    try {
      setLoading(true)

      // 请求用户选择串口
      const port = await navigator.serial.requestPort()

      // 直接连接选中的串口
      await connect(port)
      message.success('连接成功！')
    }
    catch (error: any) {
      if (error.name === 'NotFoundError') {
        message.warning('未选择任何串口！')
      }
      else {
        console.error('Failed to connect:', error)
        message.error('连接串口失败！')
      }
    }
    finally {
      setLoading(false)
    }
  }, [connect])

  // 断开连接
  const handleDisconnect = useCallback(async () => {
    try {
      setLoading(true)
      await disconnect()
      message.success('断开连接成功！')
    }
    catch (error) {
      console.error('Failed to disconnect:', error)
      message.error('断开连接失败！')
    }
    finally {
      setLoading(false)
    }
  }, [disconnect])

  // 切换可见性
  const toggleVisibility = () => {
    setIsVisible(prev => !prev)
  }

  return (
    <>
      {isVisible && (
        <ControlPanel>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>
                串口连接设置
                <StatusBadge
                  status={isConnected ? 'success' : 'default'}
                  text={isConnected ? '成功连接到串口' : '等待中...'}
                />
              </Title>
              <Button onClick={toggleVisibility} type="link">
                隐藏
              </Button>
            </div>

            <ControlForm layout="inline">
              <Form.Item label="波特率">
                <Select
                  style={{ width: 120 }}
                  value={settings.baudRate}
                  onChange={value => updateSettings({ baudRate: value })}
                  disabled={isConnected || loading}
                >
                  {baudRateOptions.map(rate => (
                    <Option key={rate} value={rate}>{rate}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="数据位">
                <Select
                  style={{ width: 80 }}
                  value={settings.dataBits}
                  onChange={value => updateSettings({ dataBits: value })}
                  disabled={isConnected || loading}
                >
                  <Option value={7}>7</Option>
                  <Option value={8}>8</Option>
                </Select>
              </Form.Item>

              <Form.Item label="停止位">
                <Select
                  style={{ width: 80 }}
                  value={settings.stopBits}
                  onChange={value => updateSettings({ stopBits: value })}
                  disabled={isConnected || loading}
                >
                  <Option value={1}>1</Option>
                  <Option value={2}>2</Option>
                </Select>
              </Form.Item>

              <Form.Item label="校验位">
                <Select
                  style={{ width: 100 }}
                  value={settings.parity}
                  onChange={value => updateSettings({ parity: value })}
                  disabled={isConnected || loading}
                >
                  <Option value="none">None</Option>
                  <Option value="even">Even</Option>
                  <Option value="odd">Odd</Option>
                </Select>
              </Form.Item>

              <Form.Item label="流控制">
                <Select
                  style={{ width: 120 }}
                  value={settings.flowControl}
                  onChange={value => updateSettings({ flowControl: value })}
                  disabled={isConnected || loading}
                  options={flowControlOptions}
                />
              </Form.Item>

              <Form.Item label="缓冲区">
                <InputNumber
                  style={{ width: 100 }}
                  min={64}
                  max={4096}
                  value={settings.bufferSize}
                  onChange={value => updateSettings({ bufferSize: value || 255 })}
                  disabled={isConnected || loading}
                />
              </Form.Item>

              <Form.Item label="合包等待时间">
                <InputNumber
                  style={{ width: 100 }}
                  min={0}
                  max={5000}
                  step={10}
                  value={settings.packageTimeout}
                  onChange={value => updateSettings({ packageTimeout: value || 0 })}
                  disabled={isConnected || loading}
                  addonAfter="ms"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type={isConnected ? 'default' : 'primary'}
                  onClick={isConnected ? handleDisconnect : handleRequestAndConnect}
                  loading={loading}
                >
                  {isConnected ? '断开连接' : '选择串口'}
                </Button>
              </Form.Item>
            </ControlForm>
          </Space>
        </ControlPanel>
      )}
      {!isVisible && (
        <Button onClick={toggleVisibility} type="primary" style={{ margin: 16 }}>
          恢复连接设置选项
        </Button>
      )}
    </>
  )
}

export default React.memo(PortControl)
