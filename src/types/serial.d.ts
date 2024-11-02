declare interface SerialOptions {
  baudRate: number
  dataBits: 7 | 8
  stopBits: 1 | 2
  parity: ParityType
  flowControl?: 'none' | 'hardware'
}

declare type ParityType = 'none' | 'even' | 'odd'
