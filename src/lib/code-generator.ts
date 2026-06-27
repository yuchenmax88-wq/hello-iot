// EXPORTS: generateCode, IPlatform, IComponentInstance, ILogicBlock, IProjectConfig

import type { IComponentInstance, ILogicBlock, IProjectConfig, IWiFiConfig, IBLEConfig } from '@/types/iot';
import { PLATFORMS } from '@/data/platforms';

type Lang = 'zh' | 'en';

const CMT: Record<string, Record<string, string>> = {
  zh: {
    noLogic: '暂无逻辑配置，请在逻辑配置面板中添加逻辑块',
    readSensor: '读取传感器',
    todoCondition: 'TODO: 添加条件成立时的执行逻辑',
    todoLoop: 'TODO: 添加循环体执行逻辑',
    controlActuator: '控制执行器',
    connectWiFi: '连接 WiFi',
    wifiConnected: 'WiFi 已连接',
    bleSend: '通过蓝牙发送数据',
    comment: '(注释)',
    customCode: '(自定义代码块)',
    pinDefines: '===== 引脚定义 =====',
    noComponents: '暂无元件配置',
    globalObjects: '===== 全局对象 =====',
    noGlobalObjects: '暂无全局对象',
    noComponentInit: '暂无元件初始化',
    unconfiguredPin: '元件 "{name}" 的引脚 {pins} 未配置',
    platform: '平台',
    generatedAt: '生成时间',
    componentCount: '元件数量',
    logicBlockCount: '逻辑块数量',
    noLogicWarning: '已添加元件但未配置逻辑块，loop() 中将无执行代码',
    sensorNotFound: '逻辑块 "读取传感器" 关联的元件不存在',
    actuatorNotFound: '逻辑块 "控制执行器" 关联的元件不存在',
    webServer: '启动 Web 监控服务器',
    webStarted: 'Web 监控已启动',
    monitor: '设备监控',
    sensors: '传感器',
    actuators: '执行器',
    displays: '显示屏',
    refresh: '刷新',
    wifiCustom: '自定义 WiFi 代码',
    bleAuto: 'BLE 自动通知传感器数据',
    bleCustom: '自定义 BLE 代码',
    captivePortal: '强制门户：自动跳转监控页',
    connect: '连接方式',
    connectBLE: '连接蓝牙',
    connectingBLE: '蓝牙连接中',
  },
  en: {
    noLogic: 'No logic configured, please add logic blocks in the Logic panel',
    readSensor: 'Read sensor',
    todoCondition: 'TODO: Add execution logic when condition is true',
    todoLoop: 'TODO: Add loop body execution logic',
    controlActuator: 'Control actuator',
    connectWiFi: 'Connect WiFi',
    wifiConnected: 'WiFi connected',
    bleSend: 'Send data via BLE',
    comment: '(comment)',
    customCode: '(custom code)',
    pinDefines: '===== Pin Defines =====',
    noComponents: 'No components configured',
    globalObjects: '===== Global Objects =====',
    noGlobalObjects: 'No global objects',
    noComponentInit: 'No component initialization',
    unconfiguredPin: 'Pin(s) {pins} of component "{name}" are unconfigured',
    platform: 'Platform',
    generatedAt: 'Generated at',
    componentCount: 'Components',
    logicBlockCount: 'Logic Blocks',
    noLogicWarning: 'Components added but no logic blocks configured, loop() will have no execution code',
    sensorNotFound: 'Logic block "Read Sensor" references a non-existent component',
    actuatorNotFound: 'Logic block "Control Actuator" references a non-existent component',
    webServer: 'Start Web Monitor Server',
    webStarted: 'Web Monitor started',
    monitor: 'Device Monitor',
    sensors: 'Sensors',
    actuators: 'Actuators',
    displays: 'Displays',
    refresh: 'Refresh',
    wifiCustom: 'Custom WiFi Code',
    bleAuto: 'BLE Auto-Notify Sensor Data',
    bleCustom: 'Custom BLE Code',
    captivePortal: 'Captive portal: auto-redirect to monitor',
    connect: 'Connection',
    connectBLE: 'Connect Bluetooth',
    connectingBLE: 'Connecting BLE',
  },
};

// ---- 平台默认库引用 (动态从 PLATFORMS 构建) ----
const PLATFORM_LIBS: Record<string, string[]> = {};
PLATFORMS.forEach((p) => {
  PLATFORM_LIBS[p.id] = p.defaultLibraries;
});

