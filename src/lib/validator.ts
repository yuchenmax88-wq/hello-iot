// EXPORTS: checkFeasibility, type IValidationResult, type IValidationError, type IValidationWarning

import type { IProjectConfig, IComponentInstance, ILogicBlock } from '@/types/iot';
import { PLATFORMS, type IPlatform } from '@/data/platforms';
import { COMPONENT_LIBRARY, type IComponentMeta } from '@/data/components';

export interface IValidationError {
  type: 'pin_conflict' | 'platform_incompatible' | 'logic_incomplete' | 'missing_config';
  message: string;
  detail?: string;
  componentIds?: string[];
  pinNumbers?: number[];
}

export interface IValidationWarning {
  type: 'unused_pin' | 'no_logic' | 'no_components' | 'unconfigured_pin';
  message: string;
  detail?: string;
}

export interface IValidationResult {
  valid: boolean;
  errors: IValidationError[];
  warnings: IValidationWarning[];
}

/**
 * 检查引脚是否在平台可用范围内
 */
function isPinAvailable(pin: number, platform: IPlatform): boolean {
  if (platform.digitalPins && platform.digitalPins.includes(pin)) return true;
  if (platform.analogPins && platform.analogPins.includes(pin)) return true;
  return false;
}

/**
 * 检查引脚冲突 — 多个元件占用同一个引脚
 */
function checkPinConflicts(
  components: IComponentInstance[],
  platform: IPlatform
): IValidationError[] {
  const errors: IValidationError[] = [];
  const pinUsage: Map<number, IComponentInstance[]> = new Map();

  for (const comp of components) {
    for (const pin of Object.values(comp.pins)) {
      if (pin === -1 || pin === undefined) continue; // 未配置的引脚跳过
      if (!pinUsage.has(pin)) {
        pinUsage.set(pin, []);
      }
      pinUsage.get(pin)!.push(comp);
    }
  }

  for (const [pin, comps] of pinUsage) {
    if (comps.length > 1) {
      errors.push({
        type: 'pin_conflict',
        message: `引脚 ${pin} 被 ${comps.length} 个元件同时占用`,
        detail: `冲突元件: ${comps.map(c => c.name || c.type).join('、')}`,
        componentIds: comps.map(c => c.id),
        pinNumbers: [pin],
      });
    }
  }

  return errors;
}

/**
 * 检查平台兼容性 — 引脚是否超出平台范围、元件是否支持该平台
 */
function checkPlatformCompatibility(
  components: IComponentInstance[],
  platform: IPlatform,
  componentDefs: IComponentMeta[]
): IValidationError[] {
  const errors: IValidationError[] = [];
  const defMap = new Map(componentDefs.map(d => [d.type, d]));

  for (const comp of components) {
    const def = defMap.get(comp.type);
    if (!def) continue;

    // 所有元件默认兼容所有平台（平台兼容性由引脚范围检查覆盖）

    // 检查引脚是否在平台可用范围内
    for (const [pinRole, pinNumber] of Object.entries(comp.pins)) {
      if (pinNumber === -1 || pinNumber === undefined) continue;
      if (!isPinAvailable(pinNumber, platform)) {
        errors.push({
          type: 'platform_incompatible',
          message: `元件 "${comp.name || comp.type}" 的 ${pinRole} 引脚 (${pinNumber}) 超出 ${platform.name} 可用范围`,
          detail: `可用数字引脚: ${platform.digitalPins?.join(', ') || '无'}，可用模拟引脚: ${platform.analogPins?.join(', ') || '无'}`,
          componentIds: [comp.id],
          pinNumbers: [pinNumber],
        });
      }
    }
  }

  return errors;
}

/**
 * 检查逻辑完整性 — 逻辑块是否关联了有效的元件、逻辑链是否完整
 */
