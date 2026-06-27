import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { useT } from '@/i18n';
import TopBarSection from './sections/TopBarSection';
import ComponentLibrarySection from './sections/ComponentLibrarySection';
import PinConfigSection from './sections/PinConfigSection';
import LogicConfigSection from './sections/LogicConfigSection';
import CodePreviewSection from './sections/CodePreviewSection';
import StatusBarSection from './sections/StatusBarSection';
import BOMSection from './sections/BOMSection';
import FlashSection from './sections/FlashSection';
import WiFiConfigSection from './sections/WiFiConfigSection';
import BLEConfigSection from './sections/BLEConfigSection';

import { PLATFORMS, getDefaultPlatform } from '@/data/platforms';
import { COMPONENT_LIBRARY } from '@/data/components';
import { generateCode, validateProject } from '@/lib/code-generator';
import type { IComponentMeta } from '@/data/components';
import type { IProjectConfig, IComponentInstance, ILogicBlock, IWiFiConfig, IBLEConfig } from '@/types/iot';

const STORAGE_KEY_PROJECT = '__iot_codegen_project';
const STORAGE_KEY_THEME = '__iot_codegen_theme';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getInitialProject(): IProjectConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECT);
    if (raw) {
      const parsed = JSON.parse(raw) as IProjectConfig;
      if (parsed.platform && Array.isArray(parsed.components) && Array.isArray(parsed.logicBlocks)) {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return { platform: getDefaultPlatform().id, components: [], logicBlocks: [] };
}

function getInitialTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* ignore */ }
  return 'dark';
}