// ---- 元件类型 → 所需库 ----
const COMPONENT_LIBS: Record<string, string[]> = {
  led: [],
  button: [],
  potentiometer: [],
  buzzer: [],
  dht11: ['DHT.h'],
  dht22: ['DHT.h'],
  ldr: [],
  hcsr04: [],
  pir: [],
  soil_moisture: [],
  relay: [],
  servo: ['Servo.h'],
  dc_motor: [],
  stepper_motor: ['Stepper.h'],
  rgb_led: [],
  oled_128x64: ['Adafruit_SSD1306.h', 'Adafruit_GFX.h', 'Wire.h'],
  lcd1602_i2c: ['LiquidCrystal_I2C.h', 'Wire.h'],
};

// ---- 元件类型 → 引脚标签 ----
const COMPONENT_PIN_LABELS: Record<string, string[]> = {
  led: ['anode'],
  button: ['signal'],
  potentiometer: ['signal'],
  buzzer: ['signal'],
  dht11: ['data'],
  dht22: ['data'],
  ldr: ['signal'],
  hcsr04: ['trig', 'echo'],
  pir: ['signal'],
  soil_moisture: ['signal'],
  relay: ['signal'],
  servo: ['signal'],
  dc_motor: ['in1', 'in2', 'ena'],
  stepper_motor: ['in1', 'in2', 'in3', 'in4'],
  rgb_led: ['red', 'green', 'blue'],
  oled_128x64: ['sda', 'scl'],
  lcd1602_i2c: ['sda', 'scl'],
};

// ---- 平台引脚范围 (动态从 PLATFORMS 构建) ----
const PLATFORM_PIN_RANGE: Record<string, { digital: number[]; analog: number[] }> = {};
PLATFORMS.forEach((p) => {
  PLATFORM_PIN_RANGE[p.id] = { digital: p.digitalPins, analog: p.analogPins };
});

// ---- 平台 setup 初始化代码 ----
function getPlatformSetup(platform: string): string {
  const p = PLATFORMS.find((pl) => pl.id === platform);
  if (!p) return '  Serial.begin(9600);';
  return p.setupTemplate
    .replace('void setup() {\n', '')
    .replace(/\n}$/, '');
}

// ---- 收集所有需要的库 ----
function collectLibraries(platform: string, components: IComponentInstance[], hasWiFi: boolean, hasBLE: boolean): string[] {
  const libSet = new Set<string>();
  (PLATFORM_LIBS[platform] || []).forEach((l) => libSet.add(l));
  components.forEach((c) => {
    (COMPONENT_LIBS[c.type] || []).forEach((l) => libSet.add(l));
  });
  if (hasWiFi) {
    libSet.add('WiFi.h');
    libSet.add('WebServer.h');
    libSet.add('DNSServer.h');
  }
  if (hasBLE) {
    libSet.add('BLEDevice.h');
    libSet.add('BLEServer.h');
    libSet.add('BLEUtils.h');
    libSet.add('BLE2902.h');
  }
  return Array.from(libSet);
  return Array.from(libSet);
}

// ---- 生成引脚定义 ----
function generatePinDefines(components: IComponentInstance[]): string {
  const lines: string[] = [];
  components.forEach((c) => {
    const labels = COMPONENT_PIN_LABELS[c.type] || [];
    labels.forEach((label) => {
      const pinNum = c.pins[label];
      if (pinNum !== undefined) {
        const varName = `${c.name.toUpperCase()}_${label.toUpperCase()}`;
        lines.push(`#define ${varName} ${pinNum}`);
      }
    });
  });
  return lines.join('\n');
}

