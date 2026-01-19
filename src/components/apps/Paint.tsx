import React, { useRef, useEffect, useState, useCallback } from 'react';

// Tool definitions matching the icon files
type ToolType =
    | 'freeform_select' | 'rect_select' | 'eraser' | 'fill'
    | 'color_picker' | 'magnifier' | 'pencil' | 'brush'
    | 'airbrush' | 'text' | 'line' | 'curve'
    | 'rectangle' | 'polygon' | 'ellipse' | 'rounded_rect';

interface Tool {
    id: ToolType;
    name: string;
    icon: string;
}

const TOOLS: Tool[] = [
    { id: 'freeform_select', name: 'Free-Form Select', icon: '/img/paint_icons/01_freeform_select.png' },
    { id: 'rect_select', name: 'Select', icon: '/img/paint_icons/02_rect_select.png' },
    { id: 'eraser', name: 'Eraser/Color Eraser', icon: '/img/paint_icons/03_eraser.png' },
    { id: 'fill', name: 'Fill With Color', icon: '/img/paint_icons/04_fill.png' },
    { id: 'color_picker', name: 'Pick Color', icon: '/img/paint_icons/05_color_picker.png' },
    { id: 'magnifier', name: 'Magnifier', icon: '/img/paint_icons/06_magnifier.png' },
    { id: 'pencil', name: 'Pencil', icon: '/img/paint_icons/07_pencil.png' },
    { id: 'brush', name: 'Brush', icon: '/img/paint_icons/08_brush.png' },
    { id: 'airbrush', name: 'Airbrush', icon: '/img/paint_icons/09_airbrush.png' },
    { id: 'text', name: 'Text', icon: '/img/paint_icons/10_text.png' },
    { id: 'line', name: 'Line', icon: '/img/paint_icons/11_line.png' },
    { id: 'curve', name: 'Curve', icon: '/img/paint_icons/12_curve.png' },
    { id: 'rectangle', name: 'Rectangle', icon: '/img/paint_icons/13_rectangle.png' },
    { id: 'polygon', name: 'Polygon', icon: '/img/paint_icons/14_polygon.png' },
    { id: 'ellipse', name: 'Ellipse', icon: '/img/paint_icons/15_ellipse.png' },
    { id: 'rounded_rect', name: 'Rounded Rectangle', icon: '/img/paint_icons/16_rounded_rect.png' },
];

// Colors from standard Win98 Palette
const COLORS = [
    '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
    '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8080',
];

// Brush sizes
const BRUSH_SIZES = [2, 5, 8, 10];
const ERASER_SIZES = [4, 6, 8, 10];

interface Point {
    x: number;
    y: number;
}

interface Selection {
    x: number;
    y: number;
    width: number;
    height: number;
    imageData: ImageData | null;
    isMoving: boolean;
    offsetX: number;
    offsetY: number;
}

interface PaintProps { }

