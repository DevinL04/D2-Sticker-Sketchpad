//import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
<h1 class="title">Welcome to Sketchpad</h1>
<canvas id="myCanvas" width="256" height="256"></canvas>
<div id="buttonContainer">
  <button id="clearBtn">Clear</button>
  <button id="redoBtn">Redo</button>
  <button id="undoBtn">Undo</button>
  <button id="thinBtn">Thin Marker</button>
  <button id="thickBtn">Thick Marker</button>
  <button id="customStickerBtn">Custom Sticker</button>
  <button id="exportBtn">Export PNG</button>

</div>
<div id="stickerContainer"></div>
`;

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;
const redoBtn = document.getElementById("redoBtn") as HTMLButtonElement;
const undoBtn = document.getElementById("undoBtn") as HTMLElement;
const thinBtn = document.getElementById("thinBtn") as HTMLButtonElement;
const thickBtn = document.getElementById("thickBtn") as HTMLButtonElement;
const customStickerBtn = document.getElementById(
  "customStickerBtn",
) as HTMLButtonElement;
const stickerContainer = document.getElementById("stickerContainer")!;

type Point = { x: number; y: number };

let currentThickness = 2;
let currentTool: "marker" | "sticker" = "marker";
let currentSticker: string | null = null;
let toolPreview: ToolPreview | StickerPreview | null = null;

interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
  drag?(x: number, y: number): void;
}

// ----- Marker Implementation -----
class MarkerLine implements DisplayCommand {
  points: Point[] = [];
  thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.points.push({ x, y });
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

// ----- Sticker Implementation -----
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
    ctx.font = "32px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
    ctx.restore();
  }
}

// ----- Tool Previews -----
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

// ----- Display List -----
const strokes: DisplayCommand[] = [];
let currentStroke: DisplayCommand | null = null;
const redoStack: DisplayCommand[] = [];

// ----- Sticker Buttons -----
const stickers = ["😊", "⭐", "❤️", "❄️", "🌚", "🧃", "🍉", "❤️‍🔥", "❌"];
function renderStickerButtons() {
  stickerContainer.innerHTML = "";
  stickers.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    btn.addEventListener("click", () => {
      currentTool = "sticker";
      currentSticker = emoji;
      toolPreview = null;
    });
    stickerContainer.appendChild(btn);
  });
}
renderStickerButtons();

customStickerBtn.addEventListener("click", () => {
  const newSticker = prompt("Custom sticker text", "🧽");
  if (newSticker) {
    stickers.push(newSticker);
    renderStickerButtons();
  }
});

// ----- Marker Thickness Buttons -----
thinBtn.addEventListener("click", () => {
  currentThickness = 4;
  currentTool = "marker";
  thinBtn.classList.add("selectedTool");
  thickBtn.classList.remove("selectedTool");
  toolPreview = null;
});
thickBtn.addEventListener("click", () => {
  currentThickness = 12;
  currentTool = "marker";
  thickBtn.classList.add("selectedTool");
  thinBtn.classList.remove("selectedTool");
  toolPreview = null;
});

// ----- Mouse Events -----
canvas.addEventListener("mousedown", (event) => {
  const x = event.offsetX;
  const y = event.offsetY;

  if (currentTool === "marker") {
    currentStroke = new MarkerLine(x, y, currentThickness);
  } else if (currentTool === "sticker" && currentSticker) {
    currentStroke = new StickerCommand(x, y, currentSticker);
  }

  if (currentStroke) strokes.push(currentStroke);
  toolPreview = null;
  render();
});

canvas.addEventListener("mousemove", (event) => {
  const x = event.offsetX;
  const y = event.offsetY;

  if (currentStroke && currentTool === "marker") {
    currentStroke.drag!(x, y);
  } else if (!currentStroke && currentTool === "marker") {
    if (!toolPreview) toolPreview = new ToolPreview(x, y, currentThickness);
    else toolPreview.updatePosition(x, y);
  } else if (!currentStroke && currentTool === "sticker" && currentSticker) {
    if (!toolPreview) toolPreview = new StickerPreview(x, y, currentSticker);
    else toolPreview.updatePosition(x, y);
  }

  render();
});

canvas.addEventListener("mouseup", () => {
  currentStroke = null;
  redoStack.length = 0;
  render();
});
canvas.addEventListener("mouseleave", () => {
  currentStroke = null;
});
globalThis.addEventListener("mouseup", () => {
  currentStroke = null;
});

// ----- Undo / Redo / Clear -----
function undo() {
  if (strokes.length === 0) return;
  redoStack.push(strokes.pop()!);
  render();
}
function redo() {
  if (redoStack.length === 0) return;
  strokes.push(redoStack.pop()!);
  render();
}
function clearCanvas() {
  strokes.length = 0;
  redoStack.length = 0;
  render();
}

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);
clearBtn.addEventListener("click", clearCanvas);

// ----- Render -----
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of strokes) cmd.display(ctx);
  if (toolPreview) toolPreview.draw(ctx);
}

// ----- High Resolution Export -----
const exportBtn = document.getElementById("exportBtn") as HTMLButtonElement;

exportBtn.addEventListener("click", () => {
  // Create a new high-resolution canvas
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;

  // Scale drawing from 256 → 1024 (4x)
  const scaleX = exportCanvas.width / canvas.width;
  const scaleY = exportCanvas.height / canvas.height;
  exportCtx.scale(scaleX, scaleY);

  // Draw all finalized commands (NOT preview shapes)
  for (const cmd of strokes) {
    cmd.display(exportCtx);
  }

  // Download PNG
  const a = document.createElement("a");
  a.href = exportCanvas.toDataURL("image/png");
  a.download = "sketchpad.png";
  a.click();
});
