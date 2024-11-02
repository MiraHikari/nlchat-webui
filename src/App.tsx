import { ConfigProvider, Spin, theme } from 'antd'
import React, { lazy, Suspense } from 'react'
import styled from 'styled-components'
import { SerialPortProvider } from './context/PortContext'
import './index.css'

const ArtPlums = lazy(() => import('./components/ArtPlums'))
const ChatUI = lazy(() => import('./components/ChatUI'))
const Footer = lazy(() => import('./components/Footer'))
const PortControl = lazy(() => import('./components/PortControl'))
const Terminal = lazy(() => import('./components/PortTerminal'))

const Layout = styled.div`
  display: grid;
  grid-template-columns: 0.3fr 0.7fr;
  gap: 1.3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const App: React.FC = () => {
  return (
    <ConfigProvider theme={{
      algorithm: theme.darkAlgorithm,
    }}
    >
      <Suspense fallback={<Spin fullscreen tip="加载页面组件中..." />}>
        <SerialPortProvider>
          <PortControl />
          <Layout>
            <Terminal />
            <ChatUI />
          </Layout>
        </SerialPortProvider>
        <ArtPlums />
        <Footer />
      </Suspense>
    </ConfigProvider>
  )
}

export default App