// ---- 生成 setup() 中的元件初始化 ----
function generateComponentSetup(components: IComponentInstance[]): string {
  const lines: string[] = [];
  components.forEach((c) => {
    switch (c.type) {
      case 'led':
        if (c.pins.anode !== undefined) {
          lines.push(`  pinMode(${c.name.toUpperCase()}_ANODE, OUTPUT);`);
        }
        break;
      case 'rgb_led':
        ['red', 'green', 'blue'].forEach((ch) => {
          if (c.pins[ch] !== undefined) {
            lines.push(`  pinMode(${c.name.toUpperCase()}_${ch.toUpperCase()}, OUTPUT);`);
          }
        });
        break;
      case 'button':
        if (c.pins.signal !== undefined) {
          lines.push(`  pinMode(${c.name.toUpperCase()}_SIGNAL, INPUT_PULLUP);`);
        }
        break;
      case 'potentiometer':
      case 'ldr':
      case 'soil_moisture':
        // 模拟输入无需 pinMode
        break;
      case 'buzzer':
        if (c.pins.signal !== undefined) {
          lines.push(`  pinMode(${c.name.toUpperCase()}_SIGNAL, OUTPUT);`);
        }
        break;
      case 'dht11':
      case 'dht22':
        lines.push(`  dht_${c.name}.begin();`);
        break;
      case 'pir':
        if (c.pins.signal !== undefined) {
          lines.push(`  pinMode(${c.name.toUpperCase()}_SIGNAL, INPUT);`);
        }
        break;
      case 'relay':
        if (c.pins.signal !== undefined) {
          lines.push(`  pinMode(${c.name.toUpperCase()}_SIGNAL, OUTPUT);`);
          lines.push(`  digitalWrite(${c.name.toUpperCase()}_SIGNAL, LOW);`);
        }
        break;
      case 'servo':
        if (c.pins.signal !== undefined) {
          lines.push(`  servo_${c.name}.attach(${c.name.toUpperCase()}_SIGNAL);`);
        }
        break;
      case 'dc_motor':
        ['in1', 'in2', 'ena'].forEach((p) => {
          if (c.pins[p] !== undefined) {
            lines.push(`  pinMode(${c.name.toUpperCase()}_${p.toUpperCase()}, OUTPUT);`);
          }
        });
        break;
      case 'stepper_motor':
        ['in1', 'in2', 'in3', 'in4'].forEach((p) => {
          if (c.pins[p] !== undefined) {
            lines.push(`  pinMode(${c.name.toUpperCase()}_${p.toUpperCase()}, OUTPUT);`);
          }
        });
        break;
      case 'hcsr04':
        if (c.pins.trig !== undefined) lines.push(`  pinMode(${c.name.toUpperCase()}_TRIG, OUTPUT);`);
        if (c.pins.echo !== undefined) lines.push(`  pinMode(${c.name.toUpperCase()}_ECHO, INPUT);`);
        break;
      case 'oled_128x64':
        lines.push(`  display_${c.name}.begin(SSD1306_SWITCHCAPVCC, 0x3C);`);
        lines.push(`  display_${c.name}.clearDisplay();`);
        lines.push(`  display_${c.name}.display();`);
        break;
      case 'lcd1602_i2c':
        lines.push(`  lcd_${c.name}.init();`);
        lines.push(`  lcd_${c.name}.backlight();`);
        lines.push(`  lcd_${c.name}.setCursor(0, 0);`);
        lines.push(`  lcd_${c.name}.print("${c.name}");`);
        break;
      default:
        break;
    }
  });
  return lines.join('\n');
}

// ---- 生成全局对象声明 ----
function generateGlobalObjects(components: IComponentInstance[]): string {
  const lines: string[] = [];
  components.forEach((c) => {
    switch (c.type) {
      case 'dht11':
        lines.push(`DHT dht_${c.name}(${c.name.toUpperCase()}_DATA, DHT11);`);
        break;
      case 'dht22':
        lines.push(`DHT dht_${c.name}(${c.name.toUpperCase()}_DATA, DHT22);`);
        break;
      case 'servo':
        lines.push(`Servo servo_${c.name};`);
        break;
      case 'stepper_motor':
        lines.push(`Stepper stepper_${c.name}(2048, ${c.name.toUpperCase()}_IN1, ${c.name.toUpperCase()}_IN3, ${c.name.toUpperCase()}_IN2, ${c.name.toUpperCase()}_IN4);`);
        break;
      case 'oled_128x64':
        lines.push(`Adafruit_SSD1306 display_${c.name}(128, 64, &Wire, -1);`);
        break;
      case 'lcd1602_i2c':
        lines.push(`LiquidCrystal_I2C lcd_${c.name}(0x27, 16, 2);`);
        break;
      default:
        break;
    }
  });
  return lines.join('\n');
}

