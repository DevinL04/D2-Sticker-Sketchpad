import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
<h1 class="title">Welcome to Sketchpad</h1>

  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
 <canvas id="myCanvas" width = "256" height = "256"></canvas>
 <button id = "clearBtn"> Clear </button>
 <button id = "redoBtn"> Redo </button>
 <button id = "undoBtn"> Undo </button>
 <button id="thinBtn">Thin Marker</button>
 <button id="thickBtn">Thick Marker</button>
`;

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
// ctx is just shorthand naming convention
const ctx = canvas.getContext("2d")!; // getting 2d drawing context for the canvas
const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;
const redoBtn = document.getElementById("redoBtn") as HTMLButtonElement;
const undoBtn = document.getElementById("undoBtn") as HTMLElement;
type Point = { x: number; y: number }; //list of points
let currentThickness = 2;
//any 0object that has .display(ctx) is a DisplayCommand
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

const strokes: DisplayCommand[] = [];
let currentStroke: MarkerLine | null = null;
const redoStack: DisplayCommand[] = [];
const thinBtn = document.getElementById("thinBtn") as HTMLButtonElement;
const thickBtn = document.getElementById("thickBtn") as HTMLButtonElement;

thinBtn.addEventListener("click", () => {
  currentThickness = 2;
  thinBtn.classList.add("selectedTool");
  thickBtn.classList.remove("selectedTool");
});

thickBtn.addEventListener("click", () => {
  currentThickness = 6;
  thickBtn.classList.add("selectedTool");
  thinBtn.classList.remove("selectedTool");
});

// Oberver, redraw all strokes
canvas.addEventListener("drawing-changed", () => {
  //clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw each stroke
  for (const stroke of strokes) {
    (stroke as MarkerLine).display(ctx);
  }
});

// mouse events
canvas.addEventListener("mousedown", (event) => {
  const x = event.offsetX;
  const y = event.offsetY;
  currentStroke = new MarkerLine(x, y, currentThickness);
  strokes.push(currentStroke);
});

// if the mouse is moving, draw it
canvas.addEventListener("mousemove", (event) => {
  if (!currentStroke) return;
  const x = event.offsetX;
  const y = event.offsetY;
  currentStroke.drag(x, y);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

//when the mouse is lifted, dont draw
canvas.addEventListener("mouseup", () => {
  currentStroke = null;
  redoStack.length = 0;
});

// when the mouse is off screen dont draw
canvas.addEventListener("mouseleave", () => {
  currentStroke = null;
});

// when the mouse is released outside of the canvas
globalThis.addEventListener("mouseup", () => {
  currentStroke = null;
});

function undo() {
  if (strokes.length === 0) return; // nothing to undo
  const removedStroke = strokes.pop()!;
  redoStack.push(removedStroke);
  canvas.dispatchEvent(new Event("drawing-changed"));
}
undoBtn.addEventListener("click", undo);

function redo() {
  if (redoStack.length === 0) return; // nothing to redo
  const restoredStroke = redoStack.pop()!;
  strokes.push(restoredStroke);
  canvas.dispatchEvent(new Event("drawing-changed"));
}

redoBtn.addEventListener("click", redo);

//clear button
clearBtn.addEventListener("click", () => {
  strokes.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});
