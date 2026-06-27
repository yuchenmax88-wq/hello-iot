import { useMemo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Code, AlertTriangle, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';

interface StatusBarSectionProps {
  componentCount: number;
  logicBlockCount: number;
  pinConflictCount: number;
  validationResult: { errors: string[]; warnings: string[] } | null;
  onCheck: () => void;
  onDownload: () => void;
}

export default function StatusBarSection({
  componentCount,
  logicBlockCount,
  pinConflictCount,
  validationResult,
  onCheck,
  onDownload,
}: StatusBarSectionProps) {
  const totalErrors = validationResult?.errors.length || 0;
  const totalWarnings = validationResult?.warnings.length || 0;
  const { t } = useT();

  const handleCheck = useCallback(() => {
    onCheck();
  }, [onCheck]);

  const handleDownload = useCallback(() => {
    onDownload();
  }, [onDownload]);

  return (
    <footer className="w-full border-t border-border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-12 px-4">
        {/* 左侧：状态统计 */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Info className="size-3.5" />
            <span>
              {t('status.components', { n: componentCount })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Code className="size-3.5" />
            <span>
              {t('status.logicBlocks', { n: logicBlockCount })}
            </span>
          </div>

          {pinConflictCount > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs h-5">
              <XCircle className="size-3" />
              {t('status.conflicts', { n: pinConflictCount })}
            </Badge>
          )}
          {totalWarnings > 0 && totalErrors === 0 && (
            <Badge variant="outline" className="gap-1 text-xs h-5 border-warning/40 text-warning">
              <AlertTriangle className="size-3" />
              {t('status.suggestions', { n: totalWarnings })}
            </Badge>
          )}
          {totalErrors === 0 && totalWarnings === 0 && componentCount > 0 && (
            <Badge variant="outline" className="gap-1 text-xs h-5 border-success/40 text-success">
              <CheckCircle className="size-3" />
              {t('status.ready')}
            </Badge>
          )}
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleCheck}
          >
            <CheckCircle className="size-3.5" />
            {t('status.check')}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleDownload}
          >
            <Download className="size-3.5" />
            {t('status.download')}
          </Button>
        </div>
      </div>
    </footer>
  );
}
