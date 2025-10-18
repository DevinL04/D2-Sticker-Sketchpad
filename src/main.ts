import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
<h1 class="title">Welcome to Sketchpad</h1>

  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
 <canvas id="myCanvas" width = "256" height = "256"></canvas>
 <button id = "clearBtn"> Clear </button>
`;

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!; // getting 2d drawing context for the canvas
// ctx is just shorthand naming convention
const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;

let isDrawing = false;
let lastX = 0;
let lastY = 0;

function drawLine(fromX: number, fromY: number, toX: number, toY: number) {
  //ctx is the drawing tools for canvas
  ctx.beginPath(); //starts a new path
  ctx.moveTo(fromX, fromY); //moves the pen to a new position w/ out drawing
  ctx.lineTo(toX, toY); // draws a line from the current point to (x, y)
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.stroke(); //draws the path
  ctx.closePath();
}

// when the mouse is down, begins drawing
canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  lastX = event.offsetX; //offset is the cordinates of the canvas
  lastY = event.offsetY; // not the whole page or window
});

// if the mouse is moving, draw it
canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) return;
  const x = event.offsetX;
  const y = event.offsetY;
  drawLine(lastX, lastY, x, y); //x , y are the current points

  // updates the current points to be the previoius points
  lastX = x;
  lastY = y;
});

//when the mouse is lifted, dont draw
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

// when the mouse is off screen dont draw
canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

// when the mouse is released outside of the canvas
globalThis.addEventListener("mouseup", () => {
  isDrawing = false;
});

//clear button
clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
