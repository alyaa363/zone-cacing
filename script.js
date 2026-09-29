const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");
const scoreEl=document.getElementById("score"),timeEl=document.getElementById("time");
const livesEl=document.getElementById("lives");
const startScreen=document.getElementById("startScreen"),gameOverScreen=document.getElementById("gameOverScreen");
const finalScore=document.getElementById("finalScore");
const CELL=20,COLS=45,ROWS=28,GAME_TIME=200;
let snake=[],enemies=[],foods=[],score=0,timeLeft=GAME_TIME;
let direction={x:1,y:0},nextDirection={x:1,y:0},color="#55e878";
let running=false,timer=null,moveTimer=null,audioCtx=null,musicTimer=null;
let lives=3, moveDelay=150;

const foodTypes=[
 {emoji:"🍎",value:10},{emoji:"🍓",value:15},{emoji:"🍇",value:20},
 {emoji:"🍊",value:12},{emoji:"🍉",value:25}
];

document.querySelectorAll(".color").forEach(button=>{
 button.addEventListener("click",function(){
  document.querySelectorAll(".color").forEach(b=>b.classList.remove("active"));
  this.classList.add("active");
  color=this.dataset.color;
 });
});

function same(a,b){return a.x===b.x&&a.y===b.y}
function randomCell(){return{x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)}}
function occupied(p){
 return snake.some(x=>same(x,p)) || enemies.some(e=>e.body.some(x=>same(x,p)));
}
function spawnFood(){
 let p;
 do{p=randomCell()}while(occupied(p)||foods.some(f=>same(f,p)));
 foods.push({x:p.x,y:p.y,type:foodTypes[Math.floor(Math.random()*foodTypes.length)]});
}
function makeEnemy(x,y,c){
 return {body:[{x,y},{x:x-1,y},{x:x-2,y},{x:x-3,y}],direction:{x:1,y:0},color:c,counter:0};
}
function resetGame(){
 snake=[{x:10,y:14},{x:9,y:14},{x:8,y:14},{x:7,y:14}];
 enemies=[makeEnemy(33,7,"#ff5d5d"),makeEnemy(31,21,"#4db5ff"),makeEnemy(18,6,"#b66cff")];
 foods=[];score=0;timeLeft=GAME_TIME;lives=3;moveDelay=150;
 direction={x:1,y:0};nextDirection={x:1,y:0};
 for(let i=0;i<13;i++)spawnFood();
 scoreEl.textContent=score;timeEl.textContent=timeLeft;livesEl.textContent="3 ❤️";
 draw();
}
function startGame(){
 resetGame();
 running=true;
 startScreen.classList.add("hidden");
 gameOverScreen.classList.add("hidden");
 clearInterval(timer);clearInterval(moveTimer);
 startMusic();
 timer=setInterval(()=>{
  if(!running)return;
  timeLeft--;timeEl.textContent=timeLeft;
  if(timeLeft<=0)endGame();
 },1000);
 moveTimer=setInterval(gameLoop,moveDelay);
}
function loseLife(){
 if(!running)return;
 lives--;
 livesEl.textContent = lives+" ❤️";
 beep(180,.18);
 if(lives<=0){ endGame(); return; }
 // Respawn in a safe center area and keep progress
 snake=[{x:10,y:14},{x:9,y:14},{x:8,y:14},{x:7,y:14}];
 direction={x:1,y:0}; nextDirection={x:1,y:0};
 // speed increases with size/score after each survival
 moveDelay=Math.max(55,150-Math.floor(snake.length/4)*4-Math.floor(score/50)*3);
 clearInterval(moveTimer);
 moveTimer=setInterval(gameLoop,moveDelay);
 draw();
}

