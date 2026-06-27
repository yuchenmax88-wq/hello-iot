import { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  Repeat,
  Clock,
  Thermometer,
  Cog,
  Terminal,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  AlertCircle,
  Zap,
  MessageSquare,
  Code2,
  Wifi,
  Bluetooth,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { ILogicBlock, IComponentInstance } from '@/types/iot';
import { useT } from '@/i18n';

// ---- 逻辑块类型定义 ----
interface ILogicBlockDef {
  type: ILogicBlock['type'];
  label: string;
  description: string;
  icon: typeof GitBranch;
  color: string;
  bgColor: string;
  isContainer: boolean; // 是否可包含子块
}

const LOGIC_BLOCK_DEFS: ILogicBlockDef[] = [
  { type: 'read_sensor', label: '读取传感器', description: '读取已添加传感器的数据', icon: Thermometer, color: 'text-chart-2', bgColor: 'bg-chart-2/10', isContainer: false },
  { type: 'condition', label: '条件判断', description: '根据条件执行不同分支', icon: GitBranch, color: 'text-chart-1', bgColor: 'bg-chart-1/10', isContainer: true },
  { type: 'loop', label: '循环', description: '重复执行指定次数', icon: Repeat, color: 'text-chart-3', bgColor: 'bg-chart-3/10', isContainer: true },
  { type: 'delay', label: '延时', description: '暂停执行指定毫秒数', icon: Clock, color: 'text-chart-4', bgColor: 'bg-chart-4/10', isContainer: false },
  { type: 'control_actuator', label: '控制执行器', description: '控制 LED、继电器、舵机等', icon: Cog, color: 'text-warning', bgColor: 'bg-warning/10', isContainer: false },
  { type: 'serial_output', label: '串口输出', description: '通过串口打印调试信息', icon: Terminal, color: 'text-chart-5', bgColor: 'bg-chart-5/10', isContainer: false },
  { type: 'wifi_connect', label: 'WiFi 连接', description: '连接 WiFi 网络', icon: Wifi, color: 'text-info', bgColor: 'bg-info/10', isContainer: false },
  { type: 'ble_send', label: '蓝牙发送', description: '通过蓝牙发送数据', icon: Bluetooth, color: 'text-chart-4', bgColor: 'bg-chart-4/10', isContainer: false },
  { type: 'comment', label: '注释', description: '添加代码注释说明', icon: MessageSquare, color: 'text-muted-foreground', bgColor: 'bg-muted/50', isContainer: false },
  { type: 'custom_code', label: '自定义代码', description: '直接编写原生代码', icon: Code2, color: 'text-chart-5', bgColor: 'bg-chart-5/10', isContainer: false },
];

const OPERATOR_OPTIONS = [
  { value: '>', label: '大于 (>)' },
  { value: '<', label: '小于 (<)' },
  { value: '>=', label: '大于等于 (>=)' },
  { value: '<=', label: '小于等于 (<=)' },
  { value: '==', label: '等于 (==)' },
  { value: '!=', label: '不等于 (!=)' },
  { value: 'pressed', label: '按钮按下' },
  { value: 'released', label: '按钮释放' },
];

const ACTUATOR_ACTIONS: Record<string, { value: string; label: string }[]> = {
  led: [{ value: 'on', label: '点亮' }, { value: 'off', label: '熄灭' }, { value: 'toggle', label: '切换' }],
  relay: [{ value: 'on', label: '闭合' }, { value: 'off', label: '断开' }, { value: 'toggle', label: '切换' }],
  servo: [{ value: '0', label: '0°' }, { value: '45', label: '45°' }, { value: '90', label: '90°' }, { value: '135', label: '135°' }, { value: '180', label: '180°' }],
  dc_motor: [{ value: 'forward', label: '正转' }, { value: 'reverse', label: '反转' }, { value: 'stop', label: '停止' }],
  buzzer: [{ value: 'on', label: '鸣响' }, { value: 'off', label: '静音' }],
  rgb_led: [{ value: 'red', label: '红色' }, { value: 'green', label: '绿色' }, { value: 'blue', label: '蓝色' }, { value: 'off', label: '熄灭' }],
};

interface LogicConfigSectionProps {
  logicBlocks: ILogicBlock[];
  components: IComponentInstance[];
  onLogicBlocksChange: (blocks: ILogicBlock[]) => void;
  platformSupportsWiFi: boolean;
  platformSupportsBLE: boolean;
}

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `logic-${Date.now()}-${idCounter}`;
}

