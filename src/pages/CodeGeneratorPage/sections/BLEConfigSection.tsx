import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bluetooth, BluetoothOff, Info, Copy, RefreshCw, Monitor, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { IBLEConfig } from '@/types/iot';

// ---- 支持蓝牙的平台 ID 列表 ----
const BLE_SUPPORTED_PLATFORMS = [
  'esp32',
  'esp32_s3',
  'esp32_c3',
];

// ---- 默认 UUID ----
const DEFAULT_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const DEFAULT_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

// ---- Props ----
interface BLEConfigSectionProps {
  platform: string;
  bleConfig: IBLEConfig | undefined;
  onBLEConfigChange: (config: IBLEConfig) => void;
}

export default function BLEConfigSection({
  platform,
  bleConfig,
  onBLEConfigChange,
}: BLEConfigSectionProps) {
  const supportsBLE = BLE_SUPPORTED_PLATFORMS.includes(platform);
  const { t } = useT();

  const [deviceName, setDeviceName] = useState(bleConfig?.deviceName || 'ESP32-BLE');
  const [serviceUUID, setServiceUUID] = useState(bleConfig?.serviceUUID || DEFAULT_SERVICE_UUID);
  const [characteristicUUID, setCharacteristicUUID] = useState(
    bleConfig?.characteristicUUID || DEFAULT_CHARACTERISTIC_UUID,
  );
  const [codeMode, setCodeMode] = useState<'auto' | 'custom'>(bleConfig?.codeMode || 'auto');
  const [customCode, setCustomCode] = useState(bleConfig?.customCode || '');

  const hasChanges = useMemo(() => {
    if (!bleConfig) return deviceName !== '' || serviceUUID !== '' || characteristicUUID !== '';
    return (
      deviceName !== bleConfig.deviceName ||
      serviceUUID !== bleConfig.serviceUUID ||
      characteristicUUID !== bleConfig.characteristicUUID ||
      codeMode !== (bleConfig.codeMode || 'auto') ||
      customCode !== (bleConfig.customCode || '')
    );
  }, [deviceName, serviceUUID, characteristicUUID, codeMode, customCode, bleConfig]);

  const handleSave = useCallback(() => {
    if (!deviceName.trim()) {
      toast.error(t('ble.deviceNameRequired'));
      return;
    }
    onBLEConfigChange({
      deviceName: deviceName.trim(),
      serviceUUID: serviceUUID.trim() || DEFAULT_SERVICE_UUID,
      characteristicUUID: characteristicUUID.trim() || DEFAULT_CHARACTERISTIC_UUID,
      codeMode,
      customCode: codeMode === 'custom' ? customCode : undefined,
    });
    toast.success(t('ble.saved'));
  }, [deviceName, serviceUUID, characteristicUUID, codeMode, customCode, onBLEConfigChange, t]);

  const handleReset = useCallback(() => {
    setDeviceName('ESP32-BLE');
    setServiceUUID(DEFAULT_SERVICE_UUID);
    setCharacteristicUUID(DEFAULT_CHARACTERISTIC_UUID);
    setCodeMode('auto');
    setCustomCode('');
    toast.info(t('ble.resetDone'));
  }, [t]);

  const handleCopyUUID = useCallback(async (uuid: string, label: string) => {
    try {
      await navigator.clipboard.writeText(uuid);
      toast.success(t('ble.copied', { label }));
    } catch {
      toast.error(t('ble.copyFail'));
    }
  }, []);

  const handleGenerateUUID = useCallback(() => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    setServiceUUID(uuid);
  }, []);

  // ---- 不支持蓝牙的平台 ----
  if (!supportsBLE) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
          <BluetoothOff className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mb-1">{t('ble.notSupported')}</p>
        <p className="text-xs text-muted-foreground/60 max-w-[280px]">
          {t('ble.notSupportedHint')}
        </p>
      </motion.div>
    );
  }

  return (
    <TooltipProvider delayDuration={400}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        {/* 蓝牙状态指示 */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex size-6 items-center justify-center rounded bg-chart-3/15">
            <Bluetooth className="size-3.5 text-chart-3" />
          </div>
          <span className="text-xs font-medium text-foreground">{t('ble.title')}</span>
          <Badge variant="outline" className="ml-auto border-chart-3/30 bg-chart-3/10 text-[10px] text-chart-3">
            {bleConfig ? t('ble.configured') : t('ble.unconfigured')}
          </Badge>
        </div>

        {/* 设备名称 */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('ble.deviceName')}</CardTitle>
            <CardDescription className="text-xs">
              {t('ble.deviceNameHint')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder={t('ble.deviceNamePlaceholder')}
              className="h-9 text-sm bg-background"
              maxLength={20}
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground">
               {t('ble.deviceNameHint')}
            </p>
          </CardContent>
        </Card>

        {/* 服务 UUID */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{t('ble.serviceUUID')}</CardTitle>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={handleGenerateUUID}
                    >
                      <RefreshCw className="size-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">{t('ble.generateUUID')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopyUUID(serviceUUID, t('ble.serviceUUID'))}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">{t('ble.copyUUID')}</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <CardDescription className="text-xs">
              {t('ble.serviceUUIDHint')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={serviceUUID}
              onChange={(e) => setServiceUUID(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="h-9 text-sm bg-background font-mono text-xs"
            />
          </CardContent>
        </Card>

        {/* 特征值 UUID */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{t('ble.charUUID')}</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopyUUID(characteristicUUID, t('ble.charUUID'))}
                  >
                    <Copy className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">{t('ble.copyUUID')}</TooltipContent>
              </Tooltip>
            </div>
            <CardDescription className="text-xs">
              {t('ble.charUUIDHint')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={characteristicUUID}
              onChange={(e) => setCharacteristicUUID(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="h-9 text-sm bg-background font-mono text-xs"
            />
          </CardContent>
        </Card>

        {/* 代码预览提示 */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Info className="size-3.5 text-chart-3" />
               {t('ble.generatedCode')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-background p-3 font-mono text-[11px] leading-relaxed text-foreground/80 overflow-x-auto">
              <code>{`#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

#define SERVICE_UUID "${serviceUUID || DEFAULT_SERVICE_UUID}"
#define CHAR_UUID    "${characteristicUUID || DEFAULT_CHARACTERISTIC_UUID}"

BLECharacteristic *pCharacteristic;

void setupBLE() {
  BLEDevice::init("${deviceName || 'ESP32-BLE'}");
  BLEServer *pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    CHAR_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE
  );
  pCharacteristic->setValue("Hello BLE");
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();
  Serial.println("${t('ble.bleStarted')}");
}`}</code>
            </pre>
          </CardContent>
        </Card>

        {/* 代码模式 */}
        <div className="space-y-2 rounded-md border border-border p-3">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">{t('ble.codeMode')}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[260px] text-xs">
                <p className="font-medium">{t('ble.codeModeAutoTitle')}</p>
                <p className="text-muted-foreground mt-0.5">{t('ble.codeModeAutoDesc')}</p>
                <p className="font-medium mt-1.5">{t('ble.codeModeCustomTitle')}</p>
                <p className="text-muted-foreground mt-0.5">{t('ble.codeModeCustomDesc')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex gap-2">
            <Button
              variant={codeMode !== 'custom' ? 'secondary' : 'outline'}
              size="sm"
              className="h-8 text-xs gap-1.5 flex-1"
              onClick={() => setCodeMode('auto')}
            >
              <Monitor className="size-3.5" />
              {t('ble.codeModeAuto')}
            </Button>
            <Button
              variant={codeMode === 'custom' ? 'secondary' : 'outline'}
              size="sm"
              className="h-8 text-xs gap-1.5 flex-1"
              onClick={() => setCodeMode('custom')}
            >
              <Code2 className="size-3.5" />
              {t('ble.codeModeCustom')}
            </Button>
          </div>
          {codeMode === 'custom' && (
            <Textarea
              className="text-xs min-h-[80px] resize-none font-mono bg-muted"
              placeholder={t('ble.customPlaceholder')}
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              rows={4}
            />
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Bluetooth className="size-3.5" />
            {t('ble.save')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={handleReset}
          >
            {t('ble.reset')}
          </Button>
          {bleConfig && (
            <Badge variant="outline" className="ml-auto border-success/30 bg-success/10 text-[10px] text-success">
              {t('common.save')}
            </Badge>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
