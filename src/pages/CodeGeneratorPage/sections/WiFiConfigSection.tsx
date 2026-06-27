import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Lock, Globe, Server, Shield, Info, Monitor, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { IWiFiConfig } from '@/types/iot';

interface WiFiConfigSectionProps {
  wifiConfig: IWiFiConfig | undefined;
  platformId: string;
  onWiFiConfigChange: (config: IWiFiConfig) => void;
}

const WIFI_CAPABLE_PLATFORMS = [
  'esp32', 'esp32_s3', 'esp32_c3', 'esp32_s2', 'esp8266',
];

function isWiFiCapable(platformId: string): boolean {
  return WIFI_CAPABLE_PLATFORMS.includes(platformId);
}

const DEFAULT_WIFI_CONFIG: IWiFiConfig = {
  ssid: '',
  password: '',
  mode: 'STA',
};

export default memo(function WiFiConfigSection({
  wifiConfig,
  platformId,
  onWiFiConfigChange,
}: WiFiConfigSectionProps) {
  const [showPassword, setShowPassword] = useState(false);

  const config = wifiConfig || DEFAULT_WIFI_CONFIG;
  const { t } = useT();

  const capable = isWiFiCapable(platformId);

  const handleChange = useCallback(
    (key: keyof IWiFiConfig, value: string) => {
      onWiFiConfigChange({ ...config, [key]: value });
    },
    [config, onWiFiConfigChange],
  );

  const handleClear = useCallback(() => {
    onWiFiConfigChange({ ...DEFAULT_WIFI_CONFIG });
    toast.info(t('wifi.cleared'));
  }, [onWiFiConfigChange]);

  if (!capable) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-12 px-4 text-center"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
          <WifiOff className="size-5 text-muted-foreground" />
        </div>
         <p className="text-sm text-muted-foreground mb-1">{t('wifi.notSupported')}</p>
        <p className="text-xs text-muted-foreground/60">
          {t('wifi.notSupportedHint')}
        </p>
      </motion.div>
    );
  }

  return (
    <TooltipProvider delayDuration={400}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* 状态指示 */}
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-chart-2/15">
            <Wifi className="size-4 text-chart-2" />
          </div>
           <span className="text-sm font-semibold text-foreground">{t('wifi.title')}</span>
          {config.ssid ? (
            <Badge variant="outline" className="border-chart-2/30 bg-chart-2/10 text-chart-2 text-[10px]">
              {t('wifi.configured')}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {t('wifi.unconfigured')}
            </Badge>
          )}
        </div>

        {/* 工作模式 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">{t('wifi.mode')}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px] text-xs">
                <p>{t('wifi.modeSTA')}</p>
                <p>{t('wifi.modeAP')}</p>
                <p>{t('wifi.modeSTAAP')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={config.mode}
            onValueChange={(v) => handleChange('mode', v as IWiFiConfig['mode'])}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STA" className="text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="size-3.5 text-chart-2" />
                  {t('wifi.modeSTA')}
                </div>
              </SelectItem>
              <SelectItem value="AP" className="text-xs">
                <div className="flex items-center gap-2">
                  <Server className="size-3.5 text-chart-1" />
                  {t('wifi.modeAP')}
                </div>
              </SelectItem>
              <SelectItem value="STA_AP" className="text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="size-3.5 text-chart-3" />
                  {t('wifi.modeSTAAP')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* SSID */}
        {(config.mode === 'STA' || config.mode === 'STA_AP') && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('wifi.ssid')}</Label>
            <div className="relative">
              <Wifi className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={config.ssid}
                onChange={(e) => handleChange('ssid', e.target.value)}
                placeholder={t('wifi.ssidPlaceholder')}
                className="h-9 pl-9 text-xs"
              />
            </div>
          </div>
        )}

        {/* 密码 */}
        {(config.mode === 'STA' || config.mode === 'STA_AP') && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('wifi.password')}</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={config.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={t('wifi.passwordPlaceholder')}
                className="h-9 pl-9 pr-16 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="!absolute right-1 top-1/2 z-20 h-7 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? t('common.hide') : t('common.show')}
              </Button>
            </div>
          </div>
        )}

        {/* AP 模式配置 */}
        {(config.mode === 'AP' || config.mode === 'STA_AP') && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('wifi.apSSID')}</Label>
            <Input
              type="text"
              value={config.apSSID || ''}
              onChange={(e) => handleChange('apSSID', e.target.value)}
              placeholder={t('wifi.apSSIDHint')}
              className="h-9 text-xs"
            />
          </div>
        )}

        {/* 静态 IP（可选） */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t('wifi.staticIP')}</Label>
          <Input
            type="text"
            value={config.staticIP || ''}
            onChange={(e) => handleChange('staticIP', e.target.value)}
            placeholder={t('wifi.staticIPPlaceholder')}
            className="h-9 text-xs font-mono"
          />
        </div>

        {/* 网关 */}
        {config.staticIP && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('wifi.gateway')}</Label>
            <Input
              type="text"
              value={config.gateway || ''}
              onChange={(e) => handleChange('gateway', e.target.value)}
              placeholder={t('wifi.gatewayPlaceholder')}
              className="h-9 text-xs font-mono"
            />
          </div>
        )}

        {/* 子网掩码 */}
        {config.staticIP && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('wifi.subnet')}</Label>
            <Input
              type="text"
              value={config.subnet || ''}
              onChange={(e) => handleChange('subnet', e.target.value)}
              placeholder={t('wifi.subnetPlaceholder')}
              className="h-9 text-xs font-mono"
            />
          </div>
        )}

        {/* 代码模式 */}
        <div className="space-y-2 rounded-md border border-border p-3">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">{t('wifi.codeMode')}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[260px] text-xs">
                <p className="font-medium">{t('wifi.codeModeAutoTitle')}</p>
                <p className="text-muted-foreground mt-0.5">{t('wifi.codeModeAutoDesc')}</p>
                <p className="font-medium mt-1.5">{t('wifi.codeModeCustomTitle')}</p>
                <p className="text-muted-foreground mt-0.5">{t('wifi.codeModeCustomDesc')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex gap-2">
            <Button
              variant={config.codeMode !== 'custom' ? 'secondary' : 'outline'}
              size="sm"
              className="h-8 text-xs gap-1.5 flex-1"
              onClick={() => handleChange('codeMode', 'auto')}
            >
              <Monitor className="size-3.5" />
              {t('wifi.codeModeAuto')}
            </Button>
            <Button
              variant={config.codeMode === 'custom' ? 'secondary' : 'outline'}
              size="sm"
              className="h-8 text-xs gap-1.5 flex-1"
              onClick={() => handleChange('codeMode', 'custom')}
            >
              <Code2 className="size-3.5" />
              {t('wifi.codeModeCustom')}
            </Button>
          </div>
          {config.codeMode === 'custom' && (
            <Textarea
              className="text-xs min-h-[80px] resize-none font-mono bg-muted"
              placeholder={t('wifi.customPlaceholder')}
              value={config.customCode || ''}
              onChange={(e) => handleChange('customCode', e.target.value)}
              rows={4}
            />
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleClear}
          >
            <WifiOff className="size-3.5" />
            {t('wifi.clear')}
          </Button>
          {config.ssid && (
            <span className="text-[10px] text-muted-foreground">
               {t('wifi.willConnect', { ssid: config.ssid })}
            </span>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
});
