// EXPORTS: PLATFORMS, PLATFORM_GROUPS, IPlatform, IPlatformGroup, getPlatformById, getDefaultPlatform

export interface IPlatformGroup {
  key: string;
  label: string;
}

export interface IPlatform {
  id: string;
  name: string;
  group: string;
  description: string;
  digitalPins: number[];
  analogPins: number[];
  pwmPins: number[];
  defaultLibraries: string[];
  setupTemplate: string;
  loopTemplate: string;
}

export const PLATFORM_GROUPS: IPlatformGroup[] = [
  { key: 'arduino', label: 'Arduino 系列' },
  { key: 'esp', label: 'ESP 系列' },
  { key: 'stm32', label: 'STM32 系列' },
  { key: 'other', label: '其他平台' },
];

export const PLATFORMS: IPlatform[] = [
  // ===== Arduino 系列 =====
  {
    id: 'arduino_uno',
    name: 'Arduino Uno',
    group: 'arduino',
    description: '经典入门开发板，ATmega328P 微控制器，14 数字 IO / 6 模拟输入',
    digitalPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    analogPins: [0, 1, 2, 3, 4, 5],
    pwmPins: [3, 5, 6, 9, 10, 11],
    defaultLibraries: ['Arduino.h'],
    setupTemplate: `void setup() {
  Serial.begin(9600);
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },
  {
    id: 'arduino_nano',
    name: 'Arduino Nano',
    group: 'arduino',
    description: '紧凑型开发板，ATmega328P，面包板友好，14 数字 IO / 8 模拟输入',
    digitalPins: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    analogPins: [0, 1, 2, 3, 4, 5, 6, 7],
    pwmPins: [3, 5, 6, 9, 10, 11],
    defaultLibraries: ['Arduino.h'],
    setupTemplate: `void setup() {
  Serial.begin(9600);
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },
  {
    id: 'arduino_mega',
    name: 'Arduino Mega 2560',
    group: 'arduino',
    description: '高性能开发板，ATmega2560，54 数字 IO / 16 模拟输入，大项目首选',
    digitalPins: Array.from({ length: 54 }, (_, i) => i),
    analogPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    pwmPins: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 44, 45, 46],
    defaultLibraries: ['Arduino.h'],
    setupTemplate: `void setup() {
  Serial.begin(9600);
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },
  {
    id: 'arduino_pro_mini',
    name: 'Arduino Pro Mini',
    group: 'arduino',
    description: '超小型开发板，ATmega328P，3.3V/5V 可选，低功耗项目适用',
    digitalPins: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    analogPins: [0, 1, 2, 3, 4, 5, 6, 7],
    pwmPins: [3, 5, 6, 9, 10, 11],
    defaultLibraries: ['Arduino.h'],
    setupTemplate: `void setup() {
  // Pro Mini 无板载 USB，需外接串口模块
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },
  {
    id: 'atmega328p',
    name: 'ATmega328P (裸片)',
    group: 'arduino',
    description: '独立 ATmega328P-PU 芯片，需外部晶振和烧录器，定制化项目',
    digitalPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    analogPins: [0, 1, 2, 3, 4, 5],
    pwmPins: [3, 5, 6, 9, 10, 11],
    defaultLibraries: ['Arduino.h'],
    setupTemplate: `void setup() {
  // ATmega328P 独立运行
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },

  // ===== ESP 系列 =====
  {
    id: 'esp32',
    name: 'ESP32',
    group: 'esp',
    description: '双核 Wi-Fi + 蓝牙 SoC，Xtensa LX6，240MHz，丰富外设接口',
    digitalPins: Array.from({ length: 40 }, (_, i) => i),
    analogPins: [32, 33, 34, 35, 36, 39],
    pwmPins: Array.from({ length: 40 }, (_, i) => i).filter(
      (p) => p !== 34 && p !== 35 && p !== 36 && p !== 39,
    ),
    defaultLibraries: ['Arduino.h', 'WiFi.h'],
    setupTemplate: `void setup() {
  Serial.begin(115200);
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },
  {
    id: 'esp32_s3',
    name: 'ESP32-S3',
    group: 'esp',
    description: '双核 Xtensa LX7，240MHz，支持 AI 加速、USB OTG、更大 SRAM',
    digitalPins: Array.from({ length: 48 }, (_, i) => i),
    analogPins: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    pwmPins: Array.from({ length: 48 }, (_, i) => i).filter(
      (p) => p !== 22 && p !== 23 && p !== 24 && p !== 25,
    ),
    defaultLibraries: ['Arduino.h', 'WiFi.h'],
    setupTemplate: `void setup() {
  Serial.begin(115200);
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },
  {
    id: 'esp32_c3',
    name: 'ESP32-C3',
    group: 'esp',
    description: '单核 RISC-V 160MHz，Wi-Fi 6 + BLE 5.0，低功耗低成本',
    digitalPins: Array.from({ length: 22 }, (_, i) => i),
    analogPins: [0, 1, 2, 3, 4],
    pwmPins: Array.from({ length: 22 }, (_, i) => i).filter(
      (p) => p !== 12 && p !== 13 && p !== 14 && p !== 15,
    ),
    defaultLibraries: ['Arduino.h', 'WiFi.h'],
    setupTemplate: `void setup() {
  Serial.begin(115200);
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },
  {
    id: 'esp32_s2',
    name: 'ESP32-S2',
    group: 'esp',
    description: '单核 Xtensa LX7，240MHz，原生 USB OTG，无蓝牙，低功耗',
    digitalPins: Array.from({ length: 46 }, (_, i) => i),
    analogPins: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    pwmPins: Array.from({ length: 46 }, (_, i) => i).filter(
      (p) => p !== 22 && p !== 23 && p !== 24 && p !== 25 && p !== 26,
    ),
    defaultLibraries: ['Arduino.h', 'WiFi.h'],
    setupTemplate: `void setup() {
  Serial.begin(115200);
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },
  {
    id: 'esp8266',
    name: 'ESP8266 (NodeMCU)',
    group: 'esp',
    description: '低成本 Wi-Fi 模块，Tensilica L106 80MHz，NodeMCU 开发板',
    digitalPins: [0, 1, 2, 3, 4, 5, 12, 13, 14, 15, 16],
    analogPins: [0],
    pwmPins: [0, 1, 2, 3, 4, 5, 12, 13, 14, 15],
    defaultLibraries: ['Arduino.h', 'ESP8266WiFi.h'],
    setupTemplate: `void setup() {
  Serial.begin(115200);
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },

  // ===== STM32 系列 =====
  {
    id: 'stm32_bluepill',
    name: 'STM32F103C8T6 (Blue Pill)',
    group: 'stm32',
    description: 'ARM Cortex-M3 72MHz，64KB Flash / 20KB SRAM，性价比极高',
    digitalPins: Array.from({ length: 48 }, (_, i) => i),
    analogPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    pwmPins: [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    defaultLibraries: ['Arduino.h'],
    setupTemplate: `void setup() {
  Serial.begin(9600);
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },
  {
    id: 'stm32f407',
    name: 'STM32F407 (Discovery)',
    group: 'stm32',
    description: 'ARM Cortex-M4F 168MHz，1MB Flash / 192KB SRAM，带 FPU 和 DSP',
    digitalPins: Array.from({ length: 80 }, (_, i) => i),
    analogPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    pwmPins: Array.from({ length: 80 }, (_, i) => i).filter(
      (p) => p % 2 === 0 || p % 3 === 0,
    ),
    defaultLibraries: ['Arduino.h'],
    setupTemplate: `void setup() {
  Serial.begin(115200);
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },

  // ===== 其他平台 =====
  {
    id: 'rp2040',
    name: 'Raspberry Pi Pico (RP2040)',
    group: 'other',
    description: '双核 ARM Cortex-M0+ 133MHz，264KB SRAM，PIO 可编程 IO',
    digitalPins: Array.from({ length: 30 }, (_, i) => i),
    analogPins: [26, 27, 28],
    pwmPins: Array.from({ length: 30 }, (_, i) => i),
    defaultLibraries: ['Arduino.h'],
    setupTemplate: `void setup() {
  Serial.begin(115200);
  // 初始化引脚
}`,
    loopTemplate: `void loop() {
  // 主循环
}`,
  },
];

export function getPlatformById(id: string): IPlatform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

export function getDefaultPlatform(): IPlatform {
  return PLATFORMS[0];
}
