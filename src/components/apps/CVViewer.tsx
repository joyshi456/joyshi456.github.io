import { forwardRef, useState, useMemo } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize } from '../../extensions/FontSize';

// Windows 98 color palette
const win = {
    face: '#c0c0c0',
    highlight: '#ffffff',
    lightShadow: '#dfdfdf',
    shadow: '#808080',
    darkShadow: '#404040',
    activeCaption: '#000080',
    activeCaptionText: '#ffffff',
};

const STORAGE_KEY = 'wordpad_cv_html_v1';

const DEFAULT_CV_HTML = `
<h2 style="text-align: center; margin-top: 0;">JOY SHI</h2>
<p style="text-align: center;">New York City, USA<br/>joyshi456@gmail.com<br/>github.com/joyshi456</p>
<hr/>
<h3>WORK EXPERIENCE</h3>
<p><strong>Founding Engineer</strong> — Pegasi (Neo '24) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Jul 2025 – Present</p>
<p>Building enterprise agents for financial institutions.</p>
<ul>
  <li>Architected agentic card migration platform generating $350K+ ARR</li>
  <li>First author for financial compliance model and dataset generation paper accepted to NeurIPS 2025</li>
  <li>Built an AI-native "consultant" API for a Fortune 100 financial client</li>
  <li>Implemented GRPO for SOTA performance in Text-to-SQL LLMs</li>
</ul>

<p><strong>Applied AI Engineer</strong> — Monad Ventures &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2024 – 2025</p>
<p>Fine-tuned multilingual LLMs, and A/B testing for robust QA for a large-scale conversational AI product (2M+ users). Implemented evaluation metrics for safety and consistency.</p>

<p><strong>ML Engineer</strong> — Fermilab &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Spring 2023</p>
<p>Developed an anomaly detection model in PyTorch, improving dark shower detection for particle physics lab.</p>

<hr/>
<h3>EDUCATION</h3>
<p><strong>Tsinghua University, Schwarzman College</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2024 – June 2025</p>
<p>Master of Management Science, Richard Merkin Fellow</p>

<p><strong>California Institute of Technology</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2020 – 2024</p>
<p>Bachelor of Science, Computer Science (Machine Learning &amp; AI Track)<br/>GPA: 4.0/4.0</p>

<hr/>
<h3>TECHNICAL SKILLS</h3>
<p><strong>Programming:</strong> Python, C/C++/CUDA, SQL, Java, JavaScript, HTML/CSS, OCaml</p>
<p><strong>AI/ML:</strong> PyTorch, TensorFlow, Keras, Tinker, Distillation, RL</p>
<p><strong>Languages:</strong> English (Native), Mandarin (Native), Spanish (Conversational)</p>
`;

function loadInitial(): string {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_CV_HTML;
}

