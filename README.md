# Hello IoT — IoT Code Generator

> Visual block programming, one-click Arduino code generation, Web Serial firmware flashing, built-in monitoring dashboard.

[English](#english) | [中文](#chinese)

---

<a name="english"></a>
## English

**Hello IoT** is a browser-based IoT development tool. No installation, no signup — open the page and start building. Drag electronic components, wire pins visually, build logic with blocks, and get real-time Arduino/ESP firmware code. Flash directly to your chip via Web Serial, then monitor sensor data on your phone with zero extra apps.

### Features

| Feature | Description |
|---------|-------------|
| 🧩 **Visual Block Programming** | 10 logic block types — Read Sensor, Condition, Loop, Delay, Control Actuator, Serial Output, WiFi, BLE, Comment, Custom Code |
| ⚡ **Real-time Code Generation** | Arduino `.ino` code updates instantly as you configure, with syntax highlighting |
| 🔌 **Pin Config & Conflict Detection** | Assign pins from 14 supported platforms with real-time conflict checking |
| 📦 **Bill of Materials** | Auto-generated BOM with estimated pricing, export to CSV |
| 📱 **WiFi Captive Portal Monitor** | Connect ESP to WiFi — phone opens any URL → auto-redirected to live sensor dashboard |
| 📶 **BLE Auto-Notify** | Nordic UART Service (NUS) — standard BLE serial protocol, works with Web Bluetooth API |
| 🔥 **Web Serial Flasher** | Flash firmware directly from browser (Chrome/Edge) via USB for ESP chips |
| 🌐 **Offline Flashing Guide** | Download `.ino` for Arduino IDE / PlatformIO for all supported chips |
| 🌗 **Dark / Light Theme** | Terminal PCB aesthetic with copper-gold accents |
| 🌍 **Chinese / English** | Full i18n, switch with one click |

### Supported Platforms

**Arduino**: Uno, Nano, Mega 2560, Pro Mini, ATmega328P  
**ESP**: ESP32, ESP32-S3, ESP32-C3, ESP32-S2, ESP8266  
**STM32**: STM32F103 (Blue Pill), STM32F407  
**Other**: Raspberry Pi Pico (RP2040)

### Supported Components (17 types)

| Category | Components |
|----------|------------|
| Basic | LED, Button, Potentiometer, Buzzer |
| Sensor | DHT11, DHT22, LDR, HC-SR04, PIR, Soil Moisture |
| Actuator | Relay, Servo, DC Motor, Stepper Motor, RGB LED |
| Display | OLED 128x64 (SSD1306), LCD1602 (I2C) |

### Quick Start

```bash
# Requirements: Node.js 18+

# 1. Double-click start.bat (Windows) or start.sh (Mac/Linux)
#    — or run manually:

npm install --legacy-peer-deps
npm run dev

# 2. Open http://localhost:5173
```

### Electron Desktop App

```bash
# One-click packaging (produces standalone .exe / .app / .AppImage)
npm run electron:build       # All platforms
npm run electron:build:win   # Windows only

# Output in release/ folder:
#   Windows:  Hello IoT.exe (portable) + Setup installer
#   Mac:      Hello IoT.dmg + Hello IoT.app.zip
#   Linux:    Hello IoT.AppImage + .deb

# Dev mode with hot reload:
npm run electron:dev
```

### Build for Production

```bash
npm run build
# Output: dist/  (static files, deploy anywhere)
```

### Tech Stack

- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Vite 8
- Framer Motion + Lucide Icons
- Web Serial API + Web Bluetooth API

### Browser Support

| Browser | Status |
|---------|--------|
| Chrome / Edge | ✅ Full (Web Serial + Web Bluetooth) |
| Firefox | ✅ UI + Code Gen (no Web Serial) |
| Safari | ✅ UI + Code Gen (no Web Serial) |

### License

MIT

---

<a name="chinese"></a>
## 中文

**Hello IoT** 是一款纯浏览器的物联网开发工具。无需安装、无需注册 — 打开页面即可开始。拖拽电子元件、可视化引脚接线、积木式搭建逻辑，实时生成可烧录的 Arduino/ESP 固件代码。通过 Web Serial 直接在浏览器烧录到芯片，再用手机零 App 监控传感器数据。

### 功能特性

| 功能 | 说明 |
|------|------|
| 🧩 **可视化逻辑编程** | 10 种逻辑积木 — 读取传感器、条件判断、循环、延时、控制执行器、串口输出、WiFi、蓝牙、注释、自定义代码 |
| ⚡ **实时代码生成** | 配置即生成 `.ino` 代码，语法高亮实时预览 |
| 🔌 **引脚配置 & 冲突检测** | 14 种平台引脚分配，实时冲突检查 |
| 📦 **元件清单 (BOM)** | 自动生成物料清单，参考价格，导出 CSV |
| 📱 **WiFi 强制门户监视器** | ESP 连 WiFi 后，手机连接同一网络，打开任意网址自动跳转传感器仪表盘 |
| 📶 **蓝牙自动通知** | Nordic UART Service (NUS) 标准协议，支持 Web Bluetooth API 直接读取 |
| 🔥 **Web Serial 烧录** | Chrome/Edge 浏览器直接通过 USB 烧录 ESP 芯片 |
| 🌐 **离线烧录指引** | 下载 `.ino` 文件，Arduino IDE / PlatformIO 通用烧录 |
| 🌗 **深色 / 浅色主题** | 终端 PCB 美学 + 铜箔金信号系统 |
| 🌍 **中英文切换** | 全界面国际化，一键切换 |

### 支持的平台

**Arduino**: Uno, Nano, Mega 2560, Pro Mini, ATmega328P  
**ESP**: ESP32, ESP32-S3, ESP32-C3, ESP32-S2, ESP8266  
**STM32**: STM32F103 (Blue Pill), STM32F407  
**其他**: Raspberry Pi Pico (RP2040)

### 支持的元件（17 种）

| 分类 | 元件 |
|------|------|
| 基础元件 | LED、按钮、电位器、蜂鸣器 |
| 传感器 | DHT11、DHT22、光敏电阻、HC-SR04、PIR、土壤湿度 |
| 执行器 | 继电器、舵机、直流电机、步进电机、RGB LED |
| 显示屏 | OLED 128x64 (SSD1306)、LCD1602 (I2C) |

### 快速开始

```bash
# 环境要求: Node.js 18+

# 1. 双击 start.bat（Windows）或 start.sh（Mac/Linux）
#    — 或手动运行:

npm install --legacy-peer-deps
npm run dev

# 2. 浏览器打开 http://localhost:5173
```

### Electron 桌面应用

```bash
# 一键打包（生成独立 .exe / .app / .AppImage）
npm run electron:build       # 全平台
npm run electron:build:win   # 仅 Windows

# 输出在 release/ 目录：
#   Windows:  Hello IoT.exe (便携版) + Setup 安装程序
#   Mac:      Hello IoT.dmg + Hello IoT.app.zip
#   Linux:    Hello IoT.AppImage + .deb

# 开发模式（热更新）：
npm run electron:dev
```

### 生产构建

```bash
npm run build
# 输出: dist/（静态文件，可部署到任意服务器）
```

### 技术栈

- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Vite 8
- Framer Motion + Lucide Icons
- Web Serial API + Web Bluetooth API

### 浏览器支持

| 浏览器 | 支持情况 |
|--------|---------|
| Chrome / Edge | ✅ 全部功能（含 Web Serial + Web Bluetooth） |
| Firefox | ✅ UI + 代码生成（无 Web Serial） |
| Safari | ✅ UI + 代码生成（无 Web Serial） |

### 开源协议

MIT
