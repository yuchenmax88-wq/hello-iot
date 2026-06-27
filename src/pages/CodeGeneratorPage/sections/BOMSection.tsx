import { useMemo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Check, ClipboardList, Package, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { COMPONENT_LIBRARY } from '@/data/components';
import { getPlatformById } from '@/data/platforms';
import type { IComponentInstance } from '@/types/iot';

interface BOMSectionProps {
  components: IComponentInstance[];
  platform: string;
}

// 元件参考价格（人民币，仅供参考）
const PRICE_MAP: Record<string, string> = {
  led: '¥0.10',
  button: '¥0.30',
  potentiometer: '¥1.50',
  buzzer: '¥1.00',
  dht11: '¥5.00',
  dht22: '¥8.00',
  ldr: '¥1.00',
  hcsr04: '¥4.00',
  pir: '¥3.50',
  soil_moisture: '¥2.50',
  relay: '¥3.00',
  servo: '¥6.00',
  dc_motor: '¥8.00',
  stepper_motor: '¥12.00',
  rgb_led: '¥1.50',
  oled_128x64: '¥15.00',
  lcd1602_i2c: '¥12.00',
};

interface IBOMItem {
  type: string;
  name: string;
  category: string;
  description: string;
  count: number;
  instances: IComponentInstance[];
  pinLabels: Record<string, string>;
  price: string;
}

function formatPinLabel(pin: number, platformId: string): string {
  const p = getPlatformById(platformId);
  if (p?.analogPins?.includes(pin)) return `A${pin}`;
  return `D${pin}`;
}

export default function BOMSection({ components, platform }: BOMSectionProps) {
  const [copied, setCopied] = useState(false);
  const [showDetail, setShowDetail] = useState(true);
  const { t } = useT();

  const getCategoryLabel = useCallback((cat: string): string => t(`library.category.${cat}` as any), [t]);

  // 按元件类型汇总
  const bomItems = useMemo<IBOMItem[]>(() => {
    const typeMap = new Map<string, IComponentInstance[]>();
    components.forEach((c) => {
      const arr = typeMap.get(c.type) || [];
      arr.push(c);
      typeMap.set(c.type, arr);
    });

    return Array.from(typeMap.entries())
      .map(([type, instances]) => {
        const def = COMPONENT_LIBRARY.find((d) => d.type === type);
        return {
          type,
          name: t(`component.${type}.name`) || def?.name || type,
          category: def?.category || 'basic',
          description: t(`component.${type}.desc`) || def?.description || '',
          count: instances.length,
          instances,
          pinLabels: def?.pinLabels || {},
          price: PRICE_MAP[type] || '—',
        };
      })
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [components, t]);

  const totalTypes = bomItems.length;
  const totalCount = components.length;
  const totalPrice = useMemo(() => {
    let sum = 0;
    bomItems.forEach((item) => {
      const priceStr = PRICE_MAP[item.type];
      if (priceStr && priceStr.startsWith('¥')) {
        sum += parseFloat(priceStr.slice(1)) * item.count;
      }
    });
    return sum > 0 ? `¥${sum.toFixed(2)}` : '—';
  }, [bomItems]);

  // 生成 CSV
  const csvContent = useMemo(() => {
    const header = `${t('bom.colIndex')},${t('bom.colName')},${t('bom.colType')},${t('bom.colCategory')},${t('bom.colQty')},${t('bom.colPins')},${t('bom.colDesc')},${t('bom.colPrice')}`;
    const rows = bomItems.map((item, i) => {
      const pinsStr = item.instances
        .map((inst) =>
          Object.entries(inst.pins)
            .filter(([, v]) => v !== undefined && v !== -1)
            .map(([k, v]) => `${item.pinLabels[k] || k}:${formatPinLabel(v, platform)}`)
            .join('; '),
        )
        .join(' | ');
      return [
        i + 1,
        `"${item.name}"`,
        item.type,
        getCategoryLabel(item.category),
        item.count,
        `"${pinsStr || t('bom.unconfigured')}"`,
        `"${item.description}"`,
        item.price,
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }, [bomItems, platform]);

  // 生成纯文本清单
  const textContent = useMemo(() => {
    const lines: string[] = [
      '═══════════════════════════════════',
      `  ${t('bom.header')}`,
      '═══════════════════════════════════',
      `  ${t('bom.summaryTypes', { n: totalTypes })}`,
      `  ${t('bom.summaryTotal', { n: totalCount })}`,
      `  ${t('bom.summaryPrice', { price: totalPrice })}`,
      '───────────────────────────────────',
      '',
    ];
    bomItems.forEach((item, i) => {
      lines.push(t('bom.itemLine', { index: i + 1, name: item.name, count: item.count, category: getCategoryLabel(item.category), price: item.price }));
      lines.push(`   ${item.description}`);
      item.instances.forEach((inst) => {
        const pins = Object.entries(inst.pins)
          .filter(([, v]) => v !== undefined && v !== -1)
          .map(([k, v]) => `${item.pinLabels[k] || k}: ${formatPinLabel(v, platform)}`)
          .join(', ');
        lines.push(`   └─ ${inst.name}${pins ? ` (${pins})` : ` (${t('bom.unconfiguredPins')})`}`);
      });
      lines.push('');
    });
    lines.push('───────────────────────────────────');
    lines.push(`  ${t('bom.footer', { types: totalTypes, total: totalCount, price: totalPrice })}`);
    return lines.join('\n');
  }, [bomItems, totalTypes, totalCount, totalPrice, platform]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      toast.success(t('bom.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('bom.copyFail'));
    }
  }, [textContent]);

  const handleExportCSV = useCallback(() => {
    const bom = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(bom);
    const a = document.createElement('a');
    a.href = url;
    a.download = t('bom.csvFilename');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('bom.csvDownloaded'));
  }, [csvContent]);

  if (components.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent/30 mb-4">
          <ClipboardList className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mb-1">{t('bom.noComponents')}</p>
        <p className="text-xs text-muted-foreground/60">
          {t('bom.noComponentsHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* 顶部摘要卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card/60 border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-chart-2/15">
              <Layers className="size-4 text-chart-2" />
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-foreground">{totalTypes}</div>
              <div className="text-[11px] text-muted-foreground">{t('bom.types')}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-chart-1/15">
              <Package className="size-4 text-chart-1" />
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-foreground">{totalCount}</div>
              <div className="text-[11px] text-muted-foreground">{t('bom.total')}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/15">
              <span className="text-sm font-bold text-success">¥</span>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-foreground">{totalPrice}</div>
              <div className="text-[11px] text-muted-foreground">{t('bom.estimatedPrice')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{t('bom.title')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => setShowDetail((v) => !v)}
          >
            {showDetail ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            {showDetail ? t('bom.collapseDetails') : t('bom.expandDetails')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-[11px]"
            onClick={handleCopyText}
          >
            {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
            {t('bom.copyList')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-[11px]"
            onClick={handleExportCSV}
          >
            <Download className="size-3" />
            {t('bom.exportCSV')}
          </Button>
        </div>
      </div>

      {/* BOM 表格 */}
      <Card className="border-border bg-card/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-10 text-[11px] text-muted-foreground whitespace-nowrap">{t('bom.colIndex')}</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground whitespace-nowrap">{t('bom.colName')}</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground whitespace-nowrap">{t('bom.colCategory')}</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground whitespace-nowrap text-center">{t('bom.colQty')}</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground whitespace-nowrap">{t('bom.colPins')}</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground whitespace-nowrap text-right">{t('bom.colPrice')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bomItems.map((item, idx) => (
                  <TableRow
                    key={item.type}
                    className="border-border/30 hover:bg-accent/20 transition-colors"
                  >
                    <TableCell className="text-xs text-muted-foreground font-mono tabular-nums">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        {showDetail && (
                          <span className="text-[10px] text-muted-foreground/70 line-clamp-1">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 whitespace-nowrap">
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="text-xs font-mono tabular-nums h-5 min-w-[28px] justify-center"
                      >
                        ×{item.count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {item.instances.map((inst) => {
                          const pins = Object.entries(inst.pins).filter(
                            ([, v]) => v !== undefined && v !== -1,
                          );
                          return (
                            <div key={inst.id} className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-foreground/80 font-medium truncate max-w-[100px]">
                                {inst.name}
                              </span>
                              {pins.length > 0 ? (
                                <span className="text-muted-foreground font-mono">
                                  {pins
                                    .map(
                                      ([k, v]) =>
                                        `${item.pinLabels[k] || k}:${formatPinLabel(v, platform)}`,
                                    )
                                    .join(', ')}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50 italic">{t('bom.unconfigured')}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs font-mono tabular-nums text-muted-foreground">
                        {item.price}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 底部合计 */}
      <div className="flex items-center justify-between rounded-md border border-border/50 bg-card/40 px-4 py-2.5">
        <span className="text-xs text-muted-foreground">
          {t('bom.footer', { types: totalTypes, total: totalCount, price: totalPrice })}
        </span>
      </div>

      {/* 提示 */}
      <p className="text-[10px] text-muted-foreground/50 text-center">
        {t('bom.priceNote')}
      </p>
    </div>
  );
}