// ---- 生成 WiFi setup 代码 ----
function generateWiFiSetup(wifiConfig: IWiFiConfig | undefined, lang: Lang, components: IComponentInstance[]): string {
  if (!wifiConfig || !wifiConfig.ssid) return '';
  const cm = CMT[lang];
  const lines: string[] = [];
  lines.push('');

  if (wifiConfig.codeMode === 'custom' && wifiConfig.customCode) {
    lines.push(`  // ${cm.wifiCustom}`);
    lines.push(wifiConfig.customCode.split('\n').map(l => `  ${l}`).join('\n'));
    return lines.join('\n');
  }

  const modeStr = wifiConfig.mode === 'AP' ? 'WIFI_AP' : wifiConfig.mode === 'STA_AP' ? 'WIFI_AP_STA' : 'WIFI_STA';
  lines.push(`  // ${cm.connectWiFi}`);
  lines.push(`  WiFi.mode(${modeStr});`);
  if (wifiConfig.mode === 'STA' || wifiConfig.mode === 'STA_AP') {
    lines.push(`  WiFi.begin("${wifiConfig.ssid}", "${wifiConfig.password || ''}");`);
    if (wifiConfig.staticIP && wifiConfig.gateway && wifiConfig.subnet) {
      const ip = wifiConfig.staticIP.replace(/\./g, ', ');
      const gw = wifiConfig.gateway.replace(/\./g, ', ');
      const mask = wifiConfig.subnet.replace(/\./g, ', ');
      lines.push(`  WiFi.config(IPAddress(${ip}), IPAddress(${gw}), IPAddress(${mask}));`);
    }
    lines.push(`  while (WiFi.status() != WL_CONNECTED) {`);
    lines.push(`    delay(500);`);
    lines.push(`    Serial.print(".");`);
    lines.push(`  }`);
    lines.push(`  Serial.println(" ${cm.wifiConnected}");`);
    lines.push(`  Serial.print("IP: ");`);
    lines.push(`  Serial.println(WiFi.localIP());`);
  }
  if (wifiConfig.mode === 'AP' || wifiConfig.mode === 'STA_AP') {
    const apName = wifiConfig.apSSID || 'ESP_AP';
    lines.push(`  WiFi.softAP("${apName}");`);
    lines.push(`  Serial.println("AP: ${apName}");`);
  }

  // Captive portal DNS
  lines.push(`  // ${cm.captivePortal}`);
  lines.push(`  dnsServer.start(53, "*", WiFi.softAPIP());`);
  lines.push(`  server.onNotFound([]() {`);
  lines.push(`    server.sendHeader("Location", "/", true);`);
  lines.push(`    server.send(302, "text/plain", "");`);
  lines.push(`  });`);

  // Auto web server with monitoring page
  lines.push(`  // ${cm.webServer}`);
  const sensorComps = components.filter(c => ['dht11','dht22','ldr','hcsr04','pir','soil_moisture','potentiometer','button'].includes(c.type));
  const actuatorComps = components.filter(c => ['led','relay','servo','dc_motor','buzzer','rgb_led','stepper_motor'].includes(c.type));
  const displayComps = components.filter(c => ['oled_128x64','lcd1602_i2c'].includes(c.type));

  lines.push(`  server.on("/", []() {`);
  lines.push(`    String html = R"rawliteral(`);
  lines.push(`<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"><title>${cm.monitor}</title>`);
  lines.push(`<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:hsl(160,8%,8%);color:hsl(45,20%,92%);min-height:100vh;padding:16px}.header{text-align:center;padding:16px 0;border-bottom:2px solid hsl(38,92%,55%);margin-bottom:16px}.header h1{font-size:18px;color:hsl(38,92%,55%)}.header p{font-size:11px;color:hsl(160,5%,48%);margin-top:4px}.card{background:hsl(160,6%,12%);border:1px solid hsl(160,5%,18%);border-radius:8px;padding:12px;margin-bottom:8px}.card h3{font-size:13px;color:hsl(38,92%,55%);margin-bottom:8px;display:flex;align-items:center;gap:6px}.stat{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid hsl(160,5%,14%)}.stat:last-child{border:none}.stat-label{color:hsl(160,5%,48%)}.stat-value{color:hsl(45,20%,92%);font-weight:600;font-family:monospace}.led{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px}.led-on{background:hsl(142,60%,52%);box-shadow:0 0 6px hsl(142,60%,52%)}.led-off{background:hsl(160,5%,18%)}.refresh{position:fixed;bottom:16px;right:16px;background:hsl(38,92%,55%);color:hsl(160,8%,8%);border:none;border-radius:20px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer}</style></head><body>`);
  lines.push(`<div class="header"><h1>⚡ Hello IoT</h1><p>${cm.monitor} | " + String(WiFi.localIP().toString()) + "</p></div>`);
  lines.push(`<div class="card"><h3>🔗 ${cm.connect}</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button onclick="window.location.href='http://' + location.host + '/'" style="background:hsl(38,92%,55%);color:hsl(160,8%,8%);border:none;border-radius:6px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer">↻ WiFi</button><button id="bleBtn" onclick="connectBLE()" style="background:hsl(160,5%,16%);color:hsl(45,20%,92%);border:1px solid hsl(160,5%,24%);border-radius:6px;padding:8px 14px;font-size:12px;cursor:pointer">📶 ${cm.connectBLE}</button><span id="bleStatus" style="font-size:11px;color:hsl(160,5%,48%);align-self:center"></span></div></div>`);

  if (sensorComps.length > 0) {
    lines.push(`<div class="card"><h3>📡 ${cm.sensors}</h3>`);
    sensorComps.forEach(c => {
      const name = c.name || c.type;
      lines.push(`<div class="stat"><span class="stat-label">${name}</span><span class="stat-value" id="sensor_${c.id}">--</span></div>`);
    });
    lines.push(`</div>`);
  }
  if (actuatorComps.length > 0) {
    lines.push(`<div class="card"><h3>⚙️ ${cm.actuators}</h3>`);
    actuatorComps.forEach(c => {
      const name = c.name || c.type;
      lines.push(`<div class="stat"><span class="stat-label">${name}</span><span class="stat-value"><span class="led led-off" id="act_${c.id}"></span><span id="act_state_${c.id}">OFF</span></span></div>`);
    });
    lines.push(`</div>`);
  }
  if (displayComps.length > 0) {
    lines.push(`<div class="card"><h3>🖥️ ${cm.displays}</h3>`);
    displayComps.forEach(c => {
      lines.push(`<div class="stat"><span class="stat-label">${c.name || c.type}</span><span class="stat-value">✓ Active</span></div>`);
    });
    lines.push(`</div>`);
  }
  lines.push(`<button class="refresh" onclick="fetchData()">↻ ${cm.refresh}</button>`);
  lines.push(`<script>function fetchData(){fetch('/api/data').then(r=>r.json()).then(d=>{`);
  sensorComps.forEach(c => {
    lines.push(`const e${c.id}=document.getElementById('sensor_${c.id}');if(e${c.id})e${c.id}.textContent=d['sensor_${c.id}']??'--';`);
  });
  actuatorComps.forEach(c => {
    lines.push(`const a${c.id}=document.getElementById('act_${c.id}');const as${c.id}=document.getElementById('act_state_${c.id}');if(d['act_${c.id}']>0){a${c.id}.className='led led-on';as${c.id}.textContent='ON'}else{a${c.id}.className='led led-off';as${c.id}.textContent='OFF'};`);
  });
  lines.push(`}).catch(e=>console.error(e))}`);
  lines.push(`let bleDevice=null,bleChar=null;`);
  lines.push(`async function connectBLE(){`);
  lines.push(`try{bleDevice=await navigator.bluetooth.requestDevice({filters:[{services:['6e400001-b5a3-f393-e0a9-e50e24dcca9e']}]});`);
  lines.push(`document.getElementById('bleStatus').textContent='${cm.connectingBLE}...';`);
  lines.push(`const server=await bleDevice.gatt.connect();`);
  lines.push(`const service=await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');`);
  lines.push(`bleChar=await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');`);
  lines.push(`document.getElementById('bleStatus').textContent='BLE ✓';`);
  lines.push(`document.getElementById('bleBtn').style.color='hsl(142,60%,52%)';`);
  lines.push(`bleChar.addEventListener('characteristicvaluechanged',e=>{`);
  lines.push(`const data=new TextDecoder().decode(e.target.value);`);
  lines.push(`try{const d=JSON.parse(data);Object.keys(d).forEach(k=>{const el=document.getElementById('sensor_'+k)||document.querySelector('[id^=sensor_]');if(el&&d[k]!=null)el.textContent=d[k]})}catch(ex){console.log('BLE:',data)}`);  lines.push(`});`);
  lines.push(`await bleChar.startNotifications()`);
  lines.push(`}catch(e){document.getElementById('bleStatus').textContent='BLE ✗';console.error(e)}}`);
  lines.push(`setInterval(fetchData,2000);fetchData();</script></body></html>`);
  lines.push(`    )rawliteral";`);
  lines.push(`    server.send(200, "text/html", html);`);
  lines.push(`  });`);

  lines.push(`  server.on("/api/data", []() {`);
  lines.push(`    String json = "{";`);
  sensorComps.forEach((c, i) => {
    const comma = i < sensorComps.length - 1 || actuatorComps.length > 0 ? ',' : '';
    lines.push(`    json += "\\"sensor_${c.id}\\":" + String(${c.type === 'dht11' || c.type === 'dht22' ? 'dht.readTemperature()' : '0'}) + "${comma}";`);
  });
  actuatorComps.forEach((c, i) => {
    const comma = i < actuatorComps.length - 1 ? ',' : '';
    const varName = `${c.name.toUpperCase()}_${Object.keys(c.pins)[0]?.toUpperCase() || 'SIGNAL'}`;
    lines.push(`    json += "\\"act_${c.id}\\":" + String(digitalRead(${varName})) + "${comma}";`);
  });
  lines.push(`    json += "}";`);
  lines.push(`    server.send(200, "application/json", json);`);
  lines.push(`  });`);

  lines.push(`  server.begin();`);
  lines.push(`  Serial.println("${cm.webStarted}");`);
  return lines.join('\n');
}

