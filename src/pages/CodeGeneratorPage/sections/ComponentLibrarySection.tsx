import { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  Plus,
  Zap,
  Thermometer,
  Cog,
  Monitor,
  Lightbulb,
  ToggleLeft,
  SlidersHorizontal,
  Volume2,
  ThermometerSun,
  Sun,
  Radio,
  Eye,
  Droplets,
  Power,
  Crosshair,
  Gauge,
  RotateCw,
  Palette,
  RectangleHorizontal,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { COMPONENT_CATEGORIES, COMPONENT_LIBRARY } from '@/data/components';
import type { IComponentMeta } from '@/data/components';
import { useT } from '@/i18n';

// ---- 元件图标映射 ----
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Lightbulb,
  ToggleLeft,
  SlidersHorizontal,
  Volume2,
  Thermometer,
  ThermometerSun,
  Sun,
  Radio,
  Eye,
  Droplets,
  Power,
  Crosshair,
  Gauge,
  RotateCw,
  Palette,
  Monitor,
  RectangleHorizontal,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || Zap;
}

// ---- Props ----
interface ComponentLibrarySectionProps {
  onAddComponent: (meta: IComponentMeta) => void;
  onBatchAddComponents: (metas: IComponentMeta[]) => void;
  addedComponentTypes: string[];
}

