# Serial Port Chat UI

一个基于 Web Serial API 的串口通信应用，提供直观的聊天界面进行串口数据收发。

[在线示例](https://nlchat.what-the-fuck.sbs)

## 功能特点

- 🔌 串口连接管理
  - 支持多种波特率选择
  - 可配置数据位、停止位、校验位
  - 支持硬件流控制
  - 可调节缓冲区大小
  - 智能分包合并

- 💬 聊天式界面
  - 实时双向通信
  - 支持多种数据显示格式(Text/Hex/ANSI)
  - 时间戳显示
  - 自动滚动
  - 命令历史记录

- 📝 日志管理
  - 导出日志(支持带/不带 HEX 信息)
  - 复制日志内容
  - 清屏功能

- 🎨 界面设计
  - 响应式布局
  - 暗色主题
  - 优雅的动画效果
  - 梅花背景装饰

## 技术栈

- React 18
- TypeScript
- Ant Design
- Styled Components
- Web Serial API

## 快速开始

1. 克隆项目
```bash
git clone [repository-url]
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

## 使用说明

1. 点击"选择串口"按钮连接设备
2. 配置串口参数(波特率、数据位等)
3. 在输入框中输入要发送的内容，按回车或点击发送按钮
4. 接收到的数据会实时显示在聊天界面中

## 高级功能

### 数据显示格式
- Text: 纯文本格式
- Hex: 十六进制格式
- ANSI: 支持 ANSI 转义序列

### 智能分包
- 可配置合包等待时间
- 自动合并短时间内接收到的数据包

### 命令历史
- 使用上下方向键浏览历史命令
- 支持快速重发历史命令

## 浏览器兼容性

需要浏览器支持 Web Serial API，目前支持的浏览器可以查看该兼容性列表：https://caniuse.com/web-serial

## 许可证

[MIT License](LICENSE)

## 致谢

- 梅花背景动画设计灵感来自 [antfu.me](https://github.com/antfu/antfu.me)