// ---- 生成 BLE 全局声明 ----
function generateBLEGlobals(wifiConfig: IWiFiConfig | undefined, bleConfig: IBLEConfig | undefined): string {
  const parts: string[] = [];
  if (wifiConfig?.ssid && wifiConfig.codeMode !== 'custom') {
    parts.push('// Web Server\nWebServer server(80);\nDNSServer dnsServer;\n');
  }
  if (bleConfig?.deviceName) {
    parts.push('// BLE\nBLEServer *pServer = nullptr;\nBLEService *pService = nullptr;\nBLECharacteristic *pCharacteristic = nullptr;\n');
  }
  return parts.join('\n');
}

// ---- 生成 BLE setup 代码 ----
function generateBLESetup(bleConfig: IBLEConfig | undefined, lang: Lang): string {
  if (!bleConfig || !bleConfig.deviceName) return '';
  const cm = CMT[lang];

  if (bleConfig.codeMode === 'custom' && bleConfig.customCode) {
    const lines: string[] = [];
    lines.push('');
    lines.push(`  // ${cm.bleCustom}`);
    lines.push(bleConfig.customCode.split('\n').map(l => `  ${l}`).join('\n'));
    return lines.join('\n');
  }

  const sUUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'; // Nordic UART Service
  const txUUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'; // TX (Notify)
  const rxUUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'; // RX
  const lines: string[] = [];
  lines.push('');
  lines.push(`  // ${cm.bleAuto} (Nordic UART Service)`);
  lines.push(`  BLEDevice::init("${bleConfig.deviceName}");`);
  lines.push(`  pServer = BLEDevice::createServer();`);
  lines.push(`  pService = pServer->createService("${sUUID}");`);
  lines.push(`  pCharacteristic = pService->createCharacteristic(`);
  lines.push(`    "${txUUID}",`);
  lines.push(`    BLECharacteristic::PROPERTY_NOTIFY`);
  lines.push(`  );`);
  lines.push(`  pCharacteristic->addDescriptor(new BLE2902());`);
  lines.push(`  pService->start();`);
  lines.push(`  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();`);
  lines.push(`  pAdvertising->addServiceUUID("${sUUID}");`);
  lines.push(`  pAdvertising->start();`);
  lines.push(`  Serial.println("BLE: ${bleConfig.deviceName}");`);
  return lines.join('\n');
}

