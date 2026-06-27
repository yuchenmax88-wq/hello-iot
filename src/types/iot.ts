// EXPORTS: IPlatform, IComponentDef, IComponentInstance, ILogicBlock, IProjectConfig, IWiFiConfig, IBLEConfig

export interface IPlatform {
  id: string;
  name: string;
  group: string;
  digitalPins: number[];
  analogPins: number[];
  libraries: string[];
  description: string;
}

export interface IComponentDef {
  id: string;
  name: string;
  category: 'basic' | 'sensor' | 'actuator' | 'display';
  defaultPins: Record<string, number>;
  libraries: string[];
  description: string;
  compatiblePlatforms: string[];
}

export interface IComponentInstance {
  id: string;
  type: string;
  name: string;
  pins: Record<string, number>;
}

export interface ILogicBlock {
  id: string;
  type: 'condition' | 'loop' | 'delay' | 'read_sensor' | 'control_actuator' | 'serial_output' | 'comment' | 'custom_code' | 'wifi_connect' | 'ble_send';
  config: Record<string, unknown>;
  triggerComponentId?: string;
  triggerCondition?: string;
  /** 嵌套子块（条件/循环块内部） */
  children?: ILogicBlock[];
  /** 父块 ID */
  parentId?: string;
}

export interface IWiFiConfig {
  ssid: string;
  password: string;
  mode: 'STA' | 'AP' | 'STA_AP';
  apSSID?: string;
  staticIP?: string;
  gateway?: string;
  subnet?: string;
  codeMode?: 'auto' | 'custom';
  customCode?: string;
}

export interface IBLEConfig {
  deviceName: string;
  serviceUUID: string;
  characteristicUUID: string;
  codeMode?: 'auto' | 'custom';
  customCode?: string;
}

export interface IProjectConfig {
  platform: string;
  components: IComponentInstance[];
  logicBlocks: ILogicBlock[];
  wifiConfig?: IWiFiConfig;
  bleConfig?: IBLEConfig;
}