function download(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Menu Bar Component
function MenuBar({ editor }: { editor: Editor | null }) {
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    if (!editor) return null;

    const MenuItem = ({ label, menuId, children }: { label: string; menuId: string; children: React.ReactNode }) => (
        <div
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={() => setOpenMenu(menuId)}
            onMouseLeave={() => setOpenMenu(null)}
        >
            <button
                style={{
                    padding: '2px 8px',
                    background: openMenu === menuId ? win.face : 'transparent',
                    border: openMenu === menuId ? `1px solid ${win.shadow}` : '1px solid transparent',
                    cursor: 'pointer',
                    fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                    fontSize: '11px',
                }}
                type="button"
            >
                <span style={{ textDecoration: 'underline' }}>{label[0]}</span>{label.slice(1)}
            </button>
            {openMenu === menuId && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        background: win.face,
                        border: `2px solid`,
                        borderTopColor: win.highlight,
                        borderLeftColor: win.highlight,
                        borderRightColor: win.darkShadow,
                        borderBottomColor: win.darkShadow,
                        padding: 2,
                        zIndex: 1000,
                        minWidth: 150,
                    }}
                    onMouseLeave={() => setOpenMenu(null)}
                >
                    {children}
                </div>
            )}
        </div>
    );

    const DropdownItem = ({ label, onClick }: { label: string; onClick: () => void }) => (
        <button
            style={{
                width: '100%',
                textAlign: 'left',
                padding: '4px 8px',
                background: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
                fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                fontSize: '11px',
            }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
                onClick();
                setOpenMenu(null);
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = win.activeCaption;
                e.currentTarget.style.color = win.activeCaptionText;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'black';
            }}
            type="button"
        >
            {label}
        </button>
    );

    const DropdownSep = () => (
        <div style={{ height: 1, background: win.shadow, margin: '2px 0' }} />
    );

    return (
        <div
            style={{
                display: 'flex',
                height: 18,
                backgroundColor: win.face,
                borderBottom: `1px solid ${win.shadow}`,
                paddingLeft: 2,
                alignItems: 'center',
            }}
        >
            <MenuItem label="File" menuId="file">
                <DropdownItem
                    label="New"
                    onClick={() => {
                        if (confirm('Start a new document? Unsaved changes will be lost.')) {
                            editor.commands.setContent(DEFAULT_CV_HTML);
                            localStorage.setItem(STORAGE_KEY, DEFAULT_CV_HTML);
                        }
                    }}
                />
                <DropdownSep />
                <DropdownItem
                    label="Save as HTML"
                    onClick={() => download('Resume.html', editor.getHTML())}
                />
                <DropdownItem
                    label="Save as TXT"
                    onClick={() => download('Resume.txt', editor.getText())}
                />
            </MenuItem>
            <MenuItem label="Edit" menuId="edit">
                <DropdownItem label="Undo" onClick={() => editor.chain().focus().undo().run()} />
                <DropdownItem label="Redo" onClick={() => editor.chain().focus().redo().run()} />
                <DropdownSep />
                <DropdownItem label="Select All" onClick={() => editor.chain().focus().selectAll().run()} />
            </MenuItem>
            <MenuItem label="View" menuId="view">
                <DropdownItem label="Ruler" onClick={() => {}} />
            </MenuItem>
            <MenuItem label="Insert" menuId="insert">
                <DropdownItem label="Date and Time" onClick={() => {
                    const now = new Date().toLocaleString();
                    editor.chain().focus().insertContent(now).run();
                }} />
            </MenuItem>
            <MenuItem label="Format" menuId="format">
                <DropdownItem label="Font..." onClick={() => {}} />
            </MenuItem>
            <MenuItem label="Help" menuId="help">
                <DropdownItem label="Help Topics" onClick={() => {}} />
            </MenuItem>
        </div>
    );
}

// Toolbar Button Component
function ToolbarButton({
    icon,
    label,
    active,
    onClick,
    isText = false,
}: {
    icon: string;
    label: string;
    active?: boolean;
    onClick: () => void;
    isText?: boolean;
}) {
    const [isPressed, setIsPressed] = useState(false);

    return (
        <button
            onMouseDown={(e) => {
                e.preventDefault();
                setIsPressed(true);
            }}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onClick={onClick}
            title={label}
            style={{
                width: 23,
                height: 22,
                background: active || isPressed ? win.shadow : win.face,
                border: active || isPressed ? `1px solid ${win.darkShadow}` : `1px solid ${win.highlight}`,
                borderRightColor: active || isPressed ? win.highlight : win.shadow,
                borderBottomColor: active || isPressed ? win.highlight : win.shadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '12px',
                padding: 0,
                marginRight: 1,
                fontWeight: label === 'B' ? 'bold' : 'normal',
                fontStyle: label === 'I' ? 'italic' : 'normal',
                textDecoration: label === 'U' ? 'underline' : 'none',
            }}
            type="button"
        >
            {isText ? (
                icon
            ) : (
                <img
                    src={icon}
                    alt={label}
                    style={{
                        width: 16,
                        height: 16,
                        imageRendering: 'pixelated',
                    }}
                />
            )}
        </button>
    );
}