// ---- 元件卡片 ----
const ComponentCard = memo(function ComponentCard({
  meta,
  isAdded,
  addedCount,
  isSelected,
  multiMode,
  onToggleSelect,
  onAdd,
}: {
  meta: IComponentMeta;
  isAdded: boolean;
  addedCount: number;
  isSelected: boolean;
  multiMode: boolean;
  onToggleSelect: (type: string) => void;
  onAdd: (meta: IComponentMeta) => void;
}) {
  const { t } = useT();
  const Icon = getIcon(meta.icon);
  const displayName = t(`component.${meta.type}.name`);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (multiMode) {
              if (!isAdded) onToggleSelect(meta.type);
            } else {
              onAdd(meta);
            }
          }}
          className={`
            group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left
            transition-colors duration-150 cursor-pointer
            ${isAdded
              ? 'bg-accent/30 text-foreground/80 hover:bg-accent hover:text-accent-foreground'
              : 'bg-card text-foreground hover:bg-accent hover:text-accent-foreground'
            }
          `}
        >
          {/* 左侧铜箔金指示条 */}
          <div
            className={`
              absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full
              transition-all duration-200
              ${isAdded
                ? 'bg-success/60'
                : isSelected
                  ? 'bg-primary h-5'
                  : 'bg-primary/0 group-hover:bg-primary group-hover:h-5'
              }
            `}
          />

          {/* 多选复选框 */}
          {multiMode && !isAdded && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {isSelected ? (
                <CheckSquare className="size-4 text-primary" />
              ) : (
                <Square className="size-4 text-muted-foreground/50" />
              )}
            </div>
          )}

          <Icon
            className={`size-4 shrink-0 ${isAdded ? 'text-success' : isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}
          />
          <span className="flex-1 truncate text-xs font-medium">{displayName}</span>
          {isAdded && (
            <Badge
              variant="outline"
              className="shrink-0 border-success/40 bg-success/10 px-1.5 py-0 text-[10px] leading-none text-success"
            >
              ×{addedCount}
            </Badge>
          )}
          {isAdded && (
            <Plus className="size-3 shrink-0 text-success/70 transition-colors group-hover:text-success" />
          )}
          {!isAdded && !multiMode && (
            <Plus className="size-3 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[200px] text-xs">
        <p className="font-medium">{displayName}</p>
        <p className="text-muted-foreground">{t(`component.${meta.type}.desc`)}</p>
        {Object.keys(meta.defaultPins).length > 0 && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t('library.pinTooltip', {
              pins: Object.entries(meta.pinLabels).map(([k]) => t(`component.${meta.type}.pin.${k}`)).join(', '),
              defaults: Object.entries(meta.defaultPins).map(([k, v]) => `${t(`component.${meta.type}.pin.${k}`)}:${v}`).join(', '),
            })}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
});

// ---- 分类折叠面板 ----
const CategoryGroup = memo(function CategoryGroup({
  category,
  components,
  addedTypes,
  selectedTypes,
  multiMode,
  onToggleSelect,
  onAdd,
  defaultExpanded,
}: {
  category: { key: string; label: string; icon: string };
  components: IComponentMeta[];
  addedTypes: string[];
  selectedTypes: Set<string>;
  multiMode: boolean;
  onToggleSelect: (type: string) => void;
  onAdd: (meta: IComponentMeta) => void;
  defaultExpanded: boolean;
}) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const CatIcon = getIcon(category.icon);

  const addedCount = components.filter((c) => addedTypes.includes(c.type)).length;
  const selectedCount = components.filter((c) => selectedTypes.has(c.type) && !addedTypes.includes(c.type)).length;

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/30"
      >
        <CatIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-xs font-semibold text-foreground/80">{t(`library.category.${category.key}`)}</span>
        {addedCount > 0 && (
          <Badge variant="outline" className="shrink-0 border-success/30 bg-success/10 px-1.5 py-0 text-[10px] leading-none text-success">
            {addedCount}
          </Badge>
        )}
        {selectedCount > 0 && (
          <Badge variant="outline" className="shrink-0 border-primary/30 bg-primary/10 px-1.5 py-0 text-[10px] leading-none text-primary">
            +{selectedCount}
          </Badge>
        )}
        <span className="text-[10px] text-muted-foreground">{components.length}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            expanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 px-2 pb-2">
              {components.map((meta) => (
                <ComponentCard
                  key={meta.type}
                  meta={meta}
                  isAdded={addedTypes.includes(meta.type)}
                  addedCount={addedTypes.filter((t) => t === meta.type).length}
                  isSelected={selectedTypes.has(meta.type)}
                  multiMode={multiMode}
                  onToggleSelect={onToggleSelect}
                  onAdd={onAdd}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ---- 主组件 ----
export default memo(function ComponentLibrarySection({
  onAddComponent,
  onBatchAddComponents,
  addedComponentTypes,
}: ComponentLibrarySectionProps) {
  const { t } = useT();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [multiMode, setMultiMode] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const addedSet = useMemo(() => new Set(addedComponentTypes), [addedComponentTypes]);

  // 按分类分组 + 搜索过滤
  const groupedComponents = useMemo(() => {
    const filtered = searchKeyword.trim()
      ? COMPONENT_LIBRARY.filter(
          (c) =>
            c.name.includes(searchKeyword) ||
            c.description.includes(searchKeyword) ||
            c.type.includes(searchKeyword.toLowerCase()),
        )
      : COMPONENT_LIBRARY;

    return COMPONENT_CATEGORIES.map((cat) => ({
      category: cat,
      components: filtered.filter((c) => c.category === cat.key),
    })).filter((g) => g.components.length > 0);
  }, [searchKeyword]);

  // 可多选的元件（未添加的）
  const selectableTypes = useMemo(() => {
    const types: string[] = [];
    groupedComponents.forEach((g) => {
      g.components.forEach((c) => {
        if (!addedSet.has(c.type)) types.push(c.type);
      });
    });
    return types;
  }, [groupedComponents, addedSet]);

  const totalAdded = addedComponentTypes.length;

  const handleToggleSelect = useCallback((type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedTypes(new Set(selectableTypes));
  }, [selectableTypes]);

  const handleInvertSelect = useCallback(() => {
    setSelectedTypes((prev) => {
      const next = new Set<string>();
      selectableTypes.forEach((t) => {
        if (!prev.has(t)) next.add(t);
      });
      return next;
    });
  }, [selectableTypes]);

  const handleClearSelect = useCallback(() => {
    setSelectedTypes(new Set());
  }, []);

  const handleBatchAdd = useCallback(() => {
    if (selectedTypes.size === 0) {
      toast.info(t('library.selectFirst'));
      return;
    }
    const metas = COMPONENT_LIBRARY.filter((c) => selectedTypes.has(c.type));
    onBatchAddComponents(metas);
    setSelectedTypes(new Set());
    setMultiMode(false);
    toast.success(t('library.batchAdded', { n: metas.length }));
  }, [selectedTypes, onBatchAddComponents]);

  const handleSingleAdd = useCallback((meta: IComponentMeta) => {
    onAddComponent(meta);
  }, [onAddComponent]);

  const handleToggleMultiMode = useCallback(() => {
    setMultiMode((prev) => {
      if (prev) setSelectedTypes(new Set());
      return !prev;
    });
  }, []);

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-full flex-col bg-card">
        {/* 面板标题 */}
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-primary/15">
              <Zap className="size-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">{t('library.title')}</span>
          </div>
          {totalAdded > 0 && (
            <Badge variant="secondary" className="text-[10px]">
               {t('library.selected', { n: totalAdded })}
            </Badge>
          )}
        </div>

        {/* 搜索框 */}
        <div className="border-b border-border/50 px-3 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={t('library.search')}
              className="h-8 bg-background pl-8 pr-2 text-xs placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* 多选工具栏 */}
        <div className="flex items-center gap-0.5 border-b border-border/50 px-1.5 py-1.5 flex-wrap">
          <Button
            variant={multiMode ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 gap-0.5 px-1.5 text-[10px]"
            onClick={handleToggleMultiMode}
          >
            <Layers className="size-3" />
            {t('library.multiSelect')}
          </Button>
          {multiMode && (
            <>
              <div className="mx-0.5 h-3 w-px bg-border" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[9px]"
                onClick={handleSelectAll}
              >
                {t('library.selectAll')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[9px]"
                onClick={handleInvertSelect}
              >
                {t('library.invert')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[9px]"
                onClick={handleClearSelect}
              >
                {t('library.clear')}
              </Button>
              <div className="flex-1" />
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary ml-auto">
                {selectedTypes.size}
              </Badge>
            </>
          )}
        </div>

        {/* 元件列表 */}
        <div className="flex-1 overflow-y-auto">
          {groupedComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Search className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{t('library.noMatch')}</p>
              <p className="text-[11px] text-muted-foreground/60">{t('library.tryOther')}</p>
            </div>
          ) : (
            groupedComponents.map(({ category, components }) => (
              <CategoryGroup
                key={category.key}
                category={category}
                components={components}
                addedTypes={addedComponentTypes}
                selectedTypes={selectedTypes}
                multiMode={multiMode}
                onToggleSelect={handleToggleSelect}
                onAdd={handleSingleAdd}
                defaultExpanded={searchKeyword.trim() !== '' || category.key === 'basic'}
              />
            ))
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-border/50 px-3 py-2">
          {multiMode && selectedTypes.size > 0 ? (
            <Button
              size="sm"
              className="h-8 w-full gap-1.5 text-xs"
              onClick={handleBatchAdd}
            >
              <Plus className="size-3.5" />
                {t('library.batchAdd', { n: selectedTypes.size })}
            </Button>
          ) : (
            <p className="text-[10px] leading-relaxed text-muted-foreground/60">
              {multiMode ? t('library.batchHint') : t('library.selectHint')}
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
});