function endGame(){
 if(!running)return;
 running=false;
 clearInterval(timer);clearInterval(moveTimer);
 timer=null;moveTimer=null;
 stopMusic();
 finalScore.textContent=score;
 gameOverScreen.classList.remove("hidden");
}
function gameLoop(){
 if(!running)return;
 direction=nextDirection;
 const head={x:snake[0].x+direction.x,y:snake[0].y+direction.y};

 // Benturan pemain dengan dinding, diri sendiri, atau SEMUA bagian cacing lawan = mati
 if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||
    snake.slice(1).some(p=>same(p,head))||
    enemies.some(e=>e.body.some(p=>same(p,head)))){
   loseLife();
   return;
 }
 snake.unshift(head);
 // Cacing makin panjang = gerak makin cepat
 const newDelay=Math.max(55,150-Math.floor(snake.length/4)*4-Math.floor(score/50)*3);
 if(newDelay!==moveDelay){ moveDelay=newDelay; clearInterval(moveTimer); moveTimer=setInterval(gameLoop,moveDelay); }
 const eaten=foods.findIndex(f=>same(f,head));
 if(eaten!==-1){
  score+=foods[eaten].type.value;
  scoreEl.textContent=score;
  foods.splice(eaten,1);
  spawnFood();
  beep(650,.08);
 }else{
  snake.pop();
 }
 moveEnemies();
 draw();
}
function moveEnemies(){
 enemies.forEach(e=>{
  e.counter++;
  if(e.counter%20===0){
   const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]
    .filter(d=>!(d.x===-e.direction.x&&d.y===-e.direction.y));
   e.direction=dirs[Math.floor(Math.random()*dirs.length)];
  }
  let head={x:e.body[0].x+e.direction.x,y:e.body[0].y+e.direction.y};
  if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS){
   e.direction={x:-e.direction.x,y:-e.direction.y};
   head={x:e.body[0].x+e.direction.x,y:e.body[0].y+e.direction.y};
  }
  e.body.unshift(head);
  const eaten=foods.findIndex(f=>same(f,head));
  if(eaten!==-1){foods.splice(eaten,1);spawnFood()}else e.body.pop();
 });
}
function draw(){
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle="#10271e";ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.strokeStyle="rgba(255,255,255,.035)";
 for(let x=0;x<=canvas.width;x+=CELL){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}
 for(let y=0;y<=canvas.height;y+=CELL){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}
 foods.forEach(f=>{
  ctx.font="18px Arial";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText(f.type.emoji,f.x*CELL+10,f.y*CELL+10);
 });
 enemies.forEach(e=>drawSnake(e.body,e.color));
 drawSnake(snake,color,true);
}
function drawSnake(body,c,player=false){
 body.forEach((p,i)=>{
  const x=p.x*CELL+2,y=p.y*CELL+2,s=CELL-4;
  ctx.fillStyle="#0005";ctx.beginPath();ctx.roundRect(x+1,y+3,s,s,7);ctx.fill();
  ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,s,s,7);ctx.fill();
  ctx.fillStyle="#ffffff33";ctx.beginPath();ctx.arc(x+5,y+5,2,0,Math.PI*2);ctx.fill();
  if(i===0){
   ctx.fillStyle="#172027";
   ctx.beginPath();ctx.arc(x+6,y+6,2.5,0,Math.PI*2);ctx.arc(x+13,y+6,2.5,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x+5.5,y+5,1,0,Math.PI*2);ctx.arc(x+12.5,y+5,1,0,Math.PI*2);ctx.fill();
  }
 });
}
function setDirection(d){
 if(!running)return;
 if(d.x===-direction.x&&d.y===-direction.y)return;
 nextDirection=d;
}
document.addEventListener("keydown",e=>{
 const k=e.key.toLowerCase();
 if(["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(k))e.preventDefault();
 if(k==="arrowup"||k==="w")setDirection({x:0,y:-1});
 if(k==="arrowdown"||k==="s")setDirection({x:0,y:1});
 if(k==="arrowleft"||k==="a")setDirection({x:-1,y:0});
 if(k==="arrowright"||k==="d")setDirection({x:1,y:0});
});
function startMusic(){
 try{
  if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  else audioCtx.resume();
  stopMusic();
  const notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23];let i=0;
  musicTimer=setInterval(()=>{
   if(!running)return;
   const o=audioCtx.createOscillator(),g=audioCtx.createGain();
   o.type="triangle";o.frequency.value=notes[i++%notes.length];
   g.gain.value=.025;g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.18);
   o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.2);
  },260);
 }catch(err){}
}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
function beep(freq,duration){
 if(!audioCtx)return;
 const o=audioCtx.createOscillator(),g=audioCtx.createGain();
 o.frequency.value=freq;g.gain.value=.04;o.connect(g);g.connect(audioCtx.destination);
 o.start();g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.stop(audioCtx.currentTime+duration);
}

document.getElementById("startBtn").addEventListener("click",startGame);
document.getElementById("restartBtn").addEventListener("click",startGame);
resetGame();
// Joystick untuk PC + Android / semua perangkat
const joystick=document.getElementById("joystick"), stick=document.getElementById("stick");
let joyActive=false;
function joyMove(clientX,clientY){
 const r=joystick.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
 let dx=clientX-cx, dy=clientY-cy, max=r.width*.32;
 const len=Math.hypot(dx,dy)||1, dist=Math.min(max,len);
 stick.style.transform=`translate(${dx/len*dist}px,${dy/len*dist}px)`;
 if(Math.abs(dx)>Math.abs(dy)) setDirection({x:dx>0?1:-1,y:0});
 else if(Math.abs(dy)>8) setDirection({x:0,y:dy>0?1:-1});
}
function joyEnd(){joyActive=false;stick.style.transform="translate(-50%,-50%)";}
joystick.addEventListener("pointerdown",e=>{joyActive=true;joystick.setPointerCapture(e.pointerId);joyMove(e.clientX,e.clientY);});
joystick.addEventListener("pointermove",e=>{if(joyActive)joyMove(e.clientX,e.clientY);});
joystick.addEventListener("pointerup",joyEnd); joystick.addEventListener("pointercancel",joyEnd);

window.addEventListener("blur",()=>{if(joyActive)joyEnd();});
