import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '../../i18n';

const win = {
    face: '#c0c0c0',
    highlight: '#ffffff',
    lightShadow: '#dfdfdf',
    shadow: '#808080',
    darkShadow: '#404040',
    activeCaption: '#000080',
    activeCaptionText: '#ffffff',
    window: '#ffffff',
};

interface InstalledLanguage {
    code: string;
    layout: string;
}

interface AddLanguageDialogProps {
    onClose: () => void;
    onAdd: (code: string) => void;
    availableLanguages: { code: string; name: string }[];
}

const AddLanguageDialog: React.FC<AddLanguageDialogProps> = ({ onClose, onAdd, availableLanguages }) => {
    const { t } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(availableLanguages[0]?.code || '');
    const [pressedButton, setPressedButton] = useState<string | null>(null);

    const handleOk = () => {
        if (selectedLanguage) {
            onAdd(selectedLanguage);
        }
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
        }}>
            <div style={{
                backgroundColor: win.face,
                border: `2px solid ${win.highlight}`,
                borderRightColor: win.darkShadow,
                borderBottomColor: win.darkShadow,
                boxShadow: `inset -1px -1px 0 ${win.shadow}, inset 1px 1px 0 ${win.lightShadow}`,
                padding: '2px',
                minWidth: '250px',
            }}>
                {/* Title bar */}
                <div style={{
                    background: `linear-gradient(to right, ${win.activeCaption}, #1084d0)`,
                    padding: '2px 4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                }}>
                    <span style={{ color: win.activeCaptionText, fontWeight: 'bold', fontSize: '12px' }}>
                        {t('keyboard.addLanguage')}
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            width: '16px',
                            height: '14px',
                            background: win.face,
                            border: `1px solid ${win.highlight}`,
                            borderRightColor: win.darkShadow,
                            borderBottomColor: win.darkShadow,
                            fontSize: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: '8px 12px' }}>
                    <div style={{ marginBottom: '8px', fontSize: '12px' }}>
                        {t('keyboard.languageColumn')}
                    </div>
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '2px',
                            backgroundColor: win.window,
                            border: `2px solid ${win.shadow}`,
                            borderRightColor: win.highlight,
                            borderBottomColor: win.highlight,
                            fontSize: '12px',
                            fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                        }}
                    >
                        {availableLanguages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.name}
                            </option>
                        ))}
                    </select>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '6px',
                        marginTop: '16px',
                    }}>
                        {[{ label: t('buttons.ok'), action: handleOk }, { label: t('buttons.cancel'), action: onClose }].map(({ label, action }) => {
                            const isPressed = pressedButton === label;
                            return (
                                <button
                                    key={label}
                                    onClick={action}
                                    onMouseDown={() => setPressedButton(label)}
                                    onMouseUp={() => setPressedButton(null)}
                                    onMouseLeave={() => setPressedButton(null)}
                                    style={{
                                        minWidth: '60px',
                                        padding: '2px 8px',
                                        background: win.face,
                                        borderTop: `2px solid ${isPressed ? win.darkShadow : win.highlight}`,
                                        borderLeft: `2px solid ${isPressed ? win.darkShadow : win.highlight}`,
                                        borderRight: `2px solid ${isPressed ? win.highlight : win.darkShadow}`,
                                        borderBottom: `2px solid ${isPressed ? win.highlight : win.darkShadow}`,
                                        fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface KeyboardPropertiesProps {
    onClose?: () => void;
}

export const KeyboardProperties: React.FC<KeyboardPropertiesProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'speed' | 'language'>('language');
    const [pressedButton, setPressedButton] = useState<string | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [switchMethod, setSwitchMethod] = useState<'leftAltShift' | 'ctrlShift' | 'none'>('leftAltShift');
    const [showIndicator, setShowIndicator] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Installed languages state - persisted to reflect actual app language
    const [installedLanguages, setInstalledLanguages] = useState<InstalledLanguage[]>(() => {
        const currentLang = getCurrentLanguage();
        const langs: InstalledLanguage[] = [
            { code: 'en-US', layout: 'usStandard' },
        ];
        if (currentLang === 'zh-CN') {
            langs.push({ code: 'zh-CN', layout: 'chinese' });
        }
        return langs;
    });

    const [defaultLanguage, setDefaultLanguage] = useState<string>(() => {
        const currentLang = getCurrentLanguage();
        return currentLang === 'zh-CN' ? 'zh-CN' : 'en-US';
    });

    // Available languages to add
    const allLanguages = [
        { code: 'en-US', layout: 'usStandard' },
        { code: 'zh-CN', layout: 'chinese' },
        { code: 'zh-TW', layout: 'chineseTraditional' },
        { code: 'es-ES', layout: 'spanish' },
        { code: 'fr-FR', layout: 'french' },
        { code: 'de-DE', layout: 'german' },
        { code: 'ja-JP', layout: 'japanese' },
        { code: 'ko-KR', layout: 'korean' },
        { code: 'ru-RU', layout: 'russian' },
        { code: 'ar-SA', layout: 'arabic' },
        { code: 'hy-AM', layout: 'armenian' },
    ];

    const availableToAdd = allLanguages.filter(
        (lang) => !installedLanguages.some((installed) => installed.code === lang.code)
    );

    const handleAddLanguage = (code: string) => {
        const lang = allLanguages.find((l) => l.code === code);
        if (lang && !installedLanguages.some((l) => l.code === code)) {
            setInstalledLanguages([...installedLanguages, lang]);
        }
    };

    const handleRemove = () => {
        if (installedLanguages.length > 1 && selectedIndex < installedLanguages.length) {
            const langToRemove = installedLanguages[selectedIndex];
            // Don't remove if it's the default
            if (langToRemove.code === defaultLanguage) {
                return;
            }
            const newLangs = installedLanguages.filter((_, i) => i !== selectedIndex);
            setInstalledLanguages(newLangs);
            setSelectedIndex(Math.max(0, selectedIndex - 1));
        }
    };

    const handleSetAsDefault = () => {
        if (selectedIndex < installedLanguages.length) {
            const lang = installedLanguages[selectedIndex];
            setDefaultLanguage(lang.code);
        }
    };

    const handleApply = () => {
        // Map the default language to i18n language code
        const i18nLang = defaultLanguage === 'zh-CN' ? 'zh-CN' : 'en';
        changeLanguage(i18nLang);
    };

    const handleOk = () => {
        handleApply();
        onClose?.();
    };

    const tabs = [
        { id: 'speed', label: t('keyboard.speed') },
        { id: 'language', label: t('keyboard.language') },
    ];

    return (
        <div style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: win.face,
            fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
            fontSize: '12px',
            overflow: 'hidden',
        }}>
            {/* Tab strip */}
            <div style={{
                display: 'flex',
                gap: '2px',
                padding: '6px 6px 0 6px',
                backgroundColor: win.face,
            }}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'speed' | 'language')}
                            style={{
                                padding: '3px 10px 4px',
                                background: win.face,
                                borderTop: `2px solid ${isActive ? win.highlight : win.shadow}`,
                                borderLeft: `2px solid ${isActive ? win.highlight : win.shadow}`,
                                borderRight: `2px solid ${isActive ? win.darkShadow : win.lightShadow}`,
                                borderBottom: isActive ? '0' : `2px solid ${win.darkShadow}`,
                                position: 'relative',
                                top: isActive ? '1px' : '0',
                                zIndex: isActive ? 2 : 1,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '12px',
                                color: '#000',
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            <div style={{
                flex: 1,
                borderTop: `2px solid ${win.darkShadow}`,
                borderLeft: `2px solid ${win.highlight}`,
                borderRight: `2px solid ${win.darkShadow}`,
                borderBottom: `2px solid ${win.darkShadow}`,
                boxShadow: `inset 1px 1px 0 ${win.shadow}, inset -1px -1px 0 ${win.lightShadow}`,
                padding: '12px',
                margin: '0 6px 6px 6px',
                backgroundColor: win.face,
                overflow: 'auto',
            }}>
                {activeTab === 'speed' && (
                    <div style={{ padding: '20px', textAlign: 'center', color: win.shadow }}>
                        <div>{t('keyboard.speed')}</div>
                        <div style={{ marginTop: '10px', fontSize: '11px' }}>
                            (Keyboard repeat settings)
                        </div>
                    </div>
                )}

                {activeTab === 'language' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Installed languages section */}
                        <fieldset style={{
                            border: `1px solid ${win.shadow}`,
                            borderRightColor: win.highlight,
                            borderBottomColor: win.highlight,
                            padding: '8px',
                            margin: 0,
                        }}>
                            <legend style={{ padding: '0 4px', fontSize: '12px' }}>
                                {t('keyboard.installedLanguages')}
                            </legend>

                            {/* Language list header */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                backgroundColor: win.face,
                                borderBottom: `1px solid ${win.shadow}`,
                                fontSize: '11px',
                                marginBottom: '2px',
                            }}>
                                <div style={{ padding: '2px 4px', borderRight: `1px solid ${win.shadow}` }}>
                                    {t('keyboard.languageColumn')}
                                </div>
                                <div style={{ padding: '2px 4px' }}>
                                    {t('keyboard.layoutColumn')}
                                </div>
                            </div>

                            {/* Language list */}
                            <div style={{
                                backgroundColor: win.window,
                                border: `2px solid ${win.shadow}`,
                                borderRightColor: win.highlight,
                                borderBottomColor: win.highlight,
                                height: '80px',
                                overflow: 'auto',
                            }}>
                                {installedLanguages.map((lang, index) => (
                                    <div
                                        key={lang.code}
                                        onClick={() => setSelectedIndex(index)}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            padding: '2px 4px',
                                            cursor: 'pointer',
                                            backgroundColor: selectedIndex === index ? win.activeCaption : 'transparent',
                                            color: selectedIndex === index ? win.activeCaptionText : '#000',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '16px',
                                                height: '11px',
                                                backgroundColor: lang.code.startsWith('zh') ? '#de2910' : '#002868',
                                                fontSize: '8px',
                                                textAlign: 'center',
                                                color: '#fff',
                                                lineHeight: '11px',
                                            }}>
                                                {lang.code.split('-')[0].toUpperCase().slice(0, 2)}
                                            </span>
                                            {t(`languages.${lang.code}`)}
                                        </div>
                                        <div>{t(`layouts.${lang.layout}`)}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Buttons row */}
                            <div style={{
                                display: 'flex',
                                gap: '6px',
                                marginTop: '8px',
                            }}>
                                {[
                                    { label: t('keyboard.add'), action: () => setShowAddDialog(true), disabled: availableToAdd.length === 0 },
                                    { label: t('keyboard.properties'), action: () => {}, disabled: true },
                                    { label: t('keyboard.remove'), action: handleRemove, disabled: installedLanguages.length <= 1 || installedLanguages[selectedIndex]?.code === defaultLanguage },
                                ].map(({ label, action, disabled }) => {
                                    const isPressed = pressedButton === label;
                                    return (
                                        <button
                                            key={label}
                                            onClick={action}
                                            disabled={disabled}
                                            onMouseDown={() => !disabled && setPressedButton(label)}
                                            onMouseUp={() => setPressedButton(null)}
                                            onMouseLeave={() => setPressedButton(null)}
                                            style={{
                                                minWidth: '65px',
                                                padding: '2px 8px',
                                                background: win.face,
                                                borderTop: `2px solid ${isPressed ? win.darkShadow : win.highlight}`,
                                                borderLeft: `2px solid ${isPressed ? win.darkShadow : win.highlight}`,
                                                borderRight: `2px solid ${isPressed ? win.highlight : win.darkShadow}`,
                                                borderBottom: `2px solid ${isPressed ? win.highlight : win.darkShadow}`,
                                                fontFamily: 'inherit',
                                                fontSize: '12px',
                                                cursor: disabled ? 'default' : 'pointer',
                                                color: disabled ? win.shadow : '#000',
                                            }}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        {/* Default language */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{t('keyboard.defaultLanguage')}</span>
                            <select
                                value={defaultLanguage}
                                onChange={(e) => setDefaultLanguage(e.target.value)}
                                style={{
                                    flex: 1,
                                    maxWidth: '200px',
                                    padding: '2px',
                                    backgroundColor: win.window,
                                    border: `2px solid ${win.shadow}`,
                                    borderRightColor: win.highlight,
                                    borderBottomColor: win.highlight,
                                    fontSize: '12px',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {installedLanguages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {t(`languages.${lang.code}`)}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleSetAsDefault}
                                onMouseDown={() => setPressedButton('setDefault')}
                                onMouseUp={() => setPressedButton(null)}
                                onMouseLeave={() => setPressedButton(null)}
                                style={{
                                    padding: '2px 8px',
                                    background: win.face,
                                    borderTop: `2px solid ${pressedButton === 'setDefault' ? win.darkShadow : win.highlight}`,
                                    borderLeft: `2px solid ${pressedButton === 'setDefault' ? win.darkShadow : win.highlight}`,
                                    borderRight: `2px solid ${pressedButton === 'setDefault' ? win.highlight : win.darkShadow}`,
                                    borderBottom: `2px solid ${pressedButton === 'setDefault' ? win.highlight : win.darkShadow}`,
                                    fontFamily: 'inherit',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                }}
                            >
                                {t('keyboard.setAsDefault')}
                            </button>
                        </div>

                        {/* Switch languages */}
                        <fieldset style={{
                            border: `1px solid ${win.shadow}`,
                            borderRightColor: win.highlight,
                            borderBottomColor: win.highlight,
                            padding: '8px',
                            margin: 0,
                        }}>
                            <legend style={{ padding: '0 4px', fontSize: '12px' }}>
                                {t('keyboard.switchLanguages')}
                            </legend>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                {[
                                    { id: 'leftAltShift', label: t('keyboard.leftAltShift') },
                                    { id: 'ctrlShift', label: t('keyboard.ctrlShift') },
                                    { id: 'none', label: t('keyboard.none') },
                                ].map(({ id, label }) => (
                                    <label key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="switchMethod"
                                            checked={switchMethod === id}
                                            onChange={() => setSwitchMethod(id as typeof switchMethod)}
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {/* Enable indicator */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showIndicator}
                                onChange={(e) => setShowIndicator(e.target.checked)}
                            />
                            {t('keyboard.enableIndicator')}
                        </label>
                    </div>
                )}
            </div>

            {/* Bottom buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '6px',
                padding: '6px 10px',
            }}>
                {[
                    { label: t('buttons.ok'), action: handleOk },
                    { label: t('buttons.cancel'), action: () => onClose?.() },
                    { label: t('buttons.apply'), action: handleApply },
                ].map(({ label, action }) => {
                    const isPressed = pressedButton === label;
                    return (
                        <button
                            key={label}
                            onClick={action}
                            onMouseDown={() => setPressedButton(label)}
                            onMouseUp={() => setPressedButton(null)}
                            onMouseLeave={() => setPressedButton(null)}
                            style={{
                                minWidth: '65px',
                                padding: '2px 10px',
                                background: win.face,
                                borderTop: `2px solid ${isPressed ? win.darkShadow : win.highlight}`,
                                borderLeft: `2px solid ${isPressed ? win.darkShadow : win.highlight}`,
                                borderRight: `2px solid ${isPressed ? win.highlight : win.darkShadow}`,
                                borderBottom: `2px solid ${isPressed ? win.highlight : win.darkShadow}`,
                                fontFamily: 'inherit',
                                fontSize: '12px',
                                cursor: 'pointer',
                            }}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Add Language Dialog */}
            {showAddDialog && (
                <AddLanguageDialog
                    onClose={() => setShowAddDialog(false)}
                    onAdd={handleAddLanguage}
                    availableLanguages={availableToAdd.map((lang) => ({
                        code: lang.code,
                        name: t(`languages.${lang.code}`),
                    }))}
                />
            )}
        </div>
    );
};
