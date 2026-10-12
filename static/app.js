/* Adaptación del canvas del profesor: trazar, borrar, enviar PNG.
   La red neuronal NO participa en la recolección manual. */
const cfg = window.VOTO_CONFIG;
const draw = document.getElementById('myCanvas');
const ctx = draw.getContext('2d');
const overlay = document.getElementById('ballot-overlay');
const bg = overlay.getContext('2d');
const selCol = document.getElementById('columna');
const selParty = document.getElementById('partido');
const box = {x: 58, y: 58, size: 84};
let strokesByBox = {}; // Ejemplo: "0_2": [[{x,y}, {x,y}], [{x,y},...]]
let currentStroke = null;
let drawing = false;

function key(col = +selCol.value, party = +selParty.value) { return `${col}_${party}`; }
function strokes() { return strokesByBox[key()] || []; }
function selectedRect(col = +selCol.value, party = +selParty.value) {
  return {x: cfg.xs[col], y: cfg.ys[party], width: 54, height: 54};
}
function linePath(context, points) {
  if (!points.length) return;
  context.beginPath();
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = 7;
  context.strokeStyle = '#101010';
  context.moveTo(points[0].x, points[0].y);
  if (points.length === 1) context.lineTo(points[0].x + 0.01, points[0].y + 0.01);
  for (let i=1; i<points.length; i++) context.lineTo(points[i].x, points[i].y);
  context.stroke();
}
function renderCanvas() {
  // Equivalente a clearArea() del profesor, pero dibujamos de nuevo el recuadro.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, draw.width, draw.height);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x, box.y, box.size, box.size);
  for (const points of strokes()) linePath(ctx, points);
}
function renderBallot() {
  bg.clearRect(0,0,overlay.width,overlay.height);
  for (const [slot, lines] of Object.entries(strokesByBox)) {
    const [col, party] = slot.split('_').map(Number);
    const rect = selectedRect(col,party);
    const scale = rect.width / box.size;
    bg.save();
    bg.translate(rect.x - box.x * scale, rect.y - box.y * scale);
    bg.scale(scale,scale);
    for (const points of lines) linePath(bg,points);
    bg.restore();
  }
  const rect = selectedRect();
  bg.strokeStyle = '#d02527';
  bg.lineWidth = 3;
  bg.setLineDash([5,4]);
  bg.strokeRect(rect.x - 1, rect.y - 1, rect.width + 2, rect.height + 2);
  bg.setLineDash([]);
}
function redraw() { renderCanvas(); renderBallot(); }
function getPoint(ev) {
  const r = draw.getBoundingClientRect();
  return {x: Math.min(199, Math.max(0, (ev.clientX-r.left)*draw.width/r.width)),
          y: Math.min(199, Math.max(0, (ev.clientY-r.top)*draw.height/r.height))};
}
draw.addEventListener('pointerdown', ev => {
  if (ev.button !== undefined && ev.button !== 0) return;
  ev.preventDefault();
  draw.setPointerCapture(ev.pointerId);
  drawing = true;
  const k=key();
  if (!strokesByBox[k]) strokesByBox[k]=[];
  currentStroke=[getPoint(ev)];
  strokesByBox[k].push(currentStroke);
  redraw();
});
draw.addEventListener('pointermove', ev => {
  if (!drawing) return;
  currentStroke.push(getPoint(ev));
  redraw();
});
function stopDrawing() { drawing=false; currentStroke=null; }
draw.addEventListener('pointerup', stopDrawing);
draw.addEventListener('pointercancel', stopDrawing);
overlay.addEventListener('click', ev => {
  const r=overlay.getBoundingClientRect();
  const x=(ev.clientX-r.left)*overlay.width/r.width;
  const y=(ev.clientY-r.top)*overlay.height/r.height;
  const col=cfg.xs.findIndex(start => x>=start-3 && x<=start+57);
  const party=cfg.ys.findIndex(start => y>=start && y<=start+54);
  if (col>=0 && party>=0) {selCol.value=col; selParty.value=party; redraw();}
  else say('Para seleccionar, haz clic sobre el recuadro pequeño que contiene el símbolo de un partido.');
});
selCol.addEventListener('change',redraw);
selParty.addEventListener('change',redraw);
document.getElementById('borrar').addEventListener('click',() => {delete strokesByBox[key()];redraw();say('Se borró solamente la casilla seleccionada.');});
document.getElementById('borrar-todo').addEventListener('click',()=> {strokesByBox={};redraw();say('Lienzo limpio.');});
function say(message, css='') {
  const e=document.getElementById('mensaje'); e.textContent=message; e.className='message '+css;
}
function pngOfSlot(slot) {
  const save=key();
  const [col,party]=slot.split('_');
  selCol.value=col; selParty.value=party;
  renderCanvas();
  const image=draw.toDataURL('image/png');
  const [oldC,oldP]=save.split('_');
  selCol.value=oldC;selParty.value=oldP;
  renderCanvas();
  return image;
}
function hasMark(slot) {return (strokesByBox[slot] || []).length>0;}
  fetch('/api/modelo').then(r=>r.json()).then(data=>{
    document.getElementById('ml-status').textContent=data.entrenado
      ? 'Hay archivos de modelo entrenado (se cargarán al registrar).'
      : 'Aún no existe un modelo entrenado. Primero hay que recolectar muestras y usar Colab.';
  });
  document.getElementById('registrar').addEventListener('click',async()=>{
    const marks=[];
    for(const slot of Object.keys(strokesByBox)) if(hasMark(slot)){
      const [col,party]=slot.split('_').map(Number);
      marks.push({columna:col,partido:party,imagen:pngOfSlot(slot)});
    }
    redraw();
    const button=document.getElementById('registrar');button.disabled=true;
    try{
      const r=await fetch('/api/registrar-voto',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({marcas:marks})});
      const d=await r.json();if(!r.ok)throw Error(d.error||'No se pudo registrar.');
      strokesByBox={};redraw();
      say(`Cédula de práctica registrada. ${d.pendientes} columna(s) pendiente(s) de revisión humana.`, 'ok');
      const a=document.createElement('a');a.href='/resultados';a.textContent='Ver resultados simulados';
      document.getElementById('mensaje').append(' · ',a);
    }catch(err){say(err.message,'error');}finally{button.disabled=false;}
  });
redraw();