// ---- 生成 loop() 中的逻辑代码 ----
function generateLogicCode(blocks: ILogicBlock[], components: IComponentInstance[], lang: Lang, baseIndent = 2): string {
  if (blocks.length === 0) {
    return ' '.repeat(baseIndent) + '// ' + CMT[lang].noLogic;
  }

  const lines: string[] = [];
  let indent = baseIndent;

  function push(line: string) {
    lines.push(' '.repeat(indent) + line);
  }

  function processBlock(block: ILogicBlock) {
    switch (block.type) {
      case 'read_sensor': {
        const comp = components.find((c) => c.id === block.triggerComponentId);
        if (!comp) break;
        push(`// ${CMT[lang].readSensor}: ${comp.name}`);
        switch (comp.type) {
          case 'dht11':
          case 'dht22':
            push(`float humidity_${comp.name} = dht_${comp.name}.readHumidity();`);
            push(`float temperature_${comp.name} = dht_${comp.name}.readTemperature();`);
            break;
          case 'ldr':
            push(`int light_${comp.name} = analogRead(${comp.name.toUpperCase()}_SIGNAL);`);
            break;
          case 'potentiometer':
            push(`int potValue_${comp.name} = analogRead(${comp.name.toUpperCase()}_SIGNAL);`);
            break;
          case 'soil_moisture':
            push(`int moisture_${comp.name} = analogRead(${comp.name.toUpperCase()}_SIGNAL);`);
            break;
          case 'hcsr04':
            push(`digitalWrite(${comp.name.toUpperCase()}_TRIG, LOW);`);
            push(`delayMicroseconds(2);`);
            push(`digitalWrite(${comp.name.toUpperCase()}_TRIG, HIGH);`);
            push(`delayMicroseconds(10);`);
            push(`digitalWrite(${comp.name.toUpperCase()}_TRIG, LOW);`);
            push(`long duration_${comp.name} = pulseIn(${comp.name.toUpperCase()}_ECHO, HIGH);`);
            push(`float distance_${comp.name} = duration_${comp.name} * 0.034 / 2;`);
            break;
          case 'pir':
            push(`int pirState_${comp.name} = digitalRead(${comp.name.toUpperCase()}_SIGNAL);`);
            break;
          case 'button':
            push(`int btnState_${comp.name} = digitalRead(${comp.name.toUpperCase()}_SIGNAL);`);
            break;
          default:
            break;
        }
        break;
      }
      case 'condition': {
        const condition = block.triggerCondition || 'true';
        push(`if (${condition}) {`);
        indent += 2;
        // 递归处理子块
        if (block.children && block.children.length > 0) {
          block.children.forEach((child) => processBlock(child));
        } else {
          push('// ' + CMT[lang].todoCondition);
        }
        indent -= 2;
        push('}');
        break;
      }
      case 'loop': {
        const count = block.config.count || 5;
        const varName = block.config.varName || 'i';
        push(`for (int ${varName} = 0; ${varName} < ${count}; ${varName}++) {`);
        indent += 2;
        // 递归处理子块
        if (block.children && block.children.length > 0) {
          block.children.forEach((child) => processBlock(child));
        } else {
          push('// ' + CMT[lang].todoLoop);
        }
        indent -= 2;
        push('}');
        break;
      }
      case 'delay': {
        const ms = block.config.milliseconds || 1000;
        push(`delay(${ms});`);
        break;
      }
      case 'control_actuator': {
        const comp = components.find((c) => c.id === block.triggerComponentId);
        if (!comp) break;
        const action = (block.config.action as string) || 'on';
        push(`// ${CMT[lang].controlActuator}: ${comp.name} -> ${action}`);
        switch (comp.type) {
          case 'led':
            push(`digitalWrite(${comp.name.toUpperCase()}_ANODE, ${action === 'on' ? 'HIGH' : 'LOW'});`);
            break;
          case 'rgb_led': {
            const r = (block.config.red as number) ?? (action === 'on' ? 255 : 0);
            const g = (block.config.green as number) ?? (action === 'on' ? 255 : 0);
            const b = (block.config.blue as number) ?? (action === 'on' ? 255 : 0);
            push(`analogWrite(${comp.name.toUpperCase()}_RED, ${r});`);
            push(`analogWrite(${comp.name.toUpperCase()}_GREEN, ${g});`);
            push(`analogWrite(${comp.name.toUpperCase()}_BLUE, ${b});`);
            break;
          }
          case 'buzzer':
            push(`digitalWrite(${comp.name.toUpperCase()}_SIGNAL, ${action === 'on' ? 'HIGH' : 'LOW'});`);
            break;
          case 'relay':
            push(`digitalWrite(${comp.name.toUpperCase()}_SIGNAL, ${action === 'on' ? 'HIGH' : 'LOW'});`);
            break;
          case 'servo': {
            const angle = (block.config.angle as number) || 90;
            push(`servo_${comp.name}.write(${angle});`);
            break;
          }
          case 'dc_motor': {
            const speed = (block.config.speed as number) ?? 128;
            const dir = (block.config.direction as string) || 'forward';
            if (dir === 'forward') {
              push(`digitalWrite(${comp.name.toUpperCase()}_IN1, HIGH);`);
              push(`digitalWrite(${comp.name.toUpperCase()}_IN2, LOW);`);
            } else {
              push(`digitalWrite(${comp.name.toUpperCase()}_IN1, LOW);`);
              push(`digitalWrite(${comp.name.toUpperCase()}_IN2, HIGH);`);
            }
            push(`analogWrite(${comp.name.toUpperCase()}_ENA, ${speed});`);
            break;
          }
          case 'stepper_motor': {
            const steps = (block.config.steps as number) || 512;
            push(`stepper_${comp.name}.step(${steps});`);
            break;
          }
          default:
            break;
        }
        break;
      }
      case 'serial_output': {
        const message = (block.config.message as string) || 'Hello IoT';
        push(`Serial.println("${message}");`);
        break;
      }
      case 'wifi_connect': {
        const ssid = (block.config.ssid as string) || 'YOUR_SSID';
        const password = (block.config.password as string) || 'YOUR_PASSWORD';
        push(`// ${CMT[lang].connectWiFi}: ${ssid}`);
        push(`WiFi.begin("${ssid}", "${password}");`);
        push(`while (WiFi.status() != WL_CONNECTED) {`);
        push(`  delay(500);`);
        push(`  Serial.print(".");`);
        push(`}`);
        push(`Serial.println(" ${CMT[lang].wifiConnected}");`);
        break;
      }
      case 'ble_send': {
        const data = (block.config.data as string) || 'Hello BLE';
        push(`// ${CMT[lang].bleSend}`);
        push(`pCharacteristic->setValue("${data}");`);
        push(`pCharacteristic->notify();`);
        break;
      }
      case 'comment': {
        const text = (block.config.text as string) || '';
        if (text) {
          text.split('\n').forEach((line) => push(`// ${line}`));
        } else {
          push('// ' + CMT[lang].comment);
        }
        break;
      }
      case 'custom_code': {
        const code = (block.config.code as string) || '';
        if (code) {
          code.split('\n').forEach((line) => push(line));
        } else {
          push('// ' + CMT[lang].customCode);
        }
        break;
      }
      default:
        break;
    }
  }

  blocks.forEach((block) => processBlock(block));

  return lines.join('\n');
}