function checkLogicCompleteness(
  logicBlocks: ILogicBlock[],
  components: IComponentInstance[]
): IValidationError[] {
  const errors: IValidationError[] = [];
  const componentIds = new Set(components.map(c => c.id));

  for (const block of logicBlocks) {
    // 检查 read_sensor / control_actuator 是否关联了有效元件
    if (block.type === 'read_sensor' || block.type === 'control_actuator') {
      if (!block.triggerComponentId) {
        errors.push({
          type: 'logic_incomplete',
          message: `逻辑块 "${block.type}" 未关联任何元件`,
          detail: '请选择一个传感器或执行器元件',
        });
      } else if (!componentIds.has(block.triggerComponentId)) {
        errors.push({
          type: 'logic_incomplete',
          message: `逻辑块 "${block.type}" 关联的元件不存在或已被删除`,
          detail: '请重新选择元件',
        });
      }
    }

    // 检查 condition 类型是否设置了触发条件
    if (block.type === 'condition') {
      if (!block.triggerCondition && !block.triggerComponentId) {
        errors.push({
          type: 'logic_incomplete',
          message: '条件判断逻辑块未设置触发条件',
          detail: '请设置触发条件（如温度 > 30）或关联触发元件',
        });
      }
    }

    // 检查 delay 类型是否设置了延时毫秒数
    if (block.type === 'delay') {
      if (block.config.delayMs === undefined || block.config.delayMs === null) {
        errors.push({
          type: 'missing_config',
          message: '延时逻辑块未设置延时毫秒数',
          detail: '请在配置中设置 delayMs 参数',
        });
      }
    }

    // 检查 loop 类型是否设置了循环次数
    if (block.type === 'loop') {
      if (block.config.iterations === undefined || block.config.iterations === null) {
        errors.push({
          type: 'missing_config',
          message: '循环逻辑块未设置循环次数',
          detail: '请在配置中设置 iterations 参数',
        });
      }
    }
  }

  return errors;
}

/**
 * 检查未配置引脚的元件 (warning)
 */
function checkUnconfiguredPins(components: IComponentInstance[]): IValidationWarning[] {
  const warnings: IValidationWarning[] = [];

  for (const comp of components) {
    const unconfigured = Object.entries(comp.pins).filter(
      ([, pin]) => pin === -1 || pin === undefined
    );
    if (unconfigured.length > 0) {
      warnings.push({
        type: 'unconfigured_pin',
        message: `元件 "${comp.name || comp.type}" 有 ${unconfigured.length} 个引脚未配置`,
        detail: `未配置引脚: ${unconfigured.map(([role]) => role).join(', ')}`,
      });
    }
  }

  return warnings;
}

/**
 * 检查空项目 (warning)
 */
function checkEmptyProject(
  components: IComponentInstance[],
  logicBlocks: ILogicBlock[]
): IValidationWarning[] {
  const warnings: IValidationWarning[] = [];

  if (components.length === 0) {
    warnings.push({
      type: 'no_components',
      message: '当前项目未添加任何元件',
      detail: '请从左侧元件库添加元件到项目中',
    });
  }

  if (logicBlocks.length === 0 && components.length > 0) {
    warnings.push({
      type: 'no_logic',
      message: '当前项目未配置任何逻辑块',
      detail: '请在逻辑配置标签页中添加程序逻辑',
    });
  }

  return warnings;
}

/**
 * 完整可行性检查
 * @param config 项目配置
 * @param platform 当前选择的平台定义
 * @param componentDefs 元件定义列表
 * @returns 检查结果，包含 errors 和 warnings
 */
export function checkFeasibility(
  config: IProjectConfig,
  platform: IPlatform,
  componentDefs: IComponentMeta[]
): IValidationResult {
  const errors: IValidationError[] = [];
  const warnings: IValidationWarning[] = [];

  // 1. 引脚冲突检测
  errors.push(...checkPinConflicts(config.components, platform));

  // 2. 平台兼容性检查
  errors.push(...checkPlatformCompatibility(config.components, platform, componentDefs));

  // 3. 逻辑完整性检查
  errors.push(...checkLogicCompleteness(config.logicBlocks, config.components));

  // 4. 未配置引脚警告
  warnings.push(...checkUnconfiguredPins(config.components));

  // 5. 空项目警告
  warnings.push(...checkEmptyProject(config.components, config.logicBlocks));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
