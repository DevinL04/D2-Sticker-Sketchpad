import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
<h1 class="title">Welcome to Sketchpad</h1>

  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
 <canvas id="myCanvas" width = "256" height = "256"></canvas>
 <button id = "clearBtn"> Clear </button>
 <button id = "redoBtn"> Redo </button>
 <button id = "undoBtn"> Undo </button>
`;

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
// ctx is just shorthand naming convention
const ctx = canvas.getContext("2d")!; // getting 2d drawing context for the canvas
const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;
const redoBtn = document.getElementById("redoBtn") as HTMLButtonElement;
const undoBtn = document.getElementById("undoBtn") as HTMLElement;
type Point = { x: number; y: number }; //list of points
type Stroke = Point[]; // one continous line
const strokes: Stroke[] = []; //array of strokes, holds all finished strokes
let currentStroke: Stroke = []; // stores points of the current stroke being drawn
const redoStack: Stroke[] = [];

let isDrawing = false;

// Oberver, redraw all strokes
canvas.addEventListener("drawing-changed", () => {
  //clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw each stroke
  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    const firstPoint = stroke[0]; // safe
    ctx.beginPath();
    ctx.moveTo(firstPoint!.x, firstPoint!.y);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i]!.x, stroke[i]!.y);
    }
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.closePath();
  }
});

// mouse events
canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  currentStroke = [{ x: event.offsetX, y: event.offsetY }];
  strokes.push(currentStroke);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// if the mouse is moving, draw it
canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) return;
  const point = { x: event.offsetX, y: event.offsetY };
  currentStroke.push(point);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

//when the mouse is lifted, dont draw
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  redoStack.length = 0;
});

// when the mouse is off screen dont draw
canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

// when the mouse is released outside of the canvas
globalThis.addEventListener("mouseup", () => {
  isDrawing = false;
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