// ---- 主入口：生成完整 .ino 代码 ----
export function generateCode(config: IProjectConfig, lang: Lang = 'zh'): string {
  const { platform, components, logicBlocks, wifiConfig, bleConfig } = config;
  const cm = CMT[lang];

  const hasWiFi = !!wifiConfig?.ssid || logicBlocks.some(b => b.type === 'wifi_connect');
  const hasBLE = !!bleConfig?.deviceName || logicBlocks.some(b => b.type === 'ble_send');

  const libs = collectLibraries(platform, components, hasWiFi, hasBLE);
  const pinDefines = generatePinDefines(components);
  const globalObjects = generateGlobalObjects(components) + '\n' + generateBLEGlobals(wifiConfig, bleConfig);
  const componentSetup = generateComponentSetup(components);
  const wifiSetup = generateWiFiSetup(wifiConfig, lang, components);
  const bleSetup = generateBLESetup(bleConfig, lang);
  const platformSetup = getPlatformSetup(platform);
  const logicCode = generateLogicCode(logicBlocks, components, lang);

  const libIncludes = libs.map((l) => `#include <${l}>`).join('\n');

  return `/*
 * IoT Code Generator — Hello IoT
 * ${cm.platform}: ${platform}
 * ${cm.generatedAt}: ${new Date().toISOString()}
 * ${cm.componentCount}: ${components.length} | ${cm.logicBlockCount}: ${logicBlocks.length}
 */

${libIncludes}

// ${cm.pinDefines}
${pinDefines || '// ' + cm.noComponents}

// ${cm.globalObjects}
${globalObjects || '// ' + cm.noGlobalObjects}

void setup() {
${platformSetup}
${componentSetup || '  // ' + cm.noComponentInit}
${wifiSetup}
${bleSetup}
}

void loop() {
${logicCode}
${hasWiFi ? '  dnsServer.processNextRequest();\n  server.handleClient();' : ''}
${hasBLE ? `  if (pCharacteristic) {
    pCharacteristic->notify();
    delay(1000);
  }` : ''}
}
`;
}

