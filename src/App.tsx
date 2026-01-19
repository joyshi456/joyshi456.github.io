import { useStore, type WindowId } from './store/store';
import { useAgent } from './agent/useAgent';
import { useTranslation } from 'react-i18next';
// import { parseIntent } from './agent/parser';
import { Window } from './components/ui/Window';
import { Taskbar } from './components/ui/Taskbar';
import { DesktopIcon } from './components/ui/DesktopIcon';
// import { CommandDialog } from './components/apps/CommandDialog';
import { Terminal } from './components/apps/Terminal';
import { CVViewer } from './components/apps/CVViewer';
import { ProjectsViewer } from './components/apps/ProjectsViewer';
import { Explorer } from './components/apps/Explorer';
// import { ContactWindow } from './components/apps/ContactWindow';
import { OutlookExpress } from './components/apps/OutlookExpress';
import { Paint } from './components/apps/Paint';
import { SystemProperties } from './components/apps/SystemProperties';

import { GhostCursor } from './components/ui/GhostCursor';
import { Clippy } from './components/ui/Clippy';
import { useClippyDemo } from './hooks/useClippyDemo';

import './App.css';

function App() {
  const { t } = useTranslation();
  const {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    toggleStartMenu,
    agentStatus,
    agentMessage,
    cursorPosition,
    isClicking,
    cancelAgent
  } = useStore();

  const { runPlan } = useAgent();
  const clippy = useClippyDemo();

  const handleExecute = (query: string) => {
    // Direct Agent Call (Bypass old parser)
    // types.ts might need refactoring, but useAgent now expects a query string effectively
    // @ts-ignore
    runPlan(query);

    // Close command dialog if it was the source
    // closeWindow('cmd'); 
  };


  // Research folder contents with URL shortcuts
  const researchItems = [
    {
      id: 'fredguard',
      label: 'FREDGuard_NeurIPS.url',
      icon: '/img/url_shortcut.svg',
      type: 'file' as const,
      onClick: () => window.open('https://openreview.net/pdf?id=lH5nrHUpP7', '_blank')
    },
    {
      id: 'capstone',
      label: 'Schwarzman_Capstone.url',
      icon: '/img/url_shortcut.svg',
      type: 'file' as const,
      onClick: () => window.open('https://drive.google.com/file/d/1aYjp70e3iMPkHO1Il2nvSNaxWHYnEYDG/view?usp=sharing', '_blank')
    },
  ];

  const renderComponent = (id: WindowId) => {
    switch (id) {
      case 'cv': return <CVViewer />;
      case 'mycomputer': return <SystemProperties />;
      case 'documents': // My Documents folder
        return <Explorer initialPath={t('desktop.myDocuments')} items={[
          { id: '1', label: t('files.research'), icon: '/img/my_docs.png', type: 'folder', onClick: () => openWindow('research', t('files.research'), '/img/my_docs.png', <Explorer initialPath={t('files.research')} items={researchItems} />) },
          { id: '2', label: t('files.resume'), icon: '/img/wordpad_icons/WordPad-icon-cropped.png', type: 'file', onClick: () => openWindow('cv', t('files.resume'), '/img/wordpad_icons/WordPad-icon-cropped.png', <CVViewer />) },
        ]} />;
      case 'research': return <Explorer initialPath={t('files.research')} items={researchItems} />;
      case 'projects': return <ProjectsViewer />; // Keep for backwards compatibility
      case 'contact': return <OutlookExpress />;
      case 'paint':
        return <Paint />;
      case 'cmd':
        return <Terminal onExecute={handleExecute} />;
      default: return null;
    }
  };

  const winList = Object.values(windows);

  return (
    <div className="desktop">
      {/* Only show cursor when agent is active */}
      {agentStatus !== 'idle' && (
        <GhostCursor x={cursorPosition.x} y={cursorPosition.y} isClicking={isClicking} label={agentStatus === 'thinking' ? 'Wait...' : null} />
      )}

      {/* Desktop Icons */}
      <div className="desktop-icons" style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <DesktopIcon
          label={t('desktop.myComputer')}
          iconSrc="/img/computer.ico"
          onDoubleClick={() => openWindow('mycomputer', t('system.title'), '/img/computer.ico', <SystemProperties />, { width: 506, height: 450 })}
        />
        <DesktopIcon
          label={t('desktop.myDocuments')}
          iconSrc="/img/my_docs.png"
          onDoubleClick={() => openWindow('documents', t('desktop.myDocuments'), '/img/my_docs.png', <Explorer
            initialPath={t('desktop.myDocuments')}
            items={[
              { id: 'research', label: t('files.research'), icon: '/img/my_docs.png', type: 'folder', onClick: () => openWindow('research', t('files.research'), '/img/my_docs.png', <Explorer initialPath={t('files.research')} items={researchItems} />) },
              { id: 'cv', label: t('files.resume'), icon: '/img/wordpad_icons/WordPad-icon-cropped.png', type: 'file', onClick: () => openWindow('cv', t('files.resume'), '/img/wordpad_icons/WordPad-icon-cropped.png', <CVViewer />) },
              { id: 'todo', label: t('files.thingsToDo'), icon: '/img/word_icon.png', type: 'file' },
            ]}
          />)}
        />
        <DesktopIcon
          label={t('desktop.outlookExpress')}
          iconSrc="/img/outlook_express.png"
          onDoubleClick={() => openWindow('contact', t('desktop.outlookExpress'), '/img/outlook_express.png', <OutlookExpress />)}
        />
        <DesktopIcon
          label={t('desktop.paint')}
          iconSrc="/img/paint_icon.png"
          onDoubleClick={() => openWindow('paint', t('desktop.paint'), '/img/paint_icon.png', <Paint />, { width: 675, height: 506 })}
        />
        <DesktopIcon
          label={t('desktop.commandPrompt')}
          iconSrc="/img/cmd.png"
          onDoubleClick={() => openWindow('cmd', t('desktop.commandPrompt'), '/img/cmd.png', <Terminal onExecute={handleExecute} />)}
          data-agent-id="desktop-icon-command-prompt"
        />
      </div>

      {/* Windows */}
      {winList.map((win) => {
        // Dialog windows (like System Properties, Keyboard) should only show Close button
        const isDialog = win.id === 'mycomputer' || win.id === 'keyboard';

        // Get translated title based on window ID
        const getWindowTitle = (id: string): string => {
          const titleMap: Record<string, string> = {
            'mycomputer': t('system.title'),
            'documents': t('desktop.myDocuments'),
            'contact': t('desktop.outlookExpress'),
            'paint': t('desktop.paint'),
            'cmd': t('desktop.commandPrompt'),
            'cv': t('files.resume'),
            'projects': t('files.projects'),
            'research': t('files.research'),
            'keyboard': t('keyboard.title'),
          };
          return titleMap[id] || win.title;
        };

        return win.isOpen && !win.isMinimized && (
          <Window
            key={win.id}
            title={getWindowTitle(win.id)}
            isActive={activeWindowId === win.id}
            onMouseDown={() => focusWindow(win.id)}
            onClose={() => {
              // If closing command prompt, cancel the agent
              if (win.id === 'cmd') {
                cancelAgent();
              }
              closeWindow(win.id);
            }}
            onMinimize={isDialog ? undefined : () => minimizeWindow(win.id)}
            onMaximize={isDialog ? undefined : () => maximizeWindow(win.id)}
            onDragEnd={(x, y) => updateWindowPosition(win.id, x, y)}
            onResize={isDialog ? undefined : (width, height) => updateWindowSize(win.id, width, height)}
            style={{
              position: 'absolute',
              top: win.position?.y ?? 100,
              left: win.position?.x ?? 100,
              width: win.size?.width ?? 400,
              height: win.size?.height ?? 300,
              zIndex: win.zIndex
            }}
          >
            {win.component || renderComponent(win.id)}
          </Window>
        );
      })}

      {/* Clippy Demo */}
      {clippy.isActive && clippy.currentStep && (
        <Clippy
          message={clippy.currentStep.message}
          position={clippy.currentStep.position}
          buttons={clippy.currentStep.buttons?.map(btn => ({
            label: btn.label,
            onClick: () => clippy.handleButtonClick(btn)
          }))}
          onClose={clippy.closeDemo}
        />
      )}

      {/* Agent Overlay */}
      {agentStatus !== 'idle' && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: '#ffffe0',
          border: '1px solid #000',
          padding: '5px 10px',
          boxShadow: '2px 2px 0px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontFamily: 'monospace',
          maxWidth: '320px',
          whiteSpace: 'pre-wrap'
        }}>
          <strong>Agent:</strong> {agentStatus} <br />
          {agentMessage && <span>&gt; {agentMessage}</span>}
        </div>
      )}

      {/* Taskbar */}
      <Taskbar
        onStartClick={toggleStartMenu}
        windows={winList
          .filter(w => w.isOpen)
          .map(w => {
            const titleMap: Record<string, string> = {
              'mycomputer': t('system.title'),
              'documents': t('desktop.myDocuments'),
              'contact': t('desktop.outlookExpress'),
              'paint': t('desktop.paint'),
              'cmd': t('desktop.commandPrompt'),
              'cv': t('files.resume'),
              'projects': t('files.projects'),
              'research': t('files.research'),
              'keyboard': t('keyboard.title'),
            };
            return { id: w.id, title: titleMap[w.id] || w.title, minimized: w.isMinimized, active: activeWindowId === w.id };
          })}
        onWindowClick={(id) => {
          const w = windows[id];
          if (w.isMinimized || activeWindowId !== id) {
            focusWindow(id);
          } else {
            minimizeWindow(id);
          }
        }}
      />
    </div>
  );
}

export default App;
