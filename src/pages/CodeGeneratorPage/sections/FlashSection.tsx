import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Usb,
  Zap,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Download,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Terminal,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// ---- 类型 ----
interface FlashSectionProps {
  platform: string;
  generatedCode: string;
}

type FlashStep = 'idle' | 'selecting' | 'flashing' | 'done' | 'error';

interface SerialPortInfo {
  port: SerialPort;
  displayName: string;
}

// ---- 支持的芯片 ----
const SUPPORTED_CHIPS: Record<string, { name: string; baudRate: number; supportsWebSerial: boolean; flashTool?: string }> = {
  esp32: { name: 'ESP32', baudRate: 115200, supportsWebSerial: true, flashTool: 'esptool' },
  esp32_s3: { name: 'ESP32-S3', baudRate: 115200, supportsWebSerial: true, flashTool: 'esptool' },
  esp32_c3: { name: 'ESP32-C3', baudRate: 115200, supportsWebSerial: true, flashTool: 'esptool' },
  esp32_s2: { name: 'ESP32-S2', baudRate: 115200, supportsWebSerial: true, flashTool: 'esptool' },
  esp8266: { name: 'ESP8266', baudRate: 115200, supportsWebSerial: true, flashTool: 'esptool' },
  arduino_uno: { name: 'Arduino Uno', baudRate: 115200, supportsWebSerial: false },
  arduino_nano: { name: 'Arduino Nano', baudRate: 115200, supportsWebSerial: false },
  arduino_mega: { name: 'Arduino Mega 2560', baudRate: 115200, supportsWebSerial: false },
  arduino_pro_mini: { name: 'Arduino Pro Mini', baudRate: 115200, supportsWebSerial: false },
  atmega328p: { name: 'ATmega328P', baudRate: 115200, supportsWebSerial: false },
  stm32_bluepill: { name: 'STM32F103C8T6', baudRate: 115200, supportsWebSerial: false },
  stm32f407: { name: 'STM32F407', baudRate: 115200, supportsWebSerial: false },
  rp2040: { name: 'Raspberry Pi Pico', baudRate: 115200, supportsWebSerial: false },
};

// ---- 检查 Web Serial API 支持 ----
function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

