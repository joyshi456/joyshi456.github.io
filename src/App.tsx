import { useEffect } from 'react';
import { useStore, type WindowId } from './store/store';
import { useAgent } from './agent/useAgent';
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

import './App.css';

function App() {
  const {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    minimizeWindow,
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

  const handleExecute = (query: string) => {
    // Direct Agent Call (Bypass old parser)
    // types.ts might need refactoring, but useAgent now expects a query string effectively
    // @ts-ignore
    runPlan(query);

    // Close command dialog if it was the source
    // closeWindow('cmd'); 
  };

  // Initial load - open Terminal
  useEffect(() => {
    openWindow('cmd', 'Command Prompt', '/img/cmd.png', <Terminal onExecute={handleExecute} />);
  }, []);

  const renderComponent = (id: WindowId) => {
    switch (id) {
      case 'cv': return <CVViewer />;
      case 'mycomputer': return <SystemProperties />;
      case 'documents': // Renamed from projects
        return <Explorer initialPath="My Documents" items={[
          { id: '1', label: 'My Projects', icon: '/img/folder_closed.ico', type: 'folder', onClick: () => openWindow('projects', 'Projects', '/img/folder_open.ico', <ProjectsViewer />) },
          { id: '2', label: 'Resume.doc', icon: '/img/wordpad_icons/WordPad-icon-cropped.png', type: 'file', onClick: () => openWindow('cv', 'Resume - WordPad', '/img/wordpad_icons/WordPad-icon-cropped.png', <CVViewer />) },
          { id: '3', label: 'Contact.txt', icon: '/img/notepad_file.ico', type: 'file', onClick: () => openWindow('contact', 'Outlook Express', '/img/outlook_express.png', <OutlookExpress />) },
        ]} />;
      // case 'projects': return <ProjectsViewer />; // Deprecated or sub-window? Let's keep it accessible via Explorer folder
      case 'projects': return <ProjectsViewer />;
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
          label="My Computer"
          iconSrc="/img/computer.ico"
          onDoubleClick={() => openWindow('mycomputer', 'System Properties', '/img/computer.ico', <SystemProperties />, { width: 506, height: 450 })}
        />
        <DesktopIcon
          label="My Documents"
          iconSrc="/img/my_docs.png"
          onDoubleClick={() => openWindow('documents', 'My Documents', '/img/my_docs.png', <Explorer
            initialPath="My Documents"
            items={[
              { id: 'p1', label: 'Projects', icon: '/img/folder_closed.ico', type: 'folder', onClick: () => openWindow('projects', 'Projects', '/img/folder_open.ico', <ProjectsViewer />) },
              { id: 'cv', label: 'Resume.doc', icon: '/img/wordpad_icons/WordPad-icon-cropped.png', type: 'file', onClick: () => openWindow('cv', 'Resume - WordPad', '/img/wordpad_icons/WordPad-icon-cropped.png', <CVViewer />) },
              { id: 'todo', label: 'Things To Do', icon: '/img/word_icon.png', type: 'file' },
            ]}
          />)}
        />
        <DesktopIcon
          label="Outlook Express"
          iconSrc="/img/outlook_express.png"
          onDoubleClick={() => openWindow('contact', 'Outlook Express', '/img/outlook_express.png', <OutlookExpress />)}
        />
        <DesktopIcon
          label="Paint"
          iconSrc="/img/paint_icon.png"
          onDoubleClick={() => openWindow('paint', 'Paint', '/img/paint_icon.png', <Paint />, { width: 675, height: 506 })}
        />
        <DesktopIcon
          label="Command Prompt"
          iconSrc="/img/cmd.png"
          onDoubleClick={() => openWindow('cmd', 'Command Prompt', '/img/cmd.png', <Terminal onExecute={handleExecute} />)}
        />
      </div>

      {/* Windows */}
      {winList.map((win) => {
        // Dialog windows (like System Properties) should only show Close button
        const isDialog = win.id === 'mycomputer';

        return win.isOpen && !win.isMinimized && (
          <Window
            key={win.id}
            title={win.title}
            isActive={activeWindowId === win.id}
            onClose={() => {
              // If closing command prompt, cancel the agent
              if (win.id === 'cmd') {
                cancelAgent();
              }
              closeWindow(win.id);
            }}
            onMinimize={isDialog ? undefined : () => minimizeWindow(win.id)}
            onMaximize={isDialog ? undefined : () => { }}
            onDragEnd={(x, y) => updateWindowPosition(win.id, x, y)}
            onResize={isDialog ? undefined : (width, height) => updateWindowSize(win.id, width, height)}
            // noPadding={win.id === 'cmd'} // Removed to restore standard margins
            style={{
              position: 'absolute',
              top: win.position?.y || 100,
              left: win.position?.x || 100,
              width: win.size?.width || 400,
              height: win.size?.height || 300
            }}
          >
            <div onMouseDown={() => focusWindow(win.id)} style={{ height: '100%' }}>
              {renderComponent(win.id)}
            </div>
          </Window>
        );
      })}

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
        windows={winList.map(w => ({ id: w.id, title: w.title, minimized: w.isMinimized, active: activeWindowId === w.id && w.isOpen }))}
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