// ---- 递归渲染单个逻辑块（含子块） ----
const BlockNode = memo(function BlockNode({
  block,
  depth,
  components,
  sensorComponents,
  actuatorComponents,
  onChange,
  onDelete,
  onAddChild,
  onDeleteChild,
  onUpdateChild,
  blockDefs,
}: {
  block: ILogicBlock;
  depth: number;
  components: IComponentInstance[];
  sensorComponents: IComponentInstance[];
  actuatorComponents: IComponentInstance[];
  onChange: (updated: ILogicBlock) => void;
  onDelete: () => void;
  onAddChild: (parentId: string, type: ILogicBlock['type']) => void;
  onDeleteChild: (parentId: string, childIndex: number) => void;
  onUpdateChild: (parentId: string, childIndex: number, updated: ILogicBlock) => void;
  blockDefs: ILogicBlockDef[];
}) {
  const { t } = useT();
  const def = blockDefs.find((d) => d.type === block.type);
  const Icon = def?.icon || Zap;
  const [expanded, setExpanded] = useState(true);
  const isContainer = def?.isContainer || false;
  const children = block.children || [];

  const handleConfigChange = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...block, config: { ...block.config, [key]: value } });
    },
    [block, onChange],
  );

  const handleTriggerComponentChange = useCallback(
    (componentId: string) => {
      onChange({ ...block, triggerComponentId: componentId || undefined });
    },
    [block, onChange],
  );

  const handleConditionParamChange = useCallback(
    (key: string, value: string) => {
      const config = { ...block.config, [key]: value };
      const op = (key === 'operator' ? value : config.operator) || '>';
      const th = (key === 'threshold' ? value : config.threshold) || '0';
      const fd = (key === 'field' ? value : config.field) || 'temperature';
      if (op === 'pressed' || op === 'released') {
        onChange({ ...block, config, triggerCondition: `button_${op}` });
      } else if (fd && th) {
        onChange({ ...block, config, triggerCondition: `${fd} ${op} ${th}` });
      } else {
        onChange({ ...block, config });
      }
    },
    [block, onChange],
  );

  const borderColor = isContainer
    ? 'border-l-[3px] border-l-primary/60'
    : 'border-l-[3px] border-l-transparent';

  return (
    <div className={`${depth > 0 ? 'ml-5' : ''}`}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={`rounded-md border border-border bg-card/60 overflow-hidden ${borderColor} ${isContainer ? 'shadow-sm' : ''}`}
      >
        {/* 头部 */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <GripVertical className="size-3.5 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
          <div className={`size-6 rounded flex items-center justify-center shrink-0 ${def?.bgColor || 'bg-muted'}`}>
            <Icon className={`size-3.5 ${def?.color || 'text-muted-foreground'}`} />
          </div>
          <span className="text-sm font-medium truncate flex-1">{t(`logic.blocks.${block.type}`)}</span>

          {block.triggerComponentId && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0 hidden sm:inline-flex">
              {components.find((c) => c.id === block.triggerComponentId)?.name || t('common.unknown')}
            </Badge>
          )}

          {isContainer && children.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
              {children.length}
            </Badge>
          )}

          <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => setExpanded(!expanded)}>
            <ChevronDown className={`size-3.5 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
          </Button>

          <Button variant="ghost" size="icon" className="size-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        {/* 配置区 */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-0 space-y-2.5 border-t border-border/50">
                {/* 读取传感器 */}
                {block.type === 'read_sensor' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('logic.selectSensor')}</Label>
                    <Select value={block.triggerComponentId || ''} onValueChange={handleTriggerComponentChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={t('logic.selectSensor')} />
                      </SelectTrigger>
                      <SelectContent>
                        {sensorComponents.length === 0 ? (
                          <div className="px-2 py-3 text-xs text-muted-foreground text-center">{t('logic.noSensor')}</div>
                        ) : (
                          sensorComponents.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">{c.name || c.type}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 条件判断 */}
                {block.type === 'condition' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('logic.triggerCondition')}</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <Select value={(block.config.field as string) || 'temperature'} onValueChange={(v) => handleConditionParamChange('field', v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="temperature" className="text-xs">{t('logic.conditionField.temperature')}</SelectItem>
                          <SelectItem value="humidity" className="text-xs">{t('logic.conditionField.humidity')}</SelectItem>
                          <SelectItem value="light" className="text-xs">{t('logic.conditionField.light')}</SelectItem>
                          <SelectItem value="distance" className="text-xs">{t('logic.conditionField.distance')}</SelectItem>
                          <SelectItem value="moisture" className="text-xs">{t('logic.conditionField.moisture')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={(block.config.operator as string) || '>'} onValueChange={(v) => handleConditionParamChange('operator', v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OPERATOR_OPTIONS.map((op) => (
                            <SelectItem key={op.value} value={op.value} className="text-xs">{t(`logic.operator.${op.value}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(block.config.operator as string) !== 'pressed' && (block.config.operator as string) !== 'released' && (
                        <Input type="number" className="h-8 text-xs" placeholder={t('logic.threshold')} value={(block.config.threshold as string) || ''} onChange={(e) => handleConditionParamChange('threshold', e.target.value)} />
                      )}
                    </div>
                  </div>
                )}

                {/* 循环 */}
                {block.type === 'loop' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{t('logic.loopVar')}</Label>
                        <Input className="h-8 text-xs" placeholder="i" value={(block.config.varName as string) || 'i'} onChange={(e) => handleConfigChange('varName', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{t('logic.loopCount')}</Label>
                        <Input type="number" className="h-8 text-xs" placeholder="5" min={1} value={(block.config.count as number | string) ?? 5} onChange={(e) => handleConfigChange('count', Math.max(1, parseInt(e.target.value) || 1))} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 延时 */}
                {block.type === 'delay' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('logic.delayMs')}</Label>
                    <Input type="number" className="h-8 text-xs" placeholder="1000" min={0} value={(block.config.milliseconds as number | string) ?? 1000} onChange={(e) => handleConfigChange('milliseconds', Math.max(0, parseInt(e.target.value) || 0))} />
                    <div className="flex gap-1.5 flex-wrap">
                      {[100, 500, 1000, 2000, 5000].map((ms) => (
                        <Badge key={ms} variant="outline" className="text-[10px] h-5 px-1.5 cursor-pointer hover:bg-accent" onClick={() => handleConfigChange('milliseconds', ms)}>
                          {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 控制执行器 */}
                {block.type === 'control_actuator' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('logic.selectActuator')}</Label>
                    <Select value={block.triggerComponentId || ''} onValueChange={handleTriggerComponentChange}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t('logic.selectActuator')} /></SelectTrigger>
                      <SelectContent>
                        {actuatorComponents.length === 0 ? (
                          <div className="px-2 py-3 text-xs text-muted-foreground text-center">{t('logic.noActuator')}</div>
                        ) : (
                          actuatorComponents.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">{c.name || c.type}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {block.triggerComponentId && (() => {
                      const comp = components.find((c) => c.id === block.triggerComponentId);
                      const actions = comp ? (ACTUATOR_ACTIONS[comp.type] || [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }]) : [];
                      return (
                        <>
                          <Label className="text-xs text-muted-foreground">{t('logic.action')}</Label>
                          <Select value={(block.config.action as string) || actions[0]?.value || 'on'} onValueChange={(v) => handleConfigChange('action', v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {actions.map((a) => (<SelectItem key={a.value} value={a.value} className="text-xs">{t(`logic.action.${a.value}`)}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          {comp?.type === 'servo' && (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t('logic.angle')}</Label>
                              <Input type="number" className="h-8 text-xs" min={0} max={180} value={(block.config.angle as number | string) ?? 90} onChange={(e) => handleConfigChange('angle', Math.min(180, Math.max(0, parseInt(e.target.value) || 0)))} />
                            </div>
                          )}
                          {comp?.type === 'dc_motor' && (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t('logic.speed')}</Label>
                              <Input type="number" className="h-8 text-xs" min={0} max={255} value={(block.config.speed as number | string) ?? 128} onChange={(e) => handleConfigChange('speed', Math.min(255, Math.max(0, parseInt(e.target.value) || 0)))} />
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* 串口输出 */}
                {block.type === 'serial_output' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('logic.outputContent')}</Label>
                    <Textarea className="text-xs min-h-[48px] resize-none" placeholder={t('logic.outputPlaceholder')} value={(block.config.message as string) || ''} onChange={(e) => handleConfigChange('message', e.target.value)} rows={2} />
                    <div className="flex gap-1 flex-wrap">
                      {['{temperature}', '{humidity}', '{light}', '{distance}', '{state}'].map((v) => (
                        <Badge key={v} variant="outline" className="text-[10px] h-5 px-1.5 cursor-pointer hover:bg-accent font-mono" onClick={() => { const cur = (block.config.message as string) || ''; handleConfigChange('message', cur + v); }}>{v}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* WiFi 连接 */}
                {block.type === 'wifi_connect' && (
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">SSID</Label>
                      <Input className="h-8 text-xs" placeholder={t('logic.wifiSSID')} value={(block.config.ssid as string) || ''} onChange={(e) => handleConfigChange('ssid', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t('logic.wifiPassword')}</Label>
                      <Input className="h-8 text-xs" type="password" placeholder={t('logic.wifiPassword')} value={(block.config.password as string) || ''} onChange={(e) => handleConfigChange('password', e.target.value)} />
                    </div>
                  </div>
                )}

                {/* 蓝牙发送 */}
                {block.type === 'ble_send' && (
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t('logic.bleData')}</Label>
                      <Input className="h-8 text-xs" placeholder={t('logic.blePlaceholder')} value={(block.config.data as string) || ''} onChange={(e) => handleConfigChange('data', e.target.value)} />
                    </div>
                  </div>
                )}

                {/* 注释 */}
                {block.type === 'comment' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('logic.commentContent')}</Label>
                    <Textarea className="text-xs min-h-[40px] resize-none italic text-muted-foreground" placeholder={t('logic.commentPlaceholder')} value={(block.config.text as string) || ''} onChange={(e) => handleConfigChange('text', e.target.value)} rows={2} />
                  </div>
                )}

                {/* 自定义代码 */}
                {block.type === 'custom_code' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('logic.customCode')}</Label>
                    <Textarea className="text-xs min-h-[60px] resize-none font-mono bg-[hsl(160_8%_6%)]" placeholder="digitalWrite(LED_PIN, HIGH);" value={(block.config.code as string) || ''} onChange={(e) => handleConfigChange('code', e.target.value)} rows={3} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 容器块：子块区域 */}
        {isContainer && expanded && (
          <div className="border-t border-border/50">
            <div className="px-3 py-2 space-y-1.5">
              {/* 已有子块 */}
              <AnimatePresence mode="popLayout">
                {children.map((child, childIdx) => (
                  <BlockNode
                    key={child.id}
                    block={child}
                    depth={depth + 1}
                    components={components}
                    sensorComponents={sensorComponents}
                    actuatorComponents={actuatorComponents}
                    blockDefs={blockDefs}
                    onChange={(updated) => onUpdateChild(block.id, childIdx, updated)}
                    onDelete={() => onDeleteChild(block.id, childIdx)}
                    onAddChild={onAddChild}
                    onDeleteChild={onDeleteChild}
                    onUpdateChild={onUpdateChild}
                  />
                ))}
              </AnimatePresence>

              {/* 添加子块按钮 */}
              <div className="flex flex-wrap gap-1 pt-1">
                {blockDefs.filter((d) => d.type !== 'condition' && d.type !== 'loop').map((d) => {
                  const DIcon = d.icon;
                  return (
                    <button
                      key={d.type}
                      type="button"
                      onClick={() => onAddChild(block.id, d.type)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border border-border/60 hover:border-primary/40 hover:bg-accent/30 transition-all ${d.color}`}
                    >
                      <DIcon className="size-3" />
                      {t(`logic.blocks.${d.type}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
});

// ---- 主组件 ----
export default memo(function LogicConfigSection({
  logicBlocks,
  components,
  onLogicBlocksChange,
  platformSupportsWiFi,
  platformSupportsBLE,
}: LogicConfigSectionProps) {
  const { t } = useT();
  const sensorComponents = useMemo(
    () => components.filter((c) => ['dht11', 'dht22', 'ldr', 'hcsr04', 'pir', 'soil_moisture', 'potentiometer', 'button'].includes(c.type)),
    [components],
  );

  const actuatorComponents = useMemo(
    () => components.filter((c) => ['led', 'relay', 'servo', 'dc_motor', 'buzzer', 'rgb_led', 'stepper_motor'].includes(c.type)),
    [components],
  );

  // Filter available logic blocks based on platform capabilities and project components
  const availableBlockDefs = useMemo(() => {
    return LOGIC_BLOCK_DEFS.filter((def) => {
      if (def.type === 'wifi_connect') return platformSupportsWiFi;
      if (def.type === 'ble_send') return platformSupportsBLE;
      if (def.type === 'read_sensor') return sensorComponents.length > 0;
      if (def.type === 'control_actuator') return actuatorComponents.length > 0;
      return true;
    });
  }, [platformSupportsWiFi, platformSupportsBLE, sensorComponents.length, actuatorComponents.length]);

  // 添加顶层逻辑块
  const handleAddBlock = useCallback(
    (type: ILogicBlock['type']) => {
      const newBlock: ILogicBlock = { id: generateId(), type, config: {} };
      switch (type) {
        case 'delay': newBlock.config = { milliseconds: 1000 }; break;
        case 'loop': newBlock.config = { count: 5, varName: 'i' }; newBlock.children = []; break;
        case 'condition': newBlock.config = { field: 'temperature', operator: '>', threshold: '30' }; newBlock.triggerCondition = 'temperature > 30'; newBlock.children = []; break;
        case 'serial_output': newBlock.config = { message: 'Hello IoT!' }; break;
        case 'wifi_connect': newBlock.config = { ssid: '', password: '' }; break;
        case 'ble_send': newBlock.config = { data: '' }; break;
        case 'comment': newBlock.config = { text: '' }; break;
        case 'custom_code': newBlock.config = { code: '' }; break;
        default: break;
      }
      onLogicBlocksChange([...logicBlocks, newBlock]);
      toast.success(t('logic.added', { label: t(`logic.blocks.${type}`) }));
    },
    [logicBlocks, onLogicBlocksChange, t],
  );

  // 更新顶层逻辑块
  const handleBlockChange = useCallback(
    (index: number, updated: ILogicBlock) => {
      const next = [...logicBlocks];
      next[index] = updated;
      onLogicBlocksChange(next);
    },
    [logicBlocks, onLogicBlocksChange],
  );

  // 删除顶层逻辑块
  const handleDeleteBlock = useCallback(
    (index: number) => {
      onLogicBlocksChange(logicBlocks.filter((_, i) => i !== index));
    },
    [logicBlocks, onLogicBlocksChange],
  );

  // 在容器块内添加子块
  const handleAddChild = useCallback(
    (parentId: string, type: ILogicBlock['type']) => {
      const newChild: ILogicBlock = { id: generateId(), type, config: {}, parentId };
      switch (type) {
        case 'delay': newChild.config = { milliseconds: 1000 }; break;
        case 'serial_output': newChild.config = { message: '' }; break;
        case 'wifi_connect': newChild.config = { ssid: '', password: '' }; break;
        case 'ble_send': newChild.config = { data: '' }; break;
        case 'comment': newChild.config = { text: '' }; break;
        case 'custom_code': newChild.config = { code: '' }; break;
        default: break;
      }
      const next = logicBlocks.map((b) => {
        if (b.id === parentId) {
          return { ...b, children: [...(b.children || []), newChild] };
        }
        return b;
      });
      onLogicBlocksChange(next);
    },
    [logicBlocks, onLogicBlocksChange],
  );

  // 删除容器块内的子块
  const handleDeleteChild = useCallback(
    (parentId: string, childIndex: number) => {
      const next = logicBlocks.map((b) => {
        if (b.id === parentId) {
          const children = [...(b.children || [])];
          children.splice(childIndex, 1);
          return { ...b, children };
        }
        return b;
      });
      onLogicBlocksChange(next);
    },
    [logicBlocks, onLogicBlocksChange],
  );

  // 更新容器块内的子块
  const handleUpdateChild = useCallback(
    (parentId: string, childIndex: number, updated: ILogicBlock) => {
      const next = logicBlocks.map((b) => {
        if (b.id === parentId) {
          const children = [...(b.children || [])];
          children[childIndex] = updated;
          return { ...b, children };
        }
        return b;
      });
      onLogicBlocksChange(next);
    },
    [logicBlocks, onLogicBlocksChange],
  );

  // 统计总块数（含嵌套）
  const totalBlocks = useMemo(() => {
    let count = logicBlocks.length;
    logicBlocks.forEach((b) => {
      if (b.children) count += b.children.length;
    });
    return count;
  }, [logicBlocks]);

  return (
    <div className="flex flex-col h-full">
      {/* 逻辑块库 */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('logic.palette')}</span>
          <span className="text-[10px] text-muted-foreground/60">{t('logic.paletteHint')}</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {availableBlockDefs.map((def) => {
            const DIcon = def.icon;
            const label = t(`logic.blocks.${def.type}`);
            return (
              <button
                key={def.type}
                type="button"
                onClick={() => handleAddBlock(def.type)}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md border border-border/60 hover:border-primary/40 hover:bg-accent/30 transition-all duration-150 group cursor-pointer`}
                title={t(`logic.blockHint.${def.type}`)}
              >
                <div className={`size-6 rounded flex items-center justify-center ${def.bgColor} group-hover:scale-110 transition-transform duration-150`}>
                  <DIcon className={`size-3 ${def.color}`} />
                </div>
                <span className="text-[9px] leading-tight text-center text-muted-foreground group-hover:text-foreground transition-colors">
                  {label}
                </span>
                {def.isContainer && (
                  <span className="text-[8px] text-primary/60">{t('logic.container')}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 px-3"><div className="border-t border-border/50" /></div>

      {/* 已添加逻辑块列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {logicBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center">
              <GitBranch className="size-5 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('logic.noBlocks')}</p>
              <p className="text-xs text-muted-foreground/60 max-w-[200px]">{t('logic.noBlocksHint')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {logicBlocks.map((block, index) => (
                <BlockNode
                  key={block.id}
                  block={block}
                  depth={0}
                  components={components}
                  sensorComponents={sensorComponents}
                  actuatorComponents={actuatorComponents}
                  blockDefs={availableBlockDefs}
                  onChange={(updated) => handleBlockChange(index, updated)}
                  onDelete={() => handleDeleteBlock(index)}
                  onAddChild={handleAddChild}
                  onDeleteChild={handleDeleteChild}
                  onUpdateChild={handleUpdateChild}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 底部统计 */}
      {logicBlocks.length > 0 && (
        <div className="shrink-0 px-3 py-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <AlertCircle className="size-3" />
            <span>{t('logic.stats', { total: totalBlocks, top: logicBlocks.length })}</span>
          </div>
        </div>
      )}
    </div>
  );
});