export const Paint: React.FC<PaintProps> = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const [selectedColor, setSelectedColor] = useState('#000000');
    const [secondaryColor, setSecondaryColor] = useState('#ffffff');
    const [selectedTool, setSelectedTool] = useState<ToolType>('pencil');
    const [brushSize, setBrushSize] = useState(2);
    const [isDrawing, setIsDrawing] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Selection state
    const [selection, setSelection] = useState<Selection | null>(null);
    const [freeformPoints, setFreeformPoints] = useState<Point[]>([]);

    // Text tool state
    const [textPosition, setTextPosition] = useState<Point | null>(null);
    const [textValue, setTextValue] = useState('');

    // Curve tool state (MS Paint style: draw line, then click twice to add control points)
    const [curvePoints, setCurvePoints] = useState<Point[]>([]);
    const [curveStep, setCurveStep] = useState(0); // 0: not started, 1: line drawn, 2: first control, 3: done

    // Polygon tool state
    const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);

    const lastPos = useRef<{ x: number, y: number } | null>(null);
    const shapeStart = useRef<{ x: number, y: number } | null>(null);
    const canvasSnapshot = useRef<ImageData | null>(null);
    const preSelectionSnapshot = useRef<ImageData | null>(null);
    const airbrushInterval = useRef<number | null>(null);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    // Focus text input when text position is set
    useEffect(() => {
        if (textPosition && textInputRef.current) {
            textInputRef.current.focus();
        }
    }, [textPosition]);

    // Get canvas coordinates from mouse event
    const getCanvasCoords = useCallback((e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / zoom,
            y: (e.clientY - rect.top) / zoom
        };
    }, [zoom]);

    // Save canvas state for shape preview
    const saveCanvasState = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvasSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }, []);

    // Restore canvas state
    const restoreCanvasState = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !canvasSnapshot.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.putImageData(canvasSnapshot.current, 0, 0);
    }, []);

    // Clear selection
    const clearSelection = useCallback(() => {
        if (selection && selection.imageData) {
            // Commit the selection to the canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.putImageData(selection.imageData, selection.x, selection.y);
                }
            }
        }
        setSelection(null);
        setFreeformPoints([]);
        preSelectionSnapshot.current = null;
    }, [selection]);

    // Flood fill algorithm
    const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const startIdx = (Math.floor(startY) * canvas.width + Math.floor(startX)) * 4;
        const startR = data[startIdx];
        const startG = data[startIdx + 1];
        const startB = data[startIdx + 2];

        // Parse fill color
        const fillR = parseInt(fillColor.slice(1, 3), 16);
        const fillG = parseInt(fillColor.slice(3, 5), 16);
        const fillB = parseInt(fillColor.slice(5, 7), 16);

        // Don't fill if already the same color
        if (startR === fillR && startG === fillG && startB === fillB) return;

        const stack: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
        const visited = new Set<string>();

        const matchesStart = (idx: number) => {
            return data[idx] === startR && data[idx + 1] === startG && data[idx + 2] === startB;
        };

        while (stack.length > 0) {
            const [x, y] = stack.pop()!;
            const key = `${x},${y}`;

            if (visited.has(key) || x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

            const idx = (y * canvas.width + x) * 4;
            if (!matchesStart(idx)) continue;

            visited.add(key);
            data[idx] = fillR;
            data[idx + 1] = fillG;
            data[idx + 2] = fillB;
            data[idx + 3] = 255;

            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }

        ctx.putImageData(imageData, 0, 0);
    }, []);

    // Pick color from canvas
    const pickColor = useCallback((x: number, y: number, isRightClick: boolean) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        const hex = '#' + [pixel[0], pixel[1], pixel[2]]
            .map(c => c.toString(16).padStart(2, '0'))
            .join('');

        if (isRightClick) {
            setSecondaryColor(hex);
        } else {
            setSelectedColor(hex);
        }
    }, []);

    // Draw with pencil
    const drawPencil = useCallback((x: number, y: number, color: string) => {
        const canvas = canvasRef.current;
        if (!canvas || !lastPos.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }, []);

    // Draw with brush
    const drawBrush = useCallback((x: number, y: number, color: string) => {
        const canvas = canvasRef.current;
        if (!canvas || !lastPos.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }, [brushSize]);

    // Draw with eraser
    const drawEraser = useCallback((x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !lastPos.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }, [brushSize, secondaryColor]);

    // Airbrush spray
    const sprayAirbrush = useCallback((x: number, y: number, color: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const density = 30;
        const radius = brushSize * 2;

        ctx.fillStyle = color;
        for (let i = 0; i < density; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * radius;
            const offsetX = Math.cos(angle) * r;
            const offsetY = Math.sin(angle) * r;
            ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
        }
    }, [brushSize]);

    // Draw line preview
    const drawLinePreview = useCallback((endX: number, endY: number, color: string) => {
        const canvas = canvasRef.current;
        if (!canvas || !shapeStart.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        restoreCanvasState();

        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(shapeStart.current.x, shapeStart.current.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }, [brushSize, restoreCanvasState]);

    // Draw rectangle preview
    const drawRectanglePreview = useCallback((endX: number, endY: number, color: string) => {
        const canvas = canvasRef.current;
        if (!canvas || !shapeStart.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        restoreCanvasState();

        const x = Math.min(shapeStart.current.x, endX);
        const y = Math.min(shapeStart.current.y, endY);
        const width = Math.abs(endX - shapeStart.current.x);
        const height = Math.abs(endY - shapeStart.current.y);

        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.strokeRect(x, y, width, height);
    }, [brushSize, restoreCanvasState]);

    // Draw rounded rectangle preview
    const drawRoundedRectPreview = useCallback((endX: number, endY: number, color: string) => {
        const canvas = canvasRef.current;
        if (!canvas || !shapeStart.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        restoreCanvasState();

        const x = Math.min(shapeStart.current.x, endX);
        const y = Math.min(shapeStart.current.y, endY);
        const width = Math.abs(endX - shapeStart.current.x);
        const height = Math.abs(endY - shapeStart.current.y);
        const radius = Math.min(20, width / 4, height / 4);

        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.stroke();
    }, [brushSize, restoreCanvasState]);

    // Draw ellipse preview
    const drawEllipsePreview = useCallback((endX: number, endY: number, color: string) => {
        const canvas = canvasRef.current;
        if (!canvas || !shapeStart.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        restoreCanvasState();

        const centerX = (shapeStart.current.x + endX) / 2;
        const centerY = (shapeStart.current.y + endY) / 2;
        const radiusX = Math.abs(endX - shapeStart.current.x) / 2;
        const radiusY = Math.abs(endY - shapeStart.current.y) / 2;

        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
    }, [brushSize, restoreCanvasState]);

    // Draw selection rectangle (marching ants style)
    const drawSelectionRect = useCallback((x: number, y: number, width: number, height: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(x, y, width, height);
        ctx.restore();
    }, []);

    // Draw freeform selection path
    const drawFreeformPath = useCallback((points: Point[], closed: boolean = false) => {
        const canvas = canvasRef.current;
        if (!canvas || points.length < 2) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        if (closed) ctx.closePath();
        ctx.stroke();

        ctx.lineDashOffset = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        if (closed) ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }, []);

    // Draw Bezier curve
    const drawCurve = useCallback((points: Point[], color: string, preview: boolean = false) => {
        const canvas = canvasRef.current;
        if (!canvas || points.length < 2) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (preview) restoreCanvasState();

        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        if (points.length === 2) {
            // Just a line
            ctx.lineTo(points[1].x, points[1].y);
        } else if (points.length === 3) {
            // Quadratic curve with one control point
            ctx.quadraticCurveTo(points[2].x, points[2].y, points[1].x, points[1].y);
        } else if (points.length >= 4) {
            // Cubic Bezier with two control points
            ctx.bezierCurveTo(points[2].x, points[2].y, points[3].x, points[3].y, points[1].x, points[1].y);
        }
        ctx.stroke();
    }, [brushSize, restoreCanvasState]);

    // Draw polygon
    const drawPolygon = useCallback((points: Point[], color: string, closed: boolean = false, preview: boolean = false) => {
        const canvas = canvasRef.current;
        if (!canvas || points.length < 1) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (preview) restoreCanvasState();

        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        if (closed) ctx.closePath();
        ctx.stroke();
    }, [brushSize, restoreCanvasState]);

    // Commit text to canvas
    const commitText = useCallback(() => {
        if (!textPosition || !textValue) {
            setTextPosition(null);
            setTextValue('');
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.font = '16px "MS Sans Serif", Arial, sans-serif';
        ctx.fillStyle = selectedColor;
        ctx.textBaseline = 'top';
        ctx.fillText(textValue, textPosition.x, textPosition.y);

        setTextPosition(null);
        setTextValue('');
    }, [textPosition, textValue, selectedColor]);

    // Create selection from freeform points
    const createFreeformSelection = useCallback(() => {
        if (freeformPoints.length < 3) {
            setFreeformPoints([]);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Find bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of freeformPoints) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        const x = Math.floor(minX);
        const y = Math.floor(minY);
        const width = Math.ceil(maxX - minX);
        const height = Math.ceil(maxY - minY);

        if (width <= 0 || height <= 0) {
            setFreeformPoints([]);
            return;
        }

        // Save canvas state before selection
        preSelectionSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Create a mask for the freeform selection
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d')!;

        // Draw the selection path as a mask
        tempCtx.fillStyle = '#000000';
        tempCtx.beginPath();
        tempCtx.moveTo(freeformPoints[0].x, freeformPoints[0].y);
        for (let i = 1; i < freeformPoints.length; i++) {
            tempCtx.lineTo(freeformPoints[i].x, freeformPoints[i].y);
        }
        tempCtx.closePath();
        tempCtx.fill();

        // Get the masked image data
        const sourceData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const maskData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
        const resultData = ctx.createImageData(width, height);

        // Copy pixels within the mask
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const srcIdx = ((y + py) * canvas.width + (x + px)) * 4;
                const maskIdx = srcIdx;
                const dstIdx = (py * width + px) * 4;

                if (maskData.data[maskIdx + 3] > 0) {
                    resultData.data[dstIdx] = sourceData.data[srcIdx];
                    resultData.data[dstIdx + 1] = sourceData.data[srcIdx + 1];
                    resultData.data[dstIdx + 2] = sourceData.data[srcIdx + 2];
                    resultData.data[dstIdx + 3] = sourceData.data[srcIdx + 3];

                    // Fill the original area with background color
                    sourceData.data[srcIdx] = parseInt(secondaryColor.slice(1, 3), 16);
                    sourceData.data[srcIdx + 1] = parseInt(secondaryColor.slice(3, 5), 16);
                    sourceData.data[srcIdx + 2] = parseInt(secondaryColor.slice(5, 7), 16);
                    sourceData.data[srcIdx + 3] = 255;
                } else {
                    resultData.data[dstIdx + 3] = 0; // Transparent
                }
            }
        }

        ctx.putImageData(sourceData, 0, 0);

        setSelection({
            x, y, width, height,
            imageData: resultData,
            isMoving: false,
            offsetX: 0,
            offsetY: 0
        });
        setFreeformPoints([]);
    }, [freeformPoints, secondaryColor]);

    // Mouse event handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const coords = getCanvasCoords(e);
        const isRightClick = e.button === 2;
        const color = isRightClick ? secondaryColor : selectedColor;

        // If we have a text input active and click elsewhere, commit the text
        if (textPosition && selectedTool !== 'text') {
            commitText();
        }

        // Handle selection movement
        if (selection && !selection.isMoving) {
            // Check if clicking inside selection
            if (coords.x >= selection.x && coords.x <= selection.x + selection.width &&
                coords.y >= selection.y && coords.y <= selection.y + selection.height) {
                setSelection({
                    ...selection,
                    isMoving: true,
                    offsetX: coords.x - selection.x,
                    offsetY: coords.y - selection.y
                });
                return;
            } else {
                // Clicking outside selection - commit it
                clearSelection();
            }
        }

        lastPos.current = coords;

        switch (selectedTool) {
            case 'rect_select':
                shapeStart.current = coords;
                saveCanvasState();
                setIsDrawing(true);
                break;

            case 'freeform_select':
                setFreeformPoints([coords]);
                saveCanvasState();
                setIsDrawing(true);
                break;

            case 'fill':
                floodFill(coords.x, coords.y, color);
                break;

            case 'color_picker':
                pickColor(coords.x, coords.y, isRightClick);
                break;

            case 'magnifier':
                if (isRightClick) {
                    setZoom(z => Math.max(1, z / 2));
                } else {
                    setZoom(z => Math.min(8, z * 2));
                }
                break;

            case 'text':
                if (textPosition) {
                    commitText();
                }
                setTextPosition(coords);
                setTextValue('');
                break;

            case 'curve':
                if (curveStep === 0) {
                    // Start drawing the initial line
                    shapeStart.current = coords;
                    setCurvePoints([coords]);
                    saveCanvasState();
                    setIsDrawing(true);
                } else if (curveStep === 1) {
                    // Add first control point
                    setCurvePoints(prev => [...prev, coords]);
                    setCurveStep(2);
                    drawCurve([...curvePoints, coords], color, true);
                } else if (curveStep === 2) {
                    // Add second control point and finalize
                    const finalPoints = [...curvePoints, coords];
                    drawCurve(finalPoints, color, true);
                    setCurvePoints([]);
                    setCurveStep(0);
                    canvasSnapshot.current = null;
                }
                break;

            case 'polygon':
                if (polygonPoints.length === 0) {
                    // Start polygon
                    setPolygonPoints([coords]);
                    saveCanvasState();
                } else {
                    // Check if clicking near the first point to close
                    const firstPoint = polygonPoints[0];
                    const dist = Math.sqrt(
                        Math.pow(coords.x - firstPoint.x, 2) +
                        Math.pow(coords.y - firstPoint.y, 2)
                    );
                    if (dist < 10 && polygonPoints.length >= 3) {
                        // Close and finalize polygon
                        drawPolygon(polygonPoints, color, true, true);
                        setPolygonPoints([]);
                        canvasSnapshot.current = null;
                    } else {
                        // Add point
                        setPolygonPoints(prev => [...prev, coords]);
                        drawPolygon([...polygonPoints, coords], color, false, true);
                    }
                }
                break;

            case 'line':
            case 'rectangle':
            case 'ellipse':
            case 'rounded_rect':
                shapeStart.current = coords;
                saveCanvasState();
                setIsDrawing(true);
                break;

            case 'airbrush':
                setIsDrawing(true);
                sprayAirbrush(coords.x, coords.y, color);
                airbrushInterval.current = window.setInterval(() => {
                    if (lastPos.current) {
                        sprayAirbrush(lastPos.current.x, lastPos.current.y, color);
                    }
                }, 50);
                break;

            default:
                setIsDrawing(true);
                break;
        }
    }, [selectedTool, selectedColor, secondaryColor, getCanvasCoords, floodFill, pickColor,
        saveCanvasState, sprayAirbrush, selection, clearSelection, textPosition, commitText,
        curveStep, curvePoints, drawCurve, polygonPoints, drawPolygon]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const coords = getCanvasCoords(e);
        const isRightClick = e.buttons === 2;
        const color = isRightClick ? secondaryColor : selectedColor;

        // Handle selection dragging
        if (selection?.isMoving) {
            setSelection({
                ...selection,
                x: coords.x - selection.offsetX,
                y: coords.y - selection.offsetY
            });

            // Redraw canvas with selection at new position
            const canvas = canvasRef.current;
            if (canvas && preSelectionSnapshot.current) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.putImageData(preSelectionSnapshot.current, 0, 0);
                    if (selection.imageData) {
                        // Create temp canvas for transparent paste
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = selection.width;
                        tempCanvas.height = selection.height;
                        const tempCtx = tempCanvas.getContext('2d')!;
                        tempCtx.putImageData(selection.imageData, 0, 0);
                        ctx.drawImage(tempCanvas, coords.x - selection.offsetX, coords.y - selection.offsetY);
                    }
                }
            }
            return;
        }

        if (!isDrawing && selectedTool !== 'polygon' && selectedTool !== 'curve') return;

        // Show polygon preview line
        if (selectedTool === 'polygon' && polygonPoints.length > 0) {
            drawPolygon([...polygonPoints, coords], color, false, true);
            return;
        }

        // Show curve control point preview
        if (selectedTool === 'curve' && curveStep > 0 && curvePoints.length >= 2) {
            if (curveStep === 1) {
                drawCurve([curvePoints[0], curvePoints[1], coords], color, true);
            } else if (curveStep === 2) {
                drawCurve([...curvePoints, coords], color, true);
            }
            return;
        }

        if (!isDrawing) return;

        switch (selectedTool) {
            case 'rect_select':
                if (shapeStart.current) {
                    restoreCanvasState();
                    const x = Math.min(shapeStart.current.x, coords.x);
                    const y = Math.min(shapeStart.current.y, coords.y);
                    const width = Math.abs(coords.x - shapeStart.current.x);
                    const height = Math.abs(coords.y - shapeStart.current.y);
                    drawSelectionRect(x, y, width, height);
                }
                break;

            case 'freeform_select':
                setFreeformPoints(prev => [...prev, coords]);
                restoreCanvasState();
                drawFreeformPath([...freeformPoints, coords]);
                break;

            case 'pencil':
                drawPencil(coords.x, coords.y, color);
                lastPos.current = coords;
                break;

            case 'brush':
                drawBrush(coords.x, coords.y, color);
                lastPos.current = coords;
                break;

            case 'eraser':
                drawEraser(coords.x, coords.y);
                lastPos.current = coords;
                break;

            case 'airbrush':
                lastPos.current = coords;
                break;

            case 'curve':
                if (curveStep === 0 && shapeStart.current) {
                    // Drawing initial line
                    drawLinePreview(coords.x, coords.y, color);
                }
                break;

            case 'line':
                drawLinePreview(coords.x, coords.y, color);
                break;

            case 'rectangle':
                drawRectanglePreview(coords.x, coords.y, color);
                break;

            case 'ellipse':
                drawEllipsePreview(coords.x, coords.y, color);
                break;

            case 'rounded_rect':
                drawRoundedRectPreview(coords.x, coords.y, color);
                break;
        }
    }, [isDrawing, selectedTool, selectedColor, secondaryColor, getCanvasCoords,
        drawPencil, drawBrush, drawEraser, drawLinePreview, drawRectanglePreview,
        drawEllipsePreview, drawRoundedRectPreview, selection, restoreCanvasState,
        drawSelectionRect, freeformPoints, drawFreeformPath, polygonPoints, drawPolygon,
        curveStep, curvePoints, drawCurve]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        const coords = getCanvasCoords(e);

        // Handle selection drop
        if (selection?.isMoving) {
            setSelection({
                ...selection,
                isMoving: false,
                x: coords.x - selection.offsetX,
                y: coords.y - selection.offsetY
            });
            return;
        }

        if (selectedTool === 'rect_select' && isDrawing && shapeStart.current) {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const x = Math.floor(Math.min(shapeStart.current.x, coords.x));
                    const y = Math.floor(Math.min(shapeStart.current.y, coords.y));
                    const width = Math.floor(Math.abs(coords.x - shapeStart.current.x));
                    const height = Math.floor(Math.abs(coords.y - shapeStart.current.y));

                    if (width > 0 && height > 0) {
                        // Save pre-selection state
                        preSelectionSnapshot.current = canvasSnapshot.current;

                        // Get the selected area
                        const imageData = ctx.getImageData(x, y, width, height);

                        // Fill original area with background color
                        restoreCanvasState();
                        ctx.fillStyle = secondaryColor;
                        ctx.fillRect(x, y, width, height);

                        // Save this as the new pre-selection state
                        preSelectionSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

                        // Draw the selection back
                        ctx.putImageData(imageData, x, y);

                        setSelection({
                            x, y, width, height,
                            imageData,
                            isMoving: false,
                            offsetX: 0,
                            offsetY: 0
                        });
                    }
                }
            }
        }

        if (selectedTool === 'freeform_select' && isDrawing) {
            createFreeformSelection();
        }

        if (selectedTool === 'curve' && curveStep === 0 && shapeStart.current) {
            // Finished drawing initial line
            setCurvePoints([shapeStart.current, coords]);
            setCurveStep(1);
            // Keep the snapshot for further curve manipulation
        }

        setIsDrawing(false);
        lastPos.current = null;
        shapeStart.current = null;

        if (selectedTool !== 'rect_select' && selectedTool !== 'freeform_select' &&
            selectedTool !== 'curve' && selectedTool !== 'polygon') {
            canvasSnapshot.current = null;
        }

        if (airbrushInterval.current) {
            clearInterval(airbrushInterval.current);
            airbrushInterval.current = null;
        }
    }, [selectedTool, isDrawing, getCanvasCoords, selection, secondaryColor, selectedColor,
        restoreCanvasState, createFreeformSelection, curveStep]);

    // Handle double-click for polygon
    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        if (selectedTool === 'polygon' && polygonPoints.length >= 2) {
            const isRightClick = e.button === 2;
            const color = isRightClick ? secondaryColor : selectedColor;
            drawPolygon(polygonPoints, color, true, true);
            setPolygonPoints([]);
            canvasSnapshot.current = null;
        }
    }, [selectedTool, polygonPoints, selectedColor, secondaryColor, drawPolygon]);

    // Get cursor for current tool
    const getCursor = useCallback(() => {
        switch (selectedTool) {
            case 'rect_select':
            case 'freeform_select':
                return 'crosshair';
            case 'pencil':
            case 'brush':
            case 'line':
            case 'curve':
            case 'rectangle':
            case 'polygon':
            case 'ellipse':
            case 'rounded_rect':
                return 'crosshair';
            case 'fill':
                return 'url(data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M1,14 L5,10 L6,12 L3,14 Z" fill="black"/><path d="M5,10 L10,2 L12,4 L7,12 Z" fill="gray" stroke="black"/></svg>) 2 14, auto';
            case 'color_picker':
                return 'url(data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M2,14 L4,10 L6,12 Z" fill="black"/><path d="M4,10 L12,2" stroke="black" stroke-width="2"/></svg>) 2 14, auto';
            case 'eraser':
                return 'url(data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect x="2" y="2" width="12" height="12" fill="white" stroke="black"/></svg>) 8 8, auto';
            case 'magnifier':
                return 'zoom-in';
            case 'airbrush':
                return 'crosshair';
            case 'text':
                return 'text';
            default:
                return 'default';
        }
    }, [selectedTool]);

    // Handle tool change - clear any in-progress operations
    const handleToolChange = useCallback((toolId: ToolType) => {
        // Commit text if switching away from text tool
        if (textPosition) {
            commitText();
        }
        // Clear curve state
        if (curveStep > 0) {
            setCurvePoints([]);
            setCurveStep(0);
            restoreCanvasState();
        }
        // Clear polygon state
        if (polygonPoints.length > 0) {
            setPolygonPoints([]);
            restoreCanvasState();
        }
        // Clear selection when switching to non-select tool
        if (selection && toolId !== 'rect_select' && toolId !== 'freeform_select') {
            clearSelection();
        }
        setSelectedTool(toolId);
    }, [textPosition, commitText, curveStep, polygonPoints, restoreCanvasState, selection, clearSelection]);

    // Tools Panel
    const ToolsPanel = () => (
        <div style={{
            width: 54,
            backgroundColor: '#c0c0c0',
            borderRight: '1px solid #808080',
            padding: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            gap: 0
        }}>
            {TOOLS.map((tool) => {
                const isSelected = selectedTool === tool.id;
                return (
                    <div
                        key={tool.id}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            handleToolChange(tool.id);
                        }}
                        title={tool.name}
                        style={{
                            width: 24,
                            height: 24,
                            borderTop: isSelected ? '1px solid #808080' : '1px solid #ffffff',
                            borderLeft: isSelected ? '1px solid #808080' : '1px solid #ffffff',
                            borderRight: isSelected ? '1px solid #ffffff' : '1px solid #808080',
                            borderBottom: isSelected ? '1px solid #ffffff' : '1px solid #808080',
                            backgroundColor: isSelected ? '#c0c0c0' : '#c0c0c0',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            boxShadow: isSelected ? 'inset 1px 1px 2px rgba(0,0,0,0.3)' : 'none'
                        }}
                    >
                        <img
                            src={tool.icon}
                            alt={tool.name}
                            style={{
                                width: 16,
                                height: 16,
                                imageRendering: 'pixelated',
                                pointerEvents: 'none'
                            }}
                            draggable={false}
                        />
                    </div>
                );
            })}

            {/* Brush/Eraser size selector */}
            {(selectedTool === 'brush' || selectedTool === 'eraser' || selectedTool === 'airbrush' || selectedTool === 'line') && (
                <div style={{
                    width: '100%',
                    marginTop: 8,
                    padding: 2,
                    borderTop: '1px solid #808080',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    {(selectedTool === 'eraser' ? ERASER_SIZES : BRUSH_SIZES).map(size => (
                        <div
                            key={size}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setBrushSize(size);
                            }}
                            style={{
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundColor: brushSize === size ? '#000080' : 'transparent',
                                border: brushSize === size ? '1px dotted #ffffff' : '1px solid transparent'
                            }}
                        >
                            <div style={{
                                width: Math.min(size * 2, 40),
                                height: Math.min(size, 12),
                                backgroundColor: brushSize === size ? '#ffffff' : '#000000',
                                borderRadius: selectedTool === 'brush' ? '50%' : 0
                            }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Color Palette Panel
    const PalettePanel = () => (
        <div style={{
            height: 48,
            backgroundColor: '#c0c0c0',
            borderTop: '1px solid #ffffff',
            padding: 4,
            display: 'flex',
            gap: 10,
            alignItems: 'center'
        }}>
            {/* Current Colors Box */}
            <div style={{
                width: 32, height: 32,
                borderTop: '1px solid #808080', borderLeft: '1px solid #808080',
                borderRight: '1px solid #ffffff', borderBottom: '1px solid #ffffff',
                position: 'relative',
                backgroundColor: '#c0c0c0'
            }}>
                {/* Secondary Back */}
                <div style={{
                    position: 'absolute', top: 8, left: 8, width: 14, height: 14, backgroundColor: secondaryColor,
                    border: '1px solid #808080'
                }} />
                {/* Primary Front */}
                <div style={{
                    position: 'absolute', top: 3, left: 3, width: 14, height: 14, backgroundColor: selectedColor,
                    border: '1px solid #808080', zIndex: 2
                }} />
            </div>

            {/* Palette Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', width: 300, height: 36, alignContent: 'space-between' }}>
                {COLORS.map(c => {
                    const isSelected = c === selectedColor;
                    const isSecondary = c === secondaryColor;
                    return (
                        <div
                            key={c}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.button === 0) {
                                    setSelectedColor(c);
                                } else if (e.button === 2) {
                                    setSecondaryColor(c);
                                }
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            style={{
                                width: 18,
                                height: 16,
                                backgroundColor: c,
                                border: isSelected ? '2px solid #000000' : '1px solid #808080',
                                marginRight: 1,
                                marginBottom: 1,
                                cursor: 'pointer',
                                boxSizing: 'border-box',
                                position: 'relative',
                                outline: isSecondary && !isSelected ? '1px dashed #000' : 'none',
                                outlineOffset: '-2px',
                                userSelect: 'none'
                            }}
                            title={`Left click: drawing color, Right click: background color`}
                        />
                    );
                })}
            </div>

            {/* Zoom indicator */}
            {zoom !== 1 && (
                <div style={{
                    marginLeft: 'auto',
                    marginRight: 8,
                    fontSize: 11,
                    fontFamily: 'MS Sans Serif, Arial, sans-serif'
                }}>
                    Zoom: {zoom}x
                </div>
            )}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#c0c0c0' }}>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left: Tools */}
                <ToolsPanel />

                {/* Center: Canvas Container */}
                <div style={{
                    flex: 1,
                    backgroundColor: '#808080',
                    padding: 3,
                    borderTop: '1px solid #808080', borderLeft: '1px solid #808080',
                    borderRight: '1px solid #ffffff', borderBottom: '1px solid #ffffff',
                    margin: 2,
                    overflow: 'auto',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    position: 'relative'
                }}>
                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={400}
                        style={{
                            backgroundColor: '#ffffff',
                            cursor: getCursor(),
                            boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            imageRendering: zoom > 1 ? 'pixelated' : 'auto'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onDoubleClick={handleDoubleClick}
                        onContextMenu={(e) => e.preventDefault()}
                        data-agent-id="canvas-paint"
                        data-agent-type="canvas"
                    />

                    {/* Text input overlay */}
                    {textPosition && (
                        <input
                            ref={textInputRef}
                            type="text"
                            value={textValue}
                            onChange={(e) => setTextValue(e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                    commitText();
                                } else if (e.key === 'Escape') {
                                    setTextPosition(null);
                                    setTextValue('');
                                }
                            }}
                            onBlur={() => {
                                // Small delay to allow clicking elsewhere to place new text
                                setTimeout(() => commitText(), 100);
                            }}
                            style={{
                                position: 'absolute',
                                left: textPosition.x * zoom + 3,
                                top: textPosition.y * zoom + 3,
                                font: '16px "MS Sans Serif", Arial, sans-serif',
                                color: selectedColor,
                                backgroundColor: '#ffffff',
                                border: '1px dotted #000',
                                outline: 'none',
                                minWidth: 100,
                                padding: '2px 4px',
                                margin: 0,
                                zIndex: 100
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Bottom: Palette */}
            <PalettePanel />
        </div>
    );
};