// ---- 可行性检查 ----
export interface IValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProject(config: IProjectConfig, lang: Lang = 'zh'): IValidationResult {
  const cm = CMT[lang];
  const errors: string[] = [];
  const warnings: string[] = [];
  const { platform, components, logicBlocks } = config;

  // 1. 引脚冲突检测
  const pinUsage: Record<number, string[]> = {};
  components.forEach((c) => {
    const labels = COMPONENT_PIN_LABELS[c.type] || [];
    labels.forEach((label) => {
      const pin = c.pins[label];
      if (pin !== undefined) {
        if (!pinUsage[pin]) pinUsage[pin] = [];
        pinUsage[pin].push(`${c.name}.${label}`);
      }
    });
  });
  Object.entries(pinUsage).forEach(([pin, users]) => {
    if (users.length > 1) {
      errors.push(`引脚冲突: 引脚 ${pin} 被 ${users.join('、')} 同时占用`);
    }
  });

  // 2. 平台引脚范围检查
  const range = PLATFORM_PIN_RANGE[platform];
  if (range) {
    const allPins = [...range.digital, ...range.analog];
    components.forEach((c) => {
      const labels = COMPONENT_PIN_LABELS[c.type] || [];
      labels.forEach((label) => {
        const pin = c.pins[label];
        if (pin !== undefined && !allPins.includes(pin)) {
          errors.push(`引脚超出范围: ${c.name}.${label} 使用引脚 ${pin}，${platform} 不支持该引脚`);
        }
      });
    });
  }

  // 3. 元件引脚未配置检测
  components.forEach((c) => {
    const labels = COMPONENT_PIN_LABELS[c.type] || [];
    const unconfigured = labels.filter((l) => c.pins[l] === undefined);
    if (unconfigured.length > 0) {
      warnings.push(cm.unconfiguredPin.replace('{name}', c.name).replace('{pins}', unconfigured.join(', ')));
    }
  });

  // 4. 逻辑完整性检查
  if (components.length > 0 && logicBlocks.length === 0) {
    warnings.push(cm.noLogicWarning);
  }

  const readSensorBlocks = logicBlocks.filter((b) => b.type === 'read_sensor');
  readSensorBlocks.forEach((b) => {
    if (b.triggerComponentId) {
      const comp = components.find((c) => c.id === b.triggerComponentId);
      if (!comp) {
        warnings.push(cm.sensorNotFound);
      }
    }
  });

  const controlBlocks = logicBlocks.filter((b) => b.type === 'control_actuator');
  controlBlocks.forEach((b) => {
    if (b.triggerComponentId) {
      const comp = components.find((c) => c.id === b.triggerComponentId);
      if (!comp) {
        warnings.push(cm.actuatorNotFound);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
