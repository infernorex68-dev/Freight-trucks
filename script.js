(function(){
"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const seg=(p,a,b)=>clamp((p-a)/(b-a));
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const lerp=(a,b,t)=>a+(b-a)*t;

/* split text into word spans */
function wordify(el){const words=el.textContent.trim().split(/\s+/);el.innerHTML=words.map(w=>`<span class="w">${w}</span>`).join(" ");return [...el.querySelectorAll(".w")]}
const W1=wordify($("#h1a")),W2=wordify($("#h1b")),WS=wordify($("#stmt"));
function reveal(ws,t){const n=ws.length;ws.forEach((w,i)=>{w.style.opacity=lerp(.0,1,clamp(t*n-i))})}
function revealDim(ws,t){const n=ws.length;ws.forEach((w,i)=>{w.style.opacity=lerp(.14,1,clamp(t*n*1.1-i))})}

function prog(sec){const r=sec.getBoundingClientRect();const h=sec.offsetHeight-innerHeight;return h>0?clamp(-r.top/h):(r.top<innerHeight?1:0)}
const S={hero:$("#hero"),stmt:$("#statement"),bridge:$("#bridge"),reveal:$("#reveal"),fleet:$("#fleet"),net:$("#network")};

/* ---------- reveal name measurement ---------- */
const rests=$$("#name .rest"),gaps=$$("#name .gap");let restW=[];
function measure(){rests.forEach(r=>r.style.maxWidth="none");restW=rests.map(r=>r.scrollWidth)}
addEventListener("resize",measure);document.fonts&&document.fonts.ready.then(measure);measure();

/* ---------- nav theme ---------- */
const nav=$("#nav");let heroDark=false;
function navTheme(){const y=40;let theme="light";for(const s of $$("[data-nav]")){const r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>y){theme=s.dataset.nav;if(s.id==="hero"&&heroDark)theme="dark";break}}nav.classList.toggle("dark",theme==="dark")}

/* ---------- frame ---------- */
const ph=$("#heroPhoto"),bl=$("#heroBlue"),hint=$("#hint"),h1b=$("#h1b");
function frame(){
  // hero
  let p=prog(S.hero);
  if(reduce){p=Math.min(p,.3)}
  const t1=seg(p,.06,.36),t2=seg(p,.42,.66),t3=seg(p,.62,.92);
  reveal(W1,t1); W1.forEach(w=>w.style.opacity=String(Number(w.style.opacity)*(1-t2)));
  reveal(W2,t3); h1b.setAttribute("aria-hidden",t3<.5?"true":"false");
  ph.style.transform=`scale(${1+.14*ease(p)}) translateX(${-3*ease(p)}%)`;
  bl.style.transform=ph.style.transform;
  ph.style.opacity=1-t2; bl.style.opacity=t2;
  hint.style.opacity=1-seg(p,0,.06);
  heroDark=t2>.5;

  // statement
  const ps=prog(S.stmt);revealDim(WS,reduce?1:seg(ps,.08,.8));trailsOn=ps>0&&ps<1;

  // bridge
  const pb=prog(S.bridge);const up=reduce?1:ease(seg(pb,0,.34));
  $("#panel").style.transform=`translateY(${(1-up)*100}%)`;
  const hls=$$("#bridgeText .hl");hls.forEach((h,i)=>{const t=reduce?1:seg(pb,.4+i*.14,.52+i*.14);h.style.backgroundSize=`${t*100}% 100%`});

  // reveal
  const pr=reduce?1:prog(S.reveal);
  const tp=ease(seg(pr,0,.2)),tt=seg(pr,.2,.34),tc=ease(seg(pr,.42,.64)),tz=ease(seg(pr,.7,.9));
  $("#tealPanel").style.transform=`translateY(${(1-tp)*100}%)`;
  $("#tealPanel").style.opacity=1-tz;
  const nm=$("#name");nm.style.opacity=tt;$("#pre").style.opacity=tt*(1-tc);
  rests.forEach((r,i)=>{r.style.maxWidth=(restW[i]*(1-tc))+"px";r.style.opacity=1-tc});
  gaps.forEach(g=>g.style.width=(lerp(.26,.5,tc)*(1-tz)+.04*tz)+"em");
  const c=Math.round(lerp(255,20,tz));nm.style.color=`rgb(${c},${c},${c})`;
  nm.style.transform=`scale(${lerp(1,1.35,tz)})`;

  // fleet
  const pf=reduce?1:prog(S.fleet);
  const sw=seg(pf,.15,.6);$("#fleetBlue").style.opacity=sw;
  const sc=$("#scan");sc.style.left=(sw*100)+"%";sc.style.opacity=sw>0&&sw<1?1:0;
  $$(".pin").forEach(pn=>pn.classList.toggle("on",pf>=+pn.dataset.at));
  $("#fleetBlue").style.clipPath=`inset(0 ${100-sw*100}% 0 0)`;$("#fleetBlue").style.opacity=1;

  // network
  netP=reduce?1:seg(prog(S.net),.05,.75);mapOn=prog(S.net)>0&&prog(S.net)<1;

  // fab progress
  $("#fab").style.setProperty("--pr",clamp(scrollY/(document.documentElement.scrollHeight-innerHeight)).toFixed(3));
  navTheme();
}
let ticking=false;
function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(()=>{ticking=false;frame()})}}
addEventListener("scroll",onScroll,{passive:true});addEventListener("resize",onScroll);

