import { useState, useMemo, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, GripVertical, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { PLATFORMS, getPlatformById } from '@/data/platforms';
import { COMPONENT_LIBRARY } from '@/data/components';
import type { IComponentInstance } from '@/types/iot';

interface PinConfigSectionProps {
  components: IComponentInstance[];
  platform: string;
  validationErrors: string[];
  onUpdateComponent: (updated: IComponentInstance) => void;
  onRemoveComponent: (id: string) => void;
}

/** 获取元件定义 */
function getComponentDef(type: string) {
  return COMPONENT_LIBRARY.find((d) => d.type === type);
}

/** 获取平台所有可用引脚 */
function getAvailablePins(platformId: string): number[] {
  const platformDef = getPlatformById(platformId);
  if (!platformDef) return [];
  const pins = new Set<number>();
  (platformDef.digitalPins || []).forEach((p) => pins.add(p));
  (platformDef.analogPins || []).forEach((p) => pins.add(p));
  return Array.from(pins).sort((a, b) => a - b);
}

/** 检测引脚冲突 */
function getPinConflicts(components: IComponentInstance[]): Map<number, string[]> {
  const usage = new Map<number, string[]>();
  for (const comp of components) {
    for (const [role, pin] of Object.entries(comp.pins)) {
      if (pin === undefined || pin === -1) continue;
      if (!usage.has(pin)) usage.set(pin, []);
      usage.get(pin)!.push(`${comp.name || comp.type}.${role}`);
    }
  }
  const conflicts = new Map<number, string[]>();
  for (const [pin, users] of usage) {
    if (users.length > 1) conflicts.set(pin, users);
  }
  return conflicts;
}

export default function PinConfigSection({
  components,
  platform,
  validationErrors,
  onUpdateComponent,
  onRemoveComponent,
}: PinConfigSectionProps) {
  const platformDef = getPlatformById(platform);

  const availablePins = useMemo(() => getAvailablePins(platform), [platform]);
  const conflicts = useMemo(() => getPinConflicts(components), [components]);
  const { t } = useT();

  function handlePinChange(compId: string, pinRole: string, value: string) {
    const comp = components.find((c) => c.id === compId);
    if (!comp) return;
    const pinNum = parseInt(value, 10);
    if (isNaN(pinNum)) return;
    onUpdateComponent({
      ...comp,
      pins: { ...comp.pins, [pinRole]: pinNum },
    });
  }

  function handleNameChange(compId: string, name: string) {
    const comp = components.find((c) => c.id === compId);
    if (!comp) return;
    onUpdateComponent({ ...comp, name });
  }

  function handleDelete(id: string) {
    onRemoveComponent(id);
    toast.success(t('pins.removed'));
  }

  function isPinConflict(pin: number): boolean {
    return conflicts.has(pin);
  }

  function getConflictMessage(pin: number): string {
    const users = conflicts.get(pin);
    if (!users) return '';
    return t('pins.conflictWith', { users: users.join('、') });
  }

  if (components.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center mb-4">
          <Plus className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mb-1">{t('pins.noComponents')}</p>
        <p className="text-xs text-muted-foreground/60">
          {t('pins.addHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 状态摘要 */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground px-1">
        <span>
          {t('pins.componentCount', { n: components.length })}
        </span>
        {conflicts.size > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="size-3" />
            <span>{t('pins.conflictCount', { n: conflicts.size })}</span>
          </span>
        )}
      </div>

      {/* 元件卡片列表 */}
      <AnimatePresence mode="popLayout">
        {components.map((comp) => {
          const def = getComponentDef(comp.type);
          const pinRoles = Object.keys(comp.pins);
          const pinLabels = def?.pinLabels || {};

          return (
            <motion.div
              key={comp.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-lg border border-border bg-card/60 overflow-hidden"
            >
              {/* 元件头部 */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
                <GripVertical className="size-3.5 text-muted-foreground shrink-0 cursor-grab" />
                <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-5">
                  {t(`component.${comp.type}.name`)}
                </Badge>
                <Input
                  value={comp.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleNameChange(comp.id, e.target.value)
                  }
                  className="flex-1 h-7 text-xs border-0 bg-transparent px-1 focus-visible:ring-0 focus-visible:bg-accent/30 rounded"
                  placeholder={t('pins.componentName')}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="删除元件"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('pins.confirmDelete')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('pins.deleteConfirm', { name: comp.name || comp.type })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(comp.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* 引脚配置行 */}
              <div className="px-3 py-2 space-y-2">
                {pinRoles.map((role) => {
                  const pinValue = comp.pins[role];
                  const hasConflict = pinValue !== undefined && pinValue !== -1 && isPinConflict(pinValue);
                  const label = t(`component.${comp.type}.pin.${role}`) || pinLabels[role] || role.toUpperCase();

                  return (
                    <div key={role} className="flex items-center gap-2">
                      <Label className="w-20 shrink-0 text-xs text-muted-foreground truncate">
                        {label}
                      </Label>
                      <div className="flex-1 relative">
                        <Select
                          value={pinValue !== undefined && pinValue !== -1 ? String(pinValue) : ''}
                          onValueChange={(v) => handlePinChange(comp.id, role, v)}
                        >
                          <SelectTrigger
                            className={`h-8 text-xs ${
                              hasConflict
                                ? 'border-destructive ring-1 ring-destructive/40 bg-destructive/8'
                                : ''
                            }`}
                          >
                            <SelectValue placeholder={t('pins.selectPin')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">{t('pins.unconfigured')}</SelectItem>
                            {availablePins.map((pin) => (
                              <SelectItem key={pin} value={String(pin)}>
                                {platformDef?.analogPins?.includes(pin)
                                  ? `A${pin}`
                                  : `D${pin}`}
                                {isPinConflict(pin) && (
                                  <span className="ml-2 text-destructive text-[10px]">
                                    {t('pins.conflict')}
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {hasConflict && (
                        <span className="text-[10px] text-destructive shrink-0 leading-tight max-w-[80px]">
                          {getConflictMessage(pinValue!)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