// Toolbars Component
function Toolbars({ editor }: { editor: Editor | null }) {
    if (!editor) return null;

    const prevent = (e: React.MouseEvent) => e.preventDefault();

    return (
        <>
            {/* Toolbar Row 1 - File operations */}
            <div
                style={{
                    display: 'flex',
                    height: 26,
                    backgroundColor: win.face,
                    borderBottom: `1px solid ${win.shadow}`,
                    padding: '2px 3px',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <ToolbarButton icon="/img/wordpad_icons/WordPad-new.png" label="New" onClick={() => {
                    if (confirm('Start new document?')) {
                        editor.commands.setContent(DEFAULT_CV_HTML);
                    }
                }} />
                <ToolbarButton icon="/img/wordpad_icons/WordPad-open.png" label="Open" onClick={() => {}} />
                <ToolbarButton icon="/img/wordpad_icons/WordPad-save.png" label="Save" onClick={() => download('Resume.html', editor.getHTML())} />
                <div style={{ width: 1, height: 20, backgroundColor: win.shadow, margin: '0 2px' }} />
                <ToolbarButton icon="/img/wordpad_icons/WordPad-print.png" label="Print" onClick={() => window.print()} />
                <ToolbarButton icon="/img/wordpad_icons/WordPad-print-preview.png" label="Print Preview" onClick={() => {}} />
                <div style={{ width: 1, height: 20, backgroundColor: win.shadow, margin: '0 2px' }} />
                <ToolbarButton icon="/img/wordpad_icons/WordPad-find.png" label="Find" onClick={() => {}} />
                <ToolbarButton icon="/img/wordpad_icons/WordPad-cut.png" label="Cut" onClick={() => document.execCommand('cut')} />
                <ToolbarButton icon="/img/wordpad_icons/WordPad-copy.png" label="Copy" onClick={() => document.execCommand('copy')} />
                <ToolbarButton icon="/img/wordpad_icons/WordPad-paste.png" label="Paste" onClick={() => {}} />
                <ToolbarButton icon="/img/wordpad_icons/WordPad-undo.png" label="Undo" onClick={() => editor.chain().focus().undo().run()} />
            </div>

            {/* Toolbar Row 2 - Formatting */}
            <div
                style={{
                    display: 'flex',
                    height: 26,
                    backgroundColor: win.face,
                    borderBottom: `1px solid ${win.shadow}`,
                    padding: '2px 3px',
                    alignItems: 'center',
                    gap: 3,
                }}
            >
                {/* Font dropdown */}
                <select
                    onMouseDown={prevent}
                    onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                    style={{
                        width: 130,
                        height: 20,
                        fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                        fontSize: '11px',
                        border: `1px solid ${win.shadow}`,
                        backgroundColor: win.highlight,
                    }}
                    defaultValue="Times New Roman"
                >
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Tahoma">Tahoma</option>
                </select>

                {/* Size dropdown */}
                <select
                    onMouseDown={prevent}
                    onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
                    style={{
                        width: 50,
                        height: 20,
                        fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                        fontSize: '11px',
                        border: `1px solid ${win.shadow}`,
                        backgroundColor: win.highlight,
                    }}
                    defaultValue="12pt"
                >
                    {['8pt', '10pt', '12pt', '14pt', '16pt', '18pt', '24pt', '36pt'].map((s) => (
                        <option key={s} value={s}>
                            {s.replace('pt', '')}
                        </option>
                    ))}
                </select>

                <div style={{ width: 1, height: 20, backgroundColor: win.shadow, margin: '0 2px' }} />

                <ToolbarButton
                    icon="B"
                    label="B"
                    isText={true}
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolbarButton
                    icon="I"
                    label="I"
                    isText={true}
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <ToolbarButton
                    icon="U"
                    label="U"
                    isText={true}
                    active={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                />

                <div style={{ width: 1, height: 20, backgroundColor: win.shadow, margin: '0 2px' }} />

                <ToolbarButton
                    icon="≡"
                    label="Align Left"
                    isText={true}
                    active={editor.isActive({ textAlign: 'left' })}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                />
                <ToolbarButton
                    icon="≣"
                    label="Align Center"
                    isText={true}
                    active={editor.isActive({ textAlign: 'center' })}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                />
                <ToolbarButton
                    icon="≡"
                    label="Align Right"
                    isText={true}
                    active={editor.isActive({ textAlign: 'right' })}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                />

                <div style={{ width: 1, height: 20, backgroundColor: win.shadow, margin: '0 2px' }} />

                <ToolbarButton
                    icon="•"
                    label="Bullets"
                    isText={true}
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                />

                <div style={{ width: 1, height: 20, backgroundColor: win.shadow, margin: '0 2px' }} />

                {/* Color picker */}
                <label
                    style={{
                        width: 23,
                        height: 22,
                        background: win.face,
                        border: `1px solid ${win.highlight}`,
                        borderRightColor: win.shadow,
                        borderBottomColor: win.shadow,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                    }}
                    onMouseDown={prevent}
                >
                    <img
                        src="/img/wordpad_icons/WordPad-color.png"
                        alt="Text Color"
                        style={{
                            width: 16,
                            height: 16,
                            imageRendering: 'pixelated',
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        type="color"
                        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                        style={{
                            position: 'absolute',
                            opacity: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer',
                        }}
                        title="Text Color"
                    />
                </label>
            </div>
        </>
    );
}

// Status Bar Component
function StatusBar({ editor }: { editor: Editor | null }) {
    const text = editor?.getText() ?? '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    return (
        <div
            style={{
                height: 20,
                display: 'flex',
                alignItems: 'center',
                borderTop: `1px solid ${win.highlight}`,
                backgroundColor: win.face,
                padding: '0 4px',
                fontSize: '11px',
                fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
            }}
        >
            <div style={{ flex: 1 }}>For Help, press F1</div>
            <div style={{ marginRight: 8 }}>{words} words</div>
            {/* Resize grip */}
            <div
                style={{
                    width: 12,
                    height: 12,
                    backgroundImage: `repeating-linear-gradient(
                        45deg,
                        ${win.shadow} 0px,
                        ${win.shadow} 1px,
                        transparent 1px,
                        transparent 3px
                    )`,
                    cursor: 'nwse-resize',
                }}
            />
        </div>
    );
}

// Main CVViewer Component
export const CVViewer = forwardRef<HTMLDivElement>((_, ref) => {
    const initial = useMemo(() => loadInitial(), []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            FontFamily,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            FontSize,
        ],
        content: initial,
        editorProps: {
            attributes: {
                class: 'wp-editor',
                spellcheck: 'false',
            },
        },
        onUpdate: ({ editor }) => {
            localStorage.setItem(STORAGE_KEY, editor.getHTML());
        },
    });

    return (
        <div
            ref={ref}
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: win.face,
                fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                fontSize: '11px',
            }}
        >
            <MenuBar editor={editor} />
            <Toolbars editor={editor} />

            {/* Ruler */}
            <div
                style={{
                    height: 20,
                    backgroundColor: win.face,
                    borderBottom: `1px solid ${win.shadow}`,
                    background: `linear-gradient(to right,
                        ${win.face} 0%, ${win.face} 10px,
                        ${win.shadow} 10px, ${win.shadow} 11px,
                        ${win.face} 11px, ${win.face} 20px,
                        ${win.shadow} 20px, ${win.shadow} 21px,
                        ${win.face} 21px)`,
                    backgroundSize: '20px 100%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 40,
                }}
            >
                {/* Left indent marker */}
                <div
                    style={{
                        position: 'absolute',
                        left: 40,
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderTop: `6px solid ${win.darkShadow}`,
                    }}
                />
                {/* Ruler numbers */}
                {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                        key={n}
                        style={{
                            position: 'absolute',
                            left: 40 + n * 60,
                            fontSize: '9px',
                        }}
                    >
                        {n}
                    </div>
                ))}
            </div>

            {/* Editor Surface */}
            <div
                style={{
                    flex: 1,
                    margin: 2,
                    border: `2px solid ${win.darkShadow}`,
                    borderRightColor: win.highlight,
                    borderBottomColor: win.highlight,
                    boxShadow: `inset 1px 1px 0 ${win.shadow}`,
                    backgroundColor: '#ffffff',
                    overflow: 'auto',
                }}
            >
                <EditorContent
                    editor={editor}
                    style={{
                        height: '100%',
                        padding: '20px 40px',
                        fontFamily: '"Times New Roman", Times, serif',
                        fontSize: '12pt',
                        lineHeight: 1.5,
                        minHeight: '100%',
                        color: '#000',
                    }}
                />
            </div>

            <StatusBar editor={editor} />
        </div>
    );
});

CVViewer.displayName = 'CVViewer';