/* ---------- split: active claim ---------- */
const claims=$$(".claim"),cardImgs=$$("#card img"),tag=$("#cardTag");
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const i=+e.target.dataset.i;claims.forEach(c=>c.classList.toggle("on",c===e.target));cardImgs.forEach((im,k)=>im.classList.toggle("on",k===i));tag.textContent=e.target.querySelector(".n").textContent}})},{rootMargin:"-45% 0px -45% 0px"});
claims.forEach(c=>io.observe(c));claims[0].classList.add("on");
const io2=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("on")}),{threshold:.25});
$$(".up").forEach(u=>io2.observe(u));

/* ---------- trails canvas ---------- */
const tc=$("#trails"),tx=tc.getContext("2d");let trailsOn=false,TR=[];
function sizeCanvas(cv,ctx){const d=Math.min(devicePixelRatio||1,2);cv.width=cv.clientWidth*d;cv.height=cv.clientHeight*d;ctx.setTransform(d,0,0,d,0,0)}
function initTrails(){sizeCanvas(tc,tx);TR=Array.from({length:7},(_,i)=>({x:tc.clientWidth*(.2+.1*i+Math.random()*.05),a:Math.random()*6,s:.3+Math.random()*.5,w:40+Math.random()*90}))}
function drawTrails(t){
  const w=tc.clientWidth,h=tc.clientHeight;tx.clearRect(0,0,w,h);
  TR.forEach((r,i)=>{tx.beginPath();for(let y=-20;y<h*.62;y+=8){const k=y/h;const x=r.x+Math.sin(y*.006+t*.0004*r.s+r.a)*r.w*k*2.2+Math.sin(t*.0003+i)*20;y<=-12?tx.moveTo(x,y):tx.lineTo(x,y)}
    const g=tx.createLinearGradient(0,0,0,h*.62);g.addColorStop(0,"rgba(255,255,255,0)");g.addColorStop(.35,i%3===0?"rgba(210,234,60,.35)":"rgba(200,210,230,.28)");g.addColorStop(1,"rgba(255,255,255,0)");
    tx.strokeStyle=g;tx.lineWidth=14+i%3*10;tx.filter="blur(10px)";tx.stroke();tx.filter="none";tx.lineWidth=1.2;tx.stroke()})
}

