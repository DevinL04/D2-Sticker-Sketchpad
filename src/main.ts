import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
<h1 class="title">Welcome to Sketchpad</h1>

<p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>

<canvas id="myCanvas" width="256" height="256"></canvas>

<button id="clearBtn">Clear</button>
<button id="redoBtn">Redo</button>
<button id="undoBtn">Undo</button>

<button id="thinBtn">Thin Marker</button>
<button id="thickBtn">Thick Marker</button>

<button id="smileSticker">❄️</button>
<button id="starSticker">🌚</button>
<button id="heartSticker">❤️</button>
`;

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;
const redoBtn = document.getElementById("redoBtn") as HTMLButtonElement;
const undoBtn = document.getElementById("undoBtn") as HTMLElement;

const thinBtn = document.getElementById("thinBtn") as HTMLButtonElement;
const thickBtn = document.getElementById("thickBtn") as HTMLButtonElement;

let currentThickness = 2;
let currentTool: "marker" | "sticker" = "marker";
let currentSticker: string | null = null;

type Point = { x: number; y: number };

interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements DisplayCommand {
  points: Point[] = [];
  thickness: number;

  constructor(startX: number, startY: number, thickness: number) {
    this.points.push({ x: startX, y: startY });
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(this.points[0]!.x, this.points[0]!.y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i]!.x, this.points[i]!.y);
    }
    ctx.strokeStyle = "black";
    ctx.lineWidth = this.thickness;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.closePath();
  }
}

class ToolPreview {
  x: number;
  y: number;
  radius: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.radius = thickness / 2;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
}

class StickerCommand implements DisplayCommand {
  x: number;
  y: number;
  sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = "24px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
    ctx.restore();
  }
}

class StickerPreview {
  x: number;
  y: number;
  sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.font = "24px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
    ctx.restore();
  }
}

// --- State ---
const strokes: DisplayCommand[] = [];
let currentStroke: MarkerLine | StickerCommand | null = null;
const redoStack: DisplayCommand[] = [];
let toolPreview: ToolPreview | StickerPreview | null = null;

// --- Button Events ---
thinBtn.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = 2;
  thinBtn.classList.add("selectedTool");
  thickBtn.classList.remove("selectedTool");
  toolPreview = null;
});

thickBtn.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = 6;
  thickBtn.classList.add("selectedTool");
  thinBtn.classList.remove("selectedTool");
  toolPreview = null;
});

document.getElementById("smileSticker")!.addEventListener("click", () => {
  currentTool = "sticker";
  currentSticker = "❄️";
  toolPreview = null;
});
document.getElementById("starSticker")!.addEventListener("click", () => {
  currentTool = "sticker";
  currentSticker = "🌚";
  toolPreview = null;
});
document.getElementById("heartSticker")!.addEventListener("click", () => {
  currentTool = "sticker";
  currentSticker = "❤️";
  toolPreview = null;
});

// --- Canvas Events ---
canvas.addEventListener("mousedown", (e) => {
  const x = e.offsetX;
  const y = e.offsetY;

  if (currentTool === "marker") {
    currentStroke = new MarkerLine(x, y, currentThickness);
  } else if (currentTool === "sticker" && currentSticker) {
    currentStroke = new StickerCommand(x, y, currentSticker);
  }

  if (currentStroke) strokes.push(currentStroke);
  toolPreview = null;
  render();
});

canvas.addEventListener("mousemove", (e) => {
  const x = e.offsetX;
  const y = e.offsetY;

  if (currentStroke) {
    currentStroke.drag(x, y);
  } else {
    if (currentTool === "sticker" && currentSticker) {
      if (!toolPreview) toolPreview = new StickerPreview(x, y, currentSticker);
      else toolPreview.updatePosition(x, y);
    } else if (currentTool === "marker") {
      if (!toolPreview) toolPreview = new ToolPreview(x, y, currentThickness);
      else toolPreview.updatePosition(x, y);
    }
  }

  render();
});

canvas.addEventListener("mouseup", () => {
  currentStroke = null;
  redoStack.length = 0;
  render();
});
canvas.addEventListener("mouseleave", () => currentStroke = null);
globalThis.addEventListener("mouseup", () => currentStroke = null);

// --- Undo/Redo/Clear ---
function undo() {
  if (!strokes.length) return;
  redoStack.push(strokes.pop()!);
  render();
}
undoBtn.addEventListener("click", undo);

function redo() {
  if (!redoStack.length) return;
  strokes.push(redoStack.pop()!);
  render();
}
redoBtn.addEventListener("click", redo);

clearBtn.addEventListener("click", () => {
  strokes.length = 0;
  redoStack.length = 0;
  toolPreview = null;
  render();
});

// --- Render Function ---
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of strokes) cmd.display(ctx);
  if (toolPreview) toolPreview.draw(ctx);
}
