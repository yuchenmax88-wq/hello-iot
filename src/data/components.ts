// EXPORTS: COMPONENT_CATEGORIES, COMPONENT_LIBRARY, type IComponentMeta, type IComponentCategory

export interface IComponentCategory {
  key: string;
  label: string;
  icon: string; // lucide icon name
}

export interface IComponentMeta {
  type: string;
  name: string;
  category: string; // references IComponentCategory.key
  description: string;
  defaultPins: Record<string, number>;
  requiredLibraries: string[];
  pinLabels: Record<string, string>; // pin key -> human-readable label
  icon: string; // lucide icon name
}

export const COMPONENT_CATEGORIES: IComponentCategory[] = [
  { key: 'basic', label: '基础元件', icon: 'Zap' },
  { key: 'sensor', label: '传感器', icon: 'Thermometer' },
  { key: 'actuator', label: '执行器', icon: 'Cog' },
  { key: 'display', label: '显示屏', icon: 'Monitor' },
];

export const COMPONENT_LIBRARY: IComponentMeta[] = [
  // ---- 基础元件 ----
  {
    type: 'led',
    name: 'LED',
    category: 'basic',
    description: '发光二极管，用于状态指示或简单输出',
    defaultPins: { anode: 13 },
    requiredLibraries: [],
    pinLabels: { anode: '正极 (Anode)' },
    icon: 'Lightbulb',
  },
  {
    type: 'button',
    name: '按钮',
    category: 'basic',
    description: '轻触开关，用于用户输入触发',
    defaultPins: { signal: 2 },
    requiredLibraries: [],
    pinLabels: { signal: '信号脚' },
    icon: 'ToggleLeft',
  },
  {
    type: 'potentiometer',
    name: '电位器',
    category: 'basic',
    description: '可调电阻，用于模拟量输入（如旋钮调节）',
    defaultPins: { signal: 0 },
    requiredLibraries: [],
    pinLabels: { signal: '信号脚 (Analog)' },
    icon: 'SlidersHorizontal',
  },
  {
    type: 'buzzer',
    name: '蜂鸣器',
    category: 'basic',
    description: '有源/无源蜂鸣器，用于声音提示',
    defaultPins: { signal: 8 },
    requiredLibraries: [],
    pinLabels: { signal: '信号脚' },
    icon: 'Volume2',
  },

  // ---- 传感器 ----
  {
    type: 'dht11',
    name: 'DHT11 温湿度传感器',
    category: 'sensor',
    description: '数字温湿度传感器，测量范围 0-50°C / 20-90% RH',
    defaultPins: { data: 4 },
    requiredLibraries: ['DHT.h'],
    pinLabels: { data: '数据脚 (Data)' },
    icon: 'Thermometer',
  },
  {
    type: 'dht22',
    name: 'DHT22 温湿度传感器',
    category: 'sensor',
    description: '高精度数字温湿度传感器，测量范围 -40-80°C / 0-100% RH',
    defaultPins: { data: 4 },
    requiredLibraries: ['DHT.h'],
    pinLabels: { data: '数据脚 (Data)' },
    icon: 'ThermometerSun',
  },
  {
    type: 'ldr',
    name: '光敏电阻',
    category: 'sensor',
    description: '光敏电阻模块，检测环境光照强度',
    defaultPins: { signal: 0 },
    requiredLibraries: [],
    pinLabels: { signal: '信号脚 (Analog)' },
    icon: 'Sun',
  },
  {
    type: 'hcsr04',
    name: 'HC-SR04 超声波传感器',
    category: 'sensor',
    description: '超声波测距模块，测量范围 2cm-400cm',
    defaultPins: { trig: 9, echo: 10 },
    requiredLibraries: [],
    pinLabels: { trig: '触发脚 (Trig)', echo: '回波脚 (Echo)' },
    icon: 'Radio',
  },
  {
    type: 'pir',
    name: 'PIR 人体红外传感器',
    category: 'sensor',
    description: '被动红外运动检测模块，用于人体感应',
    defaultPins: { signal: 3 },
    requiredLibraries: [],
    pinLabels: { signal: '信号脚' },
    icon: 'Eye',
  },
  {
    type: 'soil_moisture',
    name: '土壤湿度传感器',
    category: 'sensor',
    description: '土壤湿度检测模块，用于自动浇灌系统',
    defaultPins: { signal: 0 },
    requiredLibraries: [],
    pinLabels: { signal: '信号脚 (Analog)' },
    icon: 'Droplets',
  },

  // ---- 执行器 ----
  {
    type: 'relay',
    name: '继电器模块',
    category: 'actuator',
    description: '单路继电器模块，用于控制高压电器开关',
    defaultPins: { signal: 7 },
    requiredLibraries: [],
    pinLabels: { signal: '控制脚' },
    icon: 'Power',
  },
  {
    type: 'servo',
    name: '舵机 (SG90)',
    category: 'actuator',
    description: '微型伺服电机，0-180° 角度控制',
    defaultPins: { signal: 9 },
    requiredLibraries: ['Servo.h'],
    pinLabels: { signal: '信号脚' },
    icon: 'Crosshair',
  },
  {
    type: 'dc_motor',
    name: '直流电机 (L298N)',
    category: 'actuator',
    description: '直流电机驱动模块，支持正反转和 PWM 调速',
    defaultPins: { in1: 5, in2: 6, ena: 3 },
    requiredLibraries: [],
    pinLabels: { in1: 'IN1', in2: 'IN2', ena: 'ENA (PWM)' },
    icon: 'Gauge',
  },
  {
    type: 'stepper_motor',
    name: '步进电机 (28BYJ-48)',
    category: 'actuator',
    description: '4 相步进电机 + ULN2003 驱动板，精确角度控制',
    defaultPins: { in1: 8, in2: 9, in3: 10, in4: 11 },
    requiredLibraries: ['Stepper.h'],
    pinLabels: { in1: 'IN1', in2: 'IN2', in3: 'IN3', in4: 'IN4' },
    icon: 'RotateCw',
  },
  {
    type: 'rgb_led',
    name: 'RGB LED 模块',
    category: 'actuator',
    description: '共阴 RGB LED，三路 PWM 混色控制',
    defaultPins: { red: 9, green: 10, blue: 11 },
    requiredLibraries: [],
    pinLabels: { red: '红 (R)', green: '绿 (G)', blue: '蓝 (B)' },
    icon: 'Palette',
  },

  // ---- 显示屏 ----
  {
    type: 'oled_128x64',
    name: 'OLED 128x64 (SSD1306)',
    category: 'display',
    description: '0.96 寸 I2C OLED 显示屏，128x64 像素',
    defaultPins: { sda: 4, scl: 5 },
    requiredLibraries: ['Wire.h', 'Adafruit_SSD1306.h', 'Adafruit_GFX.h'],
    pinLabels: { sda: 'SDA', scl: 'SCL' },
    icon: 'Monitor',
  },
  {
    type: 'lcd1602_i2c',
    name: 'LCD1602 (I2C)',
    category: 'display',
    description: '16x2 字符型 LCD 显示屏，I2C 接口',
    defaultPins: { sda: 4, scl: 5 },
    requiredLibraries: ['Wire.h', 'LiquidCrystal_I2C.h'],
    pinLabels: { sda: 'SDA', scl: 'SCL' },
    icon: 'RectangleHorizontal',
  },
];