/* ---------- map canvas ---------- */
const mc=$("#map"),mx=mc.getContext("2d");let mapOn=false,netP=0;
const SA=[[16.45,-28.6],[17.1,-29.9],[17.9,-31.3],[18.3,-32.6],[18.4,-33.9],[18.5,-34.3],[19.4,-34.6],[20.0,-34.8],[21.0,-34.4],[22.1,-34.1],[23.4,-34.0],[24.8,-34.2],[25.6,-34.0],[26.5,-33.7],[27.4,-33.2],[27.9,-33.0],[28.8,-32.3],[29.5,-31.6],[30.3,-30.9],[31.0,-29.9],[31.5,-29.0],[32.1,-28.4],[32.4,-27.5],[32.9,-26.9],[32.1,-26.8],[31.98,-25.95],[31.9,-24.4],[31.6,-23.5],[31.3,-22.4],[30.5,-22.3],[29.4,-22.2],[28.0,-22.6],[27.1,-23.5],[26.6,-24.3],[25.8,-25.0],[25.5,-25.7],[24.5,-25.8],[23.0,-25.3],[21.5,-24.8],[20.0,-24.8],[20.0,-28.4],[19.5,-28.6],[18.0,-28.9],[17.4,-28.5],[16.45,-28.6]];
const CITIES=[["Johannesburg",28.05,-26.2,1],["Durban",31.03,-29.86],["Cape Town",18.42,-33.92],["Gqeberha",25.6,-33.96],["East London",27.9,-33.0],["Bloemfontein",26.21,-29.12],["Polokwane",29.45,-23.9],["Mbombela",30.97,-25.47],["Kimberley",24.76,-28.74],["Richards Bay",32.04,-28.78],["Upington",21.25,-28.45]];
let proj,dots=[];
function inPoly(x,y,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c}
function initMap(){
  sizeCanvas(mc,mx);const w=mc.clientWidth,h=mc.clientHeight;const narrow=w<820;
  const lonMin=16,lonMax=33.2,latMin=-35.2,latMax=-21.8;const kx=Math.cos(28*Math.PI/180);
  const mw=(lonMax-lonMin)*kx,mh=(latMax-latMin);const area=narrow?{x:16,y:h*.12,w:w-32,h:h*.5}:{x:w*.36,y:h*.1,w:w*.6,h:h*.82};
  const s=Math.min(area.w/mw,area.h/mh);const ox=area.x+(area.w-mw*s)/2,oy=area.y+(area.h-mh*s)/2;
  proj=(lon,lat)=>[ox+(lon-lonMin)*kx*s,oy+(latMax-lat)*s];
  dots=[];const step=narrow?9:12;
  for(let x=ox;x<ox+mw*s;x+=step)for(let y=oy;y<oy+mh*s;y+=step){const lon=lonMin+(x-ox)/(kx*s),lat=latMax-(y-oy)/s;if(inPoly(lon,lat,SA))dots.push([x,y,Math.random()])}
}
function drawMap(t){
  const w=mc.clientWidth,h=mc.clientHeight;mx.clearRect(0,0,w,h);
  const g=mx.createRadialGradient(w*.66,h*.5,10,w*.66,h*.5,w*.6);g.addColorStop(0,"rgba(210,234,60,.06)");g.addColorStop(1,"rgba(0,0,0,0)");mx.fillStyle=g;mx.fillRect(0,0,w,h);
  dots.forEach(([x,y,r])=>{mx.fillStyle=`rgba(255,255,255,${.12+.1*Math.sin(t*.001+r*6)})`;mx.fillRect(x,y,2,2)});
  const [hx,hy]=proj(CITIES[0][1],CITIES[0][2]);
  CITIES.slice(1).forEach((c,i)=>{
    const n=CITIES.length-1;const tt=clamp(netP*n*1.2-i*1.0);if(tt<=0)return;
    const [x,y]=proj(c[1],c[2]);const mx2=(hx+x)/2,my2=(hy+y)/2-Math.hypot(x-hx,y-hy)*.25;
    mx.strokeStyle="rgba(210,234,60,.85)";mx.lineWidth=1.6;mx.beginPath();
    for(let k=0;k<=40*tt;k++){const u=k/40;const px=(1-u)*(1-u)*hx+2*(1-u)*u*mx2+u*u*x,py=(1-u)*(1-u)*hy+2*(1-u)*u*my2+u*u*y;k?mx.lineTo(px,py):mx.moveTo(px,py)}mx.stroke();
    if(tt>=1&&!(w<820&&i===0)){}
    if(tt>=1){mx.fillStyle="#D2EA3C";mx.beginPath();mx.arc(x,y,3.5,0,7);mx.fill();mx.fillStyle="rgba(255,255,255,.8)";mx.font="500 11px 'Geist Mono',monospace";const lab=c[0].toUpperCase();const lw=mx.measureText(lab).width;mx.fillText(lab,x+8+lw>w-8?x-8-lw:x+8,y+4)}
    // moving truck dot
    if(tt>=1&&!reduce){const u=((t*.00025+i*.13)%1);const px=(1-u)*(1-u)*hx+2*(1-u)*u*mx2+u*u*x,py=(1-u)*(1-u)*hy+2*(1-u)*u*my2+u*u*y;mx.fillStyle="#fff";mx.beginPath();mx.arc(px,py,2.2,0,7);mx.fill()}
  });
  const pulse=(t*.001)%1;mx.strokeStyle=`rgba(210,234,60,${1-pulse})`;mx.lineWidth=1.5;mx.beginPath();mx.arc(hx,hy,6+pulse*22,0,7);mx.stroke();
  mx.fillStyle="#D2EA3C";mx.beginPath();mx.arc(hx,hy,6,0,7);mx.fill();
  mx.fillStyle="#fff";mx.font="600 12px 'Geist Mono',monospace";mx.fillText(w<820?"DEPOT":"JOHANNESBURG · DEPOT",hx+12,hy-12);
}
function loop(t){requestAnimationFrame(loop);if(trailsOn)drawTrails(t);if(mapOn)drawMap(t)}
function initAll(){initTrails();initMap();drawTrails(0);drawMap(0)}
addEventListener("resize",initAll);initAll();requestAnimationFrame(loop);