export default function CodeGeneratorPage() {
  const { t, lang } = useT();
  const [project, setProject] = useState<IProjectConfig>(getInitialProject);
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [activeTab, setActiveTab] = useState<'pins' | 'logic' | 'bom' | 'wifi' | 'ble' | 'flash'>('pins');
  const [validationResult, setValidationResult] = useState<{ errors: string[]; warnings: string[] } | null>(null);

  // 主题
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  // 持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(project));
  }, [project]);

  const handlePlatformChange = useCallback((platformId: string) => {
    setProject((prev) => ({ ...prev, platform: platformId }));
    setValidationResult(null);
  }, []);

  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleLoadExample = useCallback((config: IProjectConfig) => {
    setProject(config);
    setValidationResult(null);
    setActiveTab('pins');
  }, []);

  const handleAddComponent = useCallback((meta: IComponentMeta) => {
    setProject((prev) => {
      const sameTypeCount = prev.components.filter((c) => c.type === meta.type).length;
      const newComp: IComponentInstance = {
        id: generateId(),
        type: meta.type,
        name: `${meta.name}_${sameTypeCount + 1}`,
        pins: { ...meta.defaultPins },
      };
      return { ...prev, components: [...prev.components, newComp] };
    });
    setValidationResult(null);
    toast.success(t('codepage.addedComponent', { name: meta.name }));
  }, []);

  const handleBatchAddComponents = useCallback((metas: IComponentMeta[]) => {
    setProject((prev) => {
      const newComps: IComponentInstance[] = metas.map((meta) => {
        const sameTypeCount = prev.components.filter((c) => c.type === meta.type).length;
        return {
          id: generateId(),
          type: meta.type,
          name: `${meta.name}_${sameTypeCount + 1}`,
          pins: { ...meta.defaultPins },
        };
      });
      return { ...prev, components: [...prev.components, ...newComps] };
    });
    setValidationResult(null);
  }, []);

  const handleUpdateComponent = useCallback((updated: IComponentInstance) => {
    setProject((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === updated.id ? updated : c)),
    }));
    setValidationResult(null);
  }, []);

  const handleRemoveComponent = useCallback((id: string) => {
    setProject((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.id !== id),
      logicBlocks: prev.logicBlocks.filter((b) => b.triggerComponentId !== id),
    }));
    setValidationResult(null);
  }, []);

  const handleLogicBlocksChange = useCallback((blocks: ILogicBlock[]) => {
    setProject((prev) => ({ ...prev, logicBlocks: blocks }));
    setValidationResult(null);
  }, []);

  const handleWiFiConfigChange = useCallback((wifiConfig: IWiFiConfig | undefined) => {
    setProject((prev) => ({ ...prev, wifiConfig }));
  }, []);

  const handleBLEConfigChange = useCallback((bleConfig: IBLEConfig | undefined) => {
    setProject((prev) => ({ ...prev, bleConfig }));
  }, []);

  const handleCheck = useCallback(() => {
    const result = validateProject(project, lang);
    setValidationResult(result);
    if (result.valid && result.warnings.length === 0) {
      toast.success(t('codepage.checkPassed'));
    } else if (result.valid) {
      toast.warning(t('codepage.checkPassedWarnings', { n: result.warnings.length }));
    } else {
      toast.error(t('codepage.checkFailed', { n: result.errors.length, m: result.warnings.length }));
    }
  }, [project]);

  const generatedCode = useMemo(() => {
    try {
      return generateCode(project, lang);
    } catch {
      return '// ' + (t('codepage.codeGenFailed') || 'Code generation failed, please check configuration');
    }
  }, [project, lang, t]);

  const handleDownload = useCallback(() => {
    const platformName = PLATFORMS.find((p) => p.id === project.platform)?.name || 'project';
    const filename = `iot_${platformName.replace(/\s+/g, '_').toLowerCase()}.ino`;
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('codepage.downloaded', { filename }));
  }, [generatedCode, project.platform]);

  const stats = useMemo(() => {
    const pinConflicts = validationResult?.errors.filter((e) => e.includes('引脚冲突')).length || 0;
    return {
      componentCount: project.components.length,
      logicBlockCount: project.logicBlocks.length,
      pinConflictCount: pinConflicts,
    };
  }, [project, validationResult]);

  const addedComponentTypes = useMemo(
    () => project.components.map((c) => c.type),
    [project.components],
  );

  // 判断当前平台是否支持 WiFi / BLE
  const platformSupportsWiFi = useMemo(() => {
    const p = PLATFORMS.find((pl) => pl.id === project.platform);
    return p ? (p.group === 'esp') : false;
  }, [project.platform]);

  const platformSupportsBLE = useMemo(() => {
    const p = PLATFORMS.find((pl) => pl.id === project.platform);
    return p ? (p.group === 'esp' && !p.id.includes('8266') && !p.id.includes('s2')) : false;
  }, [project.platform]);

  // 中间面板标签页
  const midTabs = useMemo(() => {
    const tabs: { key: string; label: string }[] = [
      { key: 'pins', label: t('codepage.tab.pins') },
      { key: 'logic', label: t('codepage.tab.logic') },
      { key: 'bom', label: t('codepage.tab.bom') },
    ];
    if (platformSupportsWiFi) tabs.push({ key: 'wifi', label: t('codepage.tab.wifi') });
    if (platformSupportsBLE) tabs.push({ key: 'ble', label: t('codepage.tab.ble') });
    tabs.push({ key: 'flash', label: t('codepage.tab.flash') });
    return tabs;
  }, [platformSupportsWiFi, platformSupportsBLE, t]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBarSection
        platform={project.platform}
        onPlatformChange={handlePlatformChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onLoadExample={handleLoadExample}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：元件库 */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="hidden w-[240px] shrink-0 border-r border-border bg-card md:flex md:flex-col"
        >
          <ComponentLibrarySection
            onAddComponent={handleAddComponent}
            onBatchAddComponents={handleBatchAddComponents}
            addedComponentTypes={addedComponentTypes}
          />
        </motion.aside>

        {/* 中间：配置区 */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex min-w-0 flex-1 flex-col overflow-hidden"
        >
          {/* 标签页 */}
          <div className="flex shrink-0 items-center border-b border-border overflow-x-auto">
            {midTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`relative whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* 配置内容 */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'pins' && (
              <PinConfigSection
                components={project.components}
                platform={project.platform}
                validationErrors={validationResult?.errors || []}
                onUpdateComponent={handleUpdateComponent}
                onRemoveComponent={handleRemoveComponent}
              />
            )}
            {activeTab === 'logic' && (
              <LogicConfigSection
                logicBlocks={project.logicBlocks}
                components={project.components}
                onLogicBlocksChange={handleLogicBlocksChange}
                platformSupportsWiFi={platformSupportsWiFi}
                platformSupportsBLE={platformSupportsBLE}
              />
            )}
            {activeTab === 'bom' && (
              <BOMSection
                components={project.components}
                platform={project.platform}
              />
            )}
            {activeTab === 'wifi' && (
              <WiFiConfigSection
                wifiConfig={project.wifiConfig}
                platformId={project.platform}
                onWiFiConfigChange={handleWiFiConfigChange}
              />
            )}
            {activeTab === 'ble' && (
              <BLEConfigSection
                platform={project.platform}
                bleConfig={project.bleConfig}
                onBLEConfigChange={handleBLEConfigChange}
              />
            )}
            {activeTab === 'flash' && (
              <FlashSection
                platform={project.platform}
                generatedCode={generatedCode}
              />
            )}
          </div>
        </motion.main>

        {/* 右侧：代码预览 */}
        <motion.aside
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="hidden w-[380px] shrink-0 border-l border-border bg-card lg:flex lg:flex-col"
        >
          <CodePreviewSection
            code={generatedCode}
            onDownload={handleDownload}
            theme={theme}
          />
        </motion.aside>
      </div>

      {/* 底部状态栏 */}
      <StatusBarSection
        componentCount={stats.componentCount}
        logicBlockCount={stats.logicBlockCount}
        pinConflictCount={stats.pinConflictCount}
        validationResult={validationResult}
        onCheck={handleCheck}
        onDownload={handleDownload}
      />
    </div>
  );
}
