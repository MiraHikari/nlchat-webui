import { Typography } from 'antd'

const { Text, Link } = Typography

export default function Footer() {
  return (
    <Typography
      style={{
        marginTop: '20px',
      }}
    >
      <Text strong>
        Powered by
        {' '}
        <Link href="https://www.gcxstudio.cn" target="_blank">
          MiraHikari
        </Link>
        .
        {' '}
        <Text strong style={{ marginLeft: '4px' }}>
          Click
          {' '}
          <Text keyboard>Star</Text>
          {' '}
          to support me.
        </Text>
      </Text>
    </Typography>
  )
}
