import { Modal } from 'antd'
import { useEffect, useState } from 'react'

function CompatibilityCheck() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCompatible, setIsCompatible] = useState(true)

  useEffect(() => {
    // 检查是否首次访问
    const hasVisited = localStorage.getItem('hasVisitedBefore')
    if (!hasVisited) {
      // 检查浏览器兼容性
      if (!('serial' in navigator)) {
        setIsCompatible(false)
        setIsModalOpen(true)
      }
      // 标记已访问
      localStorage.setItem('hasVisitedBefore', 'true')
    }
  }, [])

  return (
    <Modal
      title="浏览器兼容性检查"
      open={isModalOpen}
      onOk={() => setIsModalOpen(false)}
      onCancel={() => setIsModalOpen(false)}
      okText="我知道了"
      cancelText="关闭"
    >
      {isCompatible
? (
        <p>您的浏览器支持 Web Serial API，可以正常使用串口通信功能。</p>
      )
: (
        <div>
          <p>您的浏览器不支持 Web Serial API，无法使用串口通信功能。</p>
          <p>请使用以下支持的浏览器：</p>
          <ul>
            <li>Chrome 89 或更高版本</li>
            <li>Edge 89 或更高版本</li>
            <li>Opera 75 或更高版本</li>
          </ul>
        </div>
      )}
    </Modal>
  )
}

export default CompatibilityCheck
