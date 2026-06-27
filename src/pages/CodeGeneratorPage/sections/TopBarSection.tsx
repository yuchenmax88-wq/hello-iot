import { useState, useMemo, useRef, useEffect } from 'react';
import { Cpu, Moon, Sun, BookOpen, Search, ChevronDown, Globe } from 'lucide-react';
import { toast } from 'sonner';

import { PLATFORMS, PLATFORM_GROUPS } from '@/data/platforms';
import { EXAMPLE_PROJECTS } from '@/data/examples';
import type { IProjectConfig } from '@/types/iot';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopBarSectionProps {
  platform: string;
  onPlatformChange: (platformId: string) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onLoadExample: (config: IProjectConfig) => void;
}

export default function TopBarSection({
  platform,
  onPlatformChange,
  theme,
  onThemeToggle,
  onLoadExample,
}: TopBarSectionProps) {
  const { t, lang, setLang } = useT();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const currentPlatform = PLATFORMS.find((p) => p.id === platform);

  // 按分组过滤
  const groupedPlatforms = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return PLATFORM_GROUPS.map((group) => {
      const items = PLATFORMS.filter((p) => {
        if (p.group !== group.key) return false;
        if (!kw) return true;
        return (
          p.name.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw) ||
          p.id.toLowerCase().includes(kw)
        );
      });
      return { group, items };
    }).filter((g) => g.items.length > 0);
  }, [searchKeyword]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearchKeyword('');
    }
  }, [open]);

  function handleLoadExample(exampleId: string) {
    const example = EXAMPLE_PROJECTS.find((e) => e.id === exampleId);
    if (!example) return;
    onPlatformChange(example.config.platform);
    setTimeout(() => {
      onLoadExample(example.config);
    }, 50);
    toast.success(t('topbar.exampleLoaded', { name: example.name }));
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-12 items-center gap-3 px-4">
        {/* 左侧：品牌 + 平台选择 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15">
              <Cpu className="size-4 text-primary" strokeWidth={1.5} />
            </div>
            <span className="hidden text-sm font-semibold tracking-wide text-foreground sm:inline">
              {t('topbar.brand')}
            </span>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* 搜索式平台选择 */}
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-[180px] justify-between gap-1.5 border-border bg-card px-2.5 text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Cpu className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {currentPlatform?.name || t('topbar.selectPlatform')}
                  </span>
                </div>
                <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[320px] p-0"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {/* 搜索框 */}
              <div className="flex items-center border-b border-border px-3 py-2">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder={t('topbar.searchChip')}
                  className="ml-2 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>

              {/* 分组列表 */}
              <div className="max-h-[360px] overflow-y-auto py-1">
                {groupedPlatforms.length === 0 ? (
                  <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                    {t('topbar.noMatch')}
                  </div>
                ) : (
                  groupedPlatforms.map(({ group, items }) => (
                    <div key={group.key}>
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {t(`platform.group.${group.key}`)}
                      </div>
                      {items.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => {
                            onPlatformChange(p.id);
                            setOpen(false);
                          }}
                          className={`flex items-start gap-2.5 px-3 py-2 ${
                            p.id === platform ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            <div className={`size-2 rounded-full ${
                              p.id === platform ? 'bg-primary' : 'bg-border'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{p.name}</span>
                              {p.id === platform && (
                                <span className="text-[10px] text-primary">{t('topbar.current')}</span>
                              )}
                            </div>
                            <div className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                              {t(`platform.desc.${p.id}`)}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/70">
                              <span>{t('topbar.pinStatsShort', { digital: p.digitalPins.length, analog: p.analogPins.length, pwm: p.pwmPins.length })}</span>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 中间：当前平台信息 */}
        <div className="hidden flex-1 items-center gap-2 lg:flex">
          {currentPlatform && (
            <span className="text-[11px] text-muted-foreground">
              {t('topbar.pinStats', { digital: currentPlatform.digitalPins.length, analog: currentPlatform.analogPins.length, pwm: currentPlatform.pwmPins.length })}
            </span>
          )}
        </div>

        {/* 右侧：示例项目 + 主题切换 */}
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <BookOpen className="size-3.5" />
                <span className="hidden sm:inline">{t('topbar.exampleProjects')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t('topbar.presetExamples')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {EXAMPLE_PROJECTS.map((example) => (
                <DropdownMenuItem
                  key={example.id}
                  onClick={() => handleLoadExample(example.id)}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <span className="text-sm font-medium">{t(`example.${example.id === 'temp_humidity_monitor' ? 'tempMonitor' : 'smartLight'}`)}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {t(`example.${example.id === 'temp_humidity_monitor' ? 'tempMonitorDesc' : 'smartLightDesc'}`)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            aria-label={t('topbar.switchLang')}
            title={t('common.language')}
          >
            <Globe className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={onThemeToggle}
            aria-label={theme === 'dark' ? t('topbar.switchLight') : t('topbar.switchDark')}
          >
            {theme === 'dark' ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
