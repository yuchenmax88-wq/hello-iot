// EXPORTS: EXAMPLE_PROJECTS, IExampleProject

import type { IProjectConfig } from '@/types/iot';

export interface IExampleProject {
  id: string;
  name: string;
  description: string;
  config: IProjectConfig;
}

export const EXAMPLE_PROJECTS: IExampleProject[] = [
  {
    id: 'temp_humidity_monitor',
    name: '温湿度监控',
    description: '使用 DHT11 传感器读取温湿度，当温度超过 30°C 时点亮 LED 报警',
    config: {
      platform: 'arduino_uno',
      components: [
        {
          id: 'comp-1',
          type: 'dht11',
          name: '温湿度传感器',
          pins: { data: 2, vcc: 5, gnd: 4 },
        },
        {
          id: 'comp-2',
          type: 'led',
          name: '报警 LED',
          pins: { anode: 13, cathode: 12 },
        },
      ],
      logicBlocks: [
        {
          id: 'logic-1',
          type: 'read_sensor',
          config: { sensorId: 'comp-1', field: 'temperature' },
        },
        {
          id: 'logic-2',
          type: 'condition',
          config: { operator: '>', threshold: 30 },
          triggerComponentId: 'comp-1',
          triggerCondition: 'temperature > 30',
        },
        {
          id: 'logic-3',
          type: 'control_actuator',
          config: { actuatorId: 'comp-2', action: 'on' },
        },
        {
          id: 'logic-4',
          type: 'delay',
          config: { milliseconds: 2000 },
        },
        {
          id: 'logic-5',
          type: 'serial_output',
          config: { message: '温度: {temperature}°C, 湿度: {humidity}%' },
        },
      ],
    },
  },
  {
    id: 'smart_light_control',
    name: '智能灯控',
    description: '通过按钮控制 LED 开关，并在 OLED 屏幕上显示状态',
    config: {
      platform: 'esp32',
      components: [
        {
          id: 'comp-1',
          type: 'button',
          name: '开关按钮',
          pins: { signal: 4, vcc: 3, gnd: 5 },
        },
        {
          id: 'comp-2',
          type: 'led',
          name: '主灯',
          pins: { anode: 13, cathode: 12 },
        },
        {
          id: 'comp-3',
          type: 'oled_128x64',
          name: 'OLED 显示屏',
          pins: { sda: 21, scl: 22, vcc: 3, gnd: 5 },
        },
      ],
      logicBlocks: [
        {
          id: 'logic-1',
          type: 'condition',
          config: { operator: 'pressed' },
          triggerComponentId: 'comp-1',
          triggerCondition: 'button_pressed',
        },
        {
          id: 'logic-2',
          type: 'control_actuator',
          config: { actuatorId: 'comp-2', action: 'toggle' },
        },
        {
          id: 'logic-3',
          type: 'serial_output',
          config: { message: '灯状态已切换' },
        },
        {
          id: 'logic-4',
          type: 'delay',
          config: { milliseconds: 500 },
        },
      ],
    },
  },
];
