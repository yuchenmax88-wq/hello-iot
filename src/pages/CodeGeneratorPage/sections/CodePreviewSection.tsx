import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n';

interface CodePreviewSectionProps {
  code: string;
  onDownload: () => void;
  theme: 'dark' | 'light';
}

type ColorScheme = Record<string, string>;

const DARK_COLORS: ColorScheme = {
  comment: '#6a9955',
  preprocessor: '#c586c0',
  keyword: '#569cd6',
  func: '#dcdcaa',
  constant: '#569cd6',
  class: '#4ec9b0',
  number: '#b5cea8',
  text: 'rgba(255,255,255,0.85)',
};

const LIGHT_COLORS: ColorScheme = {
  comment: '#008000',
  preprocessor: '#800080',
  keyword: '#0000ff',
  func: '#795e26',
  constant: '#0000ff',
  class: '#267f99',
  number: '#098658',
  text: 'rgba(0,0,0,0.85)',
};

function highlightCode(code: string, colors: ColorScheme): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, i) => {
    if (/^\s*\/\//.test(line)) {
      return (
        <div key={i} className="flex">
          <span className="inline-block w-10 shrink-0 select-none text-right pr-3 text-[10px] leading-relaxed text-muted-foreground/40 tabular-nums">{i + 1}</span>
          <span style={{ color: colors.comment }} className="leading-relaxed">{line}</span>
        </div>
      );
    }
    if (/^\s*#/.test(line)) {
      return (
        <div key={i} className="flex">
          <span className="inline-block w-10 shrink-0 select-none text-right pr-3 text-[10px] leading-relaxed text-muted-foreground/40 tabular-nums">{i + 1}</span>
          <span style={{ color: colors.preprocessor }} className="leading-relaxed">{line}</span>
        </div>
      );
    }

    const highlighted = line
      .replace(/\b(void|int|float|long|char|bool|String|const|static|unsigned|byte|word)\b/g, '\x01$1\x02')
      .replace(/\b(if|else|for|while|do|switch|case|break|continue|return)\b/g, '\x03$1\x02')
      .replace(/\b(digitalWrite|digitalRead|analogWrite|analogRead|pinMode|Serial|delay|delayMicroseconds|pulseIn|begin|print|println|write|read|attach|clearDisplay|display|setCursor|backlight|init|step)\b/g, '\x04$1\x02')
      .replace(/\b(HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|true|false)\b/g, '\x05$1\x02')
      .replace(/\b(DHT|Servo|Adafruit_SSD1306|LiquidCrystal_I2C|Stepper|WiFi|BLEDevice|BLECharacteristic)\b/g, '\x06$1\x02')
      .replace(/(\d+)/g, '\x07$1\x02');

    const parts = highlighted.split('\x02');
    const elements: React.ReactNode[] = [];

    parts.forEach((part, j) => {
      if (j === parts.length - 1) {
        if (part) elements.push(<span key={j}>{part}</span>);
        return;
      }
      const code = part.charCodeAt(0);
      if (code === 1) {
        elements.push(<span key={j} style={{ color: colors.keyword }}>{part.slice(1)}</span>);
      } else if (code === 3) {
        elements.push(<span key={j} style={{ color: colors.preprocessor }}>{part.slice(1)}</span>);
      } else if (code === 4) {
        elements.push(<span key={j} style={{ color: colors.func }}>{part.slice(1)}</span>);
      } else if (code === 5) {
        elements.push(<span key={j} style={{ color: colors.constant }}>{part.slice(1)}</span>);
      } else if (code === 6) {
        elements.push(<span key={j} style={{ color: colors.class }}>{part.slice(1)}</span>);
      } else if (code === 7) {
        elements.push(<span key={j} style={{ color: colors.number }}>{part.slice(1)}</span>);
      } else {
        elements.push(<span key={j}>{part}</span>);
      }
    });

    return (
      <div key={i} className="flex">
        <span className="inline-block w-10 shrink-0 select-none text-right pr-3 text-[10px] leading-relaxed text-muted-foreground/40 tabular-nums">{i + 1}</span>
        <span className="leading-relaxed">{elements}</span>
      </div>
    );
  });
}

export default function CodePreviewSection({
  code,
  onDownload,
  theme,
}: CodePreviewSectionProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useT();

  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  const lineCount = useMemo(() => code.split('\n').length, [code]);
  const highlightedCode = useMemo(() => highlightCode(code, colors), [code, colors]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t('preview.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('preview.copyFail'));
    }
  }, [code, t]);

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-success" />
            <span className="text-xs font-medium text-foreground">{t('preview.title')}</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
            {t('preview.lines', { n: lineCount })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            aria-label={t('preview.copyCode')}
          >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={onDownload}
            aria-label={t('preview.downloadCode')}
          >
            <Download className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? t('preview.expand') : t('preview.collapse')}
          >
            {collapsed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* 代码区域 */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-auto"
        >
          <pre className="p-4 font-mono text-xs leading-relaxed overflow-x-auto" style={{ color: colors.text }}>
            <code>{highlightedCode}</code>
          </pre>
        </motion.div>
      )}
    </div>
  );
}