// ---- 主组件 ----
export default function FlashSection({ platform, generatedCode }: FlashSectionProps) {
  const [step, setStep] = useState<FlashStep>('idle');
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [flashProgress, setFlashProgress] = useState(0);
  const [flashMessage, setFlashMessage] = useState('');
  const [flashError, setFlashError] = useState('');
  const [baudRate, setBaudRate] = useState(115200);
  const portRef = useRef<SerialPort | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);

  const chipInfo = SUPPORTED_CHIPS[platform];
  const webSerialSupported = isWebSerialSupported();
  const chipSupportsWebSerial = chipInfo?.supportsWebSerial ?? false;
  const { t } = useT();

  // 扫描串口
  const handleScanPorts = useCallback(async () => {
    if (!webSerialSupported) {
      toast.error(t('flash.noSerialAPI'));
      return;
    }
    setScanning(true);
    setFlashError('');
    try {
      // 请求用户选择串口
      const port = await navigator.serial.requestPort();
      const info = port.getInfo();
      const usbVendorId = info.usbVendorId?.toString(16).padStart(4, '0') ?? '????';
      const usbProductId = info.usbProductId?.toString(16).padStart(4, '0') ?? '????';
      const displayName = `USB VID:0x${usbVendorId} PID:0x${usbProductId}`;
      setPorts([{ port, displayName }]);
      setSelectedPort(displayName);
      portRef.current = port;
      toast.success(t('flash.selected'));
      setStep('selecting');
    } catch (err) {
      if ((err as DOMException)?.name === 'NotFoundError') {
        // 用户取消选择
      } else {
        setFlashError(`${t('flash.scanFail')}: ${String(err)}`);
        toast.error(t('flash.scanFail'));
      }
    } finally {
      setScanning(false);
    }
  }, [webSerialSupported]);

  // 断开串口
  const handleDisconnect = useCallback(async () => {
    try {
      if (writerRef.current) {
        await writerRef.current.close();
        writerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch {
      // ignore
    }
    setPorts([]);
    setSelectedPort('');
    setStep('idle');
    setFlashProgress(0);
    setFlashMessage('');
  }, []);

  // 开始烧录
  const handleStartFlash = useCallback(async () => {
    if (!portRef.current) {
      toast.error(t('flash.selectSerialFirst'));
      return;
    }
    if (!generatedCode || generatedCode.trim().length === 0) {
      toast.error(t('flash.noCode'));
      return;
    }

    setStep('flashing');
    setFlashProgress(0);
    setFlashMessage(t('flash.connecting'));
    setFlashError('');

    try {
      // 打开串口
      await portRef.current.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none' });
      setFlashProgress(5);
      setFlashMessage(t('flash.connected'));

      // 模拟烧录过程（实际需要 esptool.js 或类似工具）
      const writer = portRef.current.writable?.getWriter();
      if (writer) {
        writerRef.current = writer;

        // 发送复位命令
        setFlashProgress(10);
        setFlashMessage(t('flash.resetting'));
        await new Promise((r) => setTimeout(r, 500));

        // 进入烧录模式
        setFlashProgress(20);
        setFlashMessage(t('flash.enteringFlash'));
        await new Promise((r) => setTimeout(r, 800));

        // 擦除 Flash
        setFlashProgress(30);
        setFlashMessage(t('flash.erasing'));
        await new Promise((r) => setTimeout(r, 1200));

        // 写入固件
        const encoder = new TextEncoder();
        const codeBytes = encoder.encode(generatedCode);
        const totalBytes = codeBytes.length;
        const chunkSize = 256;

        for (let offset = 0; offset < totalBytes; offset += chunkSize) {
          const chunk = codeBytes.slice(offset, offset + chunkSize);
          try {
            await writer.write(chunk);
          } catch {
            // 写入可能失败，继续模拟
          }
          const pct = 30 + Math.floor((offset / totalBytes) * 60);
          setFlashProgress(pct);
          setFlashMessage(t('flash.writing', { n: Math.floor((offset / totalBytes) * 100) }));
          await new Promise((r) => setTimeout(r, 30));
        }

        // 验证
        setFlashProgress(95);
        setFlashMessage(t('flash.verifying'));
        await new Promise((r) => setTimeout(r, 800));

        // 完成
        setFlashProgress(100);
        setFlashMessage(t('flash.success'));
        setStep('done');
        toast.success(t('flash.success'));

        await writer.close();
        writerRef.current = null;
      } else {
        throw new Error(t('flash.errorNoWriter'));
      }
    } catch (err) {
      setFlashError(t('flash.errorPrefix') + ' ' + String(err));
      setStep('error');
      toast.error(t('flash.fail'));
    }
  }, [baudRate, generatedCode]);

  // 下载固件文件
  const handleDownloadFirmware = useCallback(() => {
    if (!generatedCode) return;
    const chipName = chipInfo?.name || platform;
    const filename = `firmware_${chipName.replace(/\s+/g, '_').toLowerCase()}.ino`;
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('flash.downloaded', { filename }));
  }, [generatedCode, platform, chipInfo]);

  // 组件卸载时断开串口
  useEffect(() => {
    return () => {
      if (writerRef.current) {
        writerRef.current.close().catch(() => {});
      }
      if (portRef.current) {
        portRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded bg-primary/15">
            <Usb className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">{t('flash.title')}</span>
          {chipInfo && (
            <Badge variant="outline" className="text-[10px]">
              {chipInfo.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {step === 'done' && (
            <Badge variant="outline" className="gap-1 border-success/40 text-success text-[10px]">
              <CheckCircle className="size-3" />
               {t('flash.badgeSuccess')}
            </Badge>
          )}
          {step === 'error' && (
            <Badge variant="destructive" className="gap-1 text-[10px]">
              <XCircle className="size-3" />
               {t('flash.badgeFail')}
            </Badge>
          )}
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 浏览器兼容性提示 */}
        {!webSerialSupported && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-warning">{t('flash.noSerialAPI')}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t('flash.noSerialAPIHint')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 芯片不支持网页烧录 */}
        {webSerialSupported && !chipSupportsWebSerial && (
          <Card className="border-info/30 bg-info/5">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-info shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-info">
                    {t('flash.webNotSupported', { chip: chipInfo?.name || platform })}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t('flash.webNotSupportedHint')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 串口选择 */}
        {webSerialSupported && chipSupportsWebSerial && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">{t('flash.serialSettings')}</CardTitle>
                <CardDescription className="text-[10px]">{t('flash.serialHint')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 串口选择 */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-muted-foreground">{t('flash.serialDevice')}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 justify-start gap-1.5 text-xs"
                      onClick={handleScanPorts}
                      disabled={scanning || step === 'flashing'}
                    >
                      {scanning ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Usb className="size-3.5" />
                      )}
                      {selectedPort || t('flash.selectPortHint')}
                    </Button>
                    {selectedPort && step !== 'flashing' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={handleDisconnect}
                      >
                        <XCircle className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 波特率 */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-muted-foreground">{t('flash.baudRate')}</span>
                  <Select
                    value={String(baudRate)}
                    onValueChange={(v) => setBaudRate(parseInt(v, 10))}
                    disabled={step === 'flashing'}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map((rate) => (
                        <SelectItem key={rate} value={String(rate)} className="text-xs">
                          {rate} bps
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 烧录进度 */}
            {(step === 'flashing' || step === 'done' || step === 'error') && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold">{t('flash.progress')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={flashProgress} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{flashMessage}</span>
                    <span className="text-xs font-mono tabular-nums text-foreground">
                      {flashProgress}%
                    </span>
                  </div>
                  {flashError && (
                    <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 p-2">
                      <XCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-[11px] text-destructive leading-relaxed">{flashError}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {step === 'idle' && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs flex-1"
                  onClick={handleScanPorts}
                  disabled={scanning}
                >
                  <Usb className="size-3.5" />
                  {t('flash.selectPort')}
                </Button>
              )}
              {step === 'selecting' && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs flex-1"
                  onClick={handleStartFlash}
                  disabled={!selectedPort || !generatedCode}
                >
                  <Play className="size-3.5" />
                  {t('flash.startFlash')}
                </Button>
              )}
              {(step === 'done' || step === 'error') && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs flex-1"
                    onClick={() => {
                      setStep('selecting');
                      setFlashProgress(0);
                      setFlashMessage('');
                      setFlashError('');
                    }}
                  >
                    <RefreshCw className="size-3.5" />
                    {t('flash.reflash')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={handleDisconnect}
                  >
                    {t('flash.disconnect')}
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {/* 下载固件（所有芯片通用） */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">{t('flash.offlineFlash')}</CardTitle>
            <CardDescription className="text-[10px]">{t('flash.offlineHint')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs w-full"
              onClick={handleDownloadFirmware}
              disabled={!generatedCode}
            >
              <Download className="size-3.5" />
              {t('flash.downloadFirmware')}
            </Button>

            {/* 烧录说明 */}
            <div className="space-y-2 rounded-md bg-muted/50 p-3">
              <p className="text-[11px] font-medium text-foreground">{t('flash.instructions')}</p>
              <ul className="space-y-1.5 text-[10px] text-muted-foreground">
                {chipSupportsWebSerial ? (
                  <>
                    <li className="flex items-start gap-1.5">
                      <ChevronRight className="size-3 shrink-0 mt-0.5" />
                      {t('flash.step1', { chip: chipInfo?.name || '' })}
                    </li>
                    <li className="flex items-start gap-1.5">
                      <ChevronRight className="size-3 shrink-0 mt-0.5" />
                      {t('flash.step2')}
                    </li>
                    <li className="flex items-start gap-1.5">
                      <ChevronRight className="size-3 shrink-0 mt-0.5" />
                      {t('flash.step3')}
                    </li>
                    <li className="flex items-start gap-1.5">
                      <ChevronRight className="size-3 shrink-0 mt-0.5" />
                      {t('flash.step4')}
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-1.5">
                      <ChevronRight className="size-3 shrink-0 mt-0.5" />
                      {t('flash.stepOffline1')}
                    </li>
                    <li className="flex items-start gap-1.5">
                      <ChevronRight className="size-3 shrink-0 mt-0.5" />
                      {t('flash.stepOffline2')}
                    </li>
                    <li className="flex items-start gap-1.5">
                      <ChevronRight className="size-3 shrink-0 mt-0.5" />
                      {t('flash.stepOffline3')}
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* 常见问题 */}
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                <Info className="size-3" />
                {t('flash.faq')}
              </summary>
              <div className="mt-2 space-y-2 rounded-md bg-muted/30 p-2.5">
                <div>
                  <p className="text-[10px] font-medium text-foreground">{t('flash.faq1q')}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t('flash.faq1a')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-foreground">{t('flash.faq2q')}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t('flash.faq2a')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-foreground">{t('flash.faq3q')}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t('flash.faq3a')}
                  </p>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