/* ---------- menu ---------- */
const sheet=$("#sheet"),mb=$("#menuBtn");
function setMenu(on){sheet.classList.toggle("on",on);sheet.setAttribute("aria-hidden",String(!on));mb.setAttribute("aria-expanded",String(on));if(on)$("#sheetClose").focus()}
mb.addEventListener("click",()=>setMenu(true));$("#sheetClose").addEventListener("click",()=>{setMenu(false);mb.focus()});
$$("#sheet a").forEach(a=>a.addEventListener("click",()=>setMenu(false)));
addEventListener("keydown",e=>{if(e.key==="Escape"&&sheet.classList.contains("on")){setMenu(false);mb.focus()}});
$("#fab").addEventListener("click",()=>$("#contact").scrollIntoView({behavior:reduce?"auto":"smooth"}));

/* ---------- quote form ---------- */
$("#qform").addEventListener("submit",e=>{
  e.preventDefault();const v=id=>$(id).value.trim();
  const name=v("#fName"),contact=v("#fContact");
  if(!name||!contact){$("#ferr").textContent=!name?"Add your name so we know who to reply to.":"Add a phone number or email so we can send the quote.";(name?$("#fContact"):$("#fName")).focus();return}
  $("#ferr").textContent="";
  const txt=`Quote request\nName: ${name}\nCompany: ${v("#fCo")||"-"}\nContact: ${contact}\nFrom: ${v("#fFrom")||"-"}\nTo: ${v("#fTo")||"-"}\nLoad: ${$("#fLoad").value}\nDate: ${v("#fDate")||"-"}\nNotes: ${v("#fMore")||"-"}`;
  const d=$("#fdone");d.className="done";d.innerHTML="<b>Your quote request is ready.</b> Copy it and send it to our quotes email or WhatsApp.<pre id='qtxt'></pre><button type='button' class='ghost' id='copy'>Copy request</button>";
  $("#qtxt").textContent=txt;
  $("#copy").addEventListener("click",ev=>{const b=ev.currentTarget;const sel=()=>{const r=document.createRange();r.selectNodeContents($("#qtxt"));const s=getSelection();s.removeAllRanges();s.addRange(r)};
    try{navigator.clipboard.writeText(txt).then(()=>b.textContent="Copied",sel)}catch(_){sel()}});
});

frame();
})();
