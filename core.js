// J.A.R.V.I.S. living core for the wake page — the same core the JARVIS web app draws (C:\vis\jarvis\src\jarvis\remote\mobile.py,
// livingCore / holoCore / startCore, copied 2026-10-28 from the 2026-10-27 22:51 "projected hologram" version).
// Only change to the copied code: time runs on coreClock() so the wake page can slow the core down while the PC sleeps
// and speed it up while it wakes (opt.rate). Everything drawn is unchanged.
'use strict';
function coreClock(opt){let acc=(opt&&opt.phase)||0,prev=null;
  return now=>{const dt=prev===null?0:Math.min(.1,Math.max(0,(now-prev)/1000));prev=now;
    acc+=dt*((opt&&typeof opt.rate==='function')?opt.rate():1);return acc;};}
// The PC's living core (LivingCoreScene.qml) redrawn in 2D: plasma shell + geodesic lattice with nodes, iris, the same
// tilted holographic bands (21,-17,-12 / 67,20,-31 / -38,68,24 / 68,-23,10) spinning at the same rates, 16 glyphs, labels.
// Used on the login screen and (smaller, without the labels) on an empty conversation.
function livingCore(cv,opt){if(!cv)return;const ctx=cv.getContext('2d');const labels=!(opt&&opt.labels===false);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const dpr=Math.min(2,window.devicePixelRatio||1);
function resize(){const r=cv.getBoundingClientRect();const w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}}resize();
const D=Math.PI/180;
function rot(p,ax,ay,az){let [x,y,z]=p,c,s;c=Math.cos(ax);s=Math.sin(ax);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(ay);s=Math.sin(ay);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(az);s=Math.sin(az);[x,y]=[x*c-y*s,x*s+y*c];return [x,y,z];}
function proj(p,cx,cy,R){const f=3.4,sc=f/(f-p[2]);return [cx+p[0]*R*sc,cy+p[1]*R*sc,sc,p[2]];}
function band(cx,cy,R,tilt,spin,rgb,width,bright){const N=140,pts=[];for(let i=0;i<=N;i++){const a=i/N*Math.PI*2+spin;pts.push(proj(rot([Math.cos(a),Math.sin(a),0],tilt[0]*D,tilt[1]*D,tilt[2]*D),cx,cy,R));}
  for(const front of [false,true]){ctx.beginPath();let on=false;for(const [x,y,sc,z] of pts){if((z>=-0.02)!==front){on=false;continue;}if(!on){ctx.moveTo(x,y);on=true;}else ctx.lineTo(x,y);}
    ctx.lineWidth=width*(front?1:.7)*dpr;ctx.strokeStyle=`rgba(${rgb},${front?.85:.22})`;ctx.stroke();}
  if(bright){const k=Math.floor(((spin*0.37)%1+1)%1*N),len=Math.floor(N*.16);ctx.beginPath();let on=false;
    for(let i=k;i<k+len;i++){const [x,y,sc,z]=pts[i%N];if(z<-0.02){on=false;continue;}if(!on){ctx.moveTo(x,y);on=true;}else ctx.lineTo(x,y);}
    ctx.lineWidth=width*1.9*dpr;ctx.strokeStyle='rgba(209,246,245,.95)';ctx.shadowColor='rgba(127,216,230,.9)';ctx.shadowBlur=14*dpr;ctx.stroke();ctx.shadowBlur=0;}}
function lattice(cx,cy,R,ay){const tilt=[17*D,ay,11*D];ctx.lineWidth=.8*dpr;
  for(let m=0;m<6;m++){const lon=m*Math.PI/6;ctx.beginPath();let on=false;for(let i=0;i<=72;i++){const la=-Math.PI/2+i/72*Math.PI;const p=rot([Math.cos(la)*Math.cos(lon),Math.sin(la),Math.cos(la)*Math.sin(lon)],...tilt);const [x,y,sc,z]=proj(p,cx,cy,R);if(z<0){on=false;continue;}if(!on){ctx.moveTo(x,y);on=true;}else ctx.lineTo(x,y);}ctx.strokeStyle='rgba(71,185,211,.35)';ctx.stroke();}
  for(let q=-2;q<=2;q++){const la=q*Math.PI/6;ctx.beginPath();let on=false;for(let i=0;i<=72;i++){const lon=i/72*Math.PI*2;const p=rot([Math.cos(la)*Math.cos(lon),Math.sin(la),Math.cos(la)*Math.sin(lon)],...tilt);const [x,y,sc,z]=proj(p,cx,cy,R);if(z<0){on=false;continue;}if(!on){ctx.moveTo(x,y);on=true;}else ctx.lineTo(x,y);}ctx.strokeStyle='rgba(71,185,211,.28)';ctx.stroke();}
  for(let i=0;i<18;i++){const la=Math.asin(-.86+i*1.72/17),lon=i*2.399963;const p=rot([Math.cos(la)*Math.cos(lon),Math.sin(la),Math.cos(la)*Math.sin(lon)],...tilt);const [x,y,sc,z]=proj(p,cx,cy,R);if(z<-.1)continue;ctx.beginPath();ctx.arc(x,y,(z>0?1.6:1)*dpr,0,7);ctx.fillStyle=`rgba(209,246,245,${z>0?.95:.4})`;ctx.fill();}}
let t0=performance.now();const clock=coreClock(opt);
function frame(now){if(opt&&opt.stopWhenGone&&!cv.isConnected)return;resize();const t=reduced?0:clock(now);const W=cv.width,H=cv.height,cx=W/2,cy=H/2,U=Math.min(W,H)/2;ctx.clearRect(0,0,W,H);if(W<4){requestAnimationFrame(frame);return;}
  const breath=1+Math.sin(t*.72)*.016;
  let g=ctx.createRadialGradient(cx,cy,0,cx,cy,U*.46*breath);g.addColorStop(0,'rgba(127,216,230,.22)');g.addColorStop(.55,'rgba(71,185,211,.10)');g.addColorStop(1,'rgba(71,185,211,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,U*.46*breath,0,7);ctx.fill();
  const outer=t*2.8,inner=-t*8.1,orbit=t*5.3;
  band(cx,cy,U*.98,[68,-23,10],-outer*.52*D,'57,121,144',.8,false);
  band(cx,cy,U*.92,[21,-17,-12],-t*1.1*D,'57,121,144',.8,false);
  lattice(cx,cy,U*.40*breath,t*4.3*D);
  g=ctx.createRadialGradient(cx,cy,0,cx,cy,U*.2);g.addColorStop(0,'rgba(236,255,255,1)');g.addColorStop(.25,'rgba(209,246,245,.85)');g.addColorStop(.6,'rgba(127,216,230,.35)');g.addColorStop(1,'rgba(127,216,230,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,U*.2,0,7);ctx.fill();
  ctx.save();ctx.translate(cx,cy);ctx.rotate(inner*D);for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(U*.07,0);ctx.lineTo(U*.13,0);ctx.lineWidth=1.2*dpr;ctx.strokeStyle='rgba(209,246,245,.7)';ctx.stroke();}ctx.restore();
  band(cx,cy,U*.70,[21,-17,-12],outer*D,'117,220,232',1.6,true);
  band(cx,cy,U*.73,[67,20,-31],inner*.6*D,'166,228,240',1.1,true);
  band(cx,cy,U*.61,[-38,68,24],orbit*D,'117,220,232',1.3,true);
  if(labels){ctx.save();ctx.translate(cx,cy);ctx.rotate(-outer*.4*D);ctx.fillStyle='rgba(224,237,242,.35)';ctx.font=`${9*dpr}px "Segoe UI",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    for(let i=0;i<16;i++){const a=i*Math.PI/8;ctx.fillText(String(i),Math.cos(a)*U*.86,Math.sin(a)*U*.86);}ctx.restore();
    ctx.fillStyle='rgba(224,237,242,.95)';ctx.font=`600 ${11*dpr}px "Segoe UI",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('J A R V I S',cx,cy+U*.62);
    ctx.fillStyle='rgba(127,216,230,.85)';ctx.font=`${7.5*dpr}px "Segoe UI",sans-serif`;ctx.fillText('L O C A L   C O R E',cx,cy+U*.76);}
  if(!reduced)requestAnimationFrame(frame);}
requestAnimationFrame(frame);}
// 2026-10-16 20:54 (Owner: "코어가 좀 허접한데 고급진 홀로그램 코어로 완벽하게 바꿔"): the core is drawn on the GPU — a translucent
// lattice sphere with plasma inside and a fresnel rim, the white-hot iris with turning blades, three tilted orbit rings in real 3D
// (comets and electrons run along them, the far side shows dimly through the hologram), a HUD of tick marks and turning arcs,
// drifting data dust and a scan sweep. No WebGL → the 2D core below.
// 2026-10-27 22:51 (Owner: "코어를 아이언맨 홀로그램으로 … 실제 아이언맨에 나오는 홀로그램 느낌으로" → "해"): a projected hologram — the globe
// floats above a projector disc at the bottom of the circle, a light cone with rising motes reaches up to it, the globe is a
// see-through triangulated wireframe, two flat notched schematic rings turn around its equator, three small schematic panels
// (one warm amber) hang beside it on leader lines, and the whole picture carries scanlines, a slow bright band rolling up, a
// flicker and a rare one-frame slice glitch. No film frame, logo or reactor is copied — only the feel of a projected hologram.
// 23:00 (Owner: "홀로그램에 아이언맨 상체도 있어야할듯" → 23:09 a frame of the film's wireframe suit → 23:19, shown the globe-only
// picture: "별로다 그냥 이게 낫겠다"): a figure was tried twice (a scan-contour bust, then a blueprint armour of our own design) and the
// Owner chose the globe alone — this shader is the globe projection only.
function holoCore(cv,opt){if(!cv)return false;let gl=null;
  try{gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,powerPreference:'low-power'})||cv.getContext('experimental-webgl');}catch(_){gl=null;}
  if(!gl)return false;
  const FS=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;uniform float uTime;uniform float uHud;
const float PI=3.14159265,TAU=6.28318531;
const vec3 CY=vec3(.42,.80,1.),TE=vec3(.16,.52,.80),WH=vec3(.88,.98,1.),DEEP=vec3(.04,.14,.26),OR=vec3(1.,.62,.26);
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float h31(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1.,0.,0.)),f.x),mix(h31(i+vec3(0.,1.,0.)),h31(i+vec3(1.,1.,0.)),f.x),f.y),
            mix(mix(h31(i+vec3(0.,0.,1.)),h31(i+vec3(1.,0.,1.)),f.x),mix(h31(i+vec3(0.,1.,1.)),h31(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*vn(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return v;}
vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
vec3 ry(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
vec3 rz(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);}
float gline(float x,float n,float w){return smoothstep(.5-w,.5,abs(fract(x*n)-.5));}
float band(float r,float a,float b,float px){return smoothstep(a-px,a,r)*smoothstep(b+px,b,r);}
float rbox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
/* the wireframe globe: a triangulated mesh (latitude, longitude and one diagonal family), bright where a scan passes */
vec3 shell(vec3 n,float t,float k,float px){vec3 q=ry(rx(n,.38),t*.17);
 float lat=asin(clamp(q.y,-1.,1.))/PI+.5,lon=atan(q.z,q.x)/TAU+.5;float c=sqrt(max(0.,1.-q.y*q.y));
 float w=.05;
 float g=max(gline(lat,10.,w),gline(lon,20.,w/max(c,.3)));
 g=max(g,gline(lat*10.+lon*20.,1.,w*.8)*smoothstep(.25,.4,c));
 float cell=step(.93,h21(floor(vec2(lat*20.,lon*40.))+floor(t*1.2)));
 float fres=pow(1.-abs(n.z),1.6);
 return (CY*g*(.12+.55*fres)+WH*g*fres*.12+TE*cell*.22*(.4+fres))*k;}
/* a flat ring in 3D (tilt an = rotation angles) with dashes, a comet and an electron */
vec3 orbit(vec2 p,float px,vec3 an,float rr,float spin,float dash,float t,float R,float warm){
 vec3 nr=rz(ry(rx(vec3(0.,0.,1.),an.x),an.y),an.z);if(abs(nr.z)<.1)nr.z=nr.z<0.?-.1:.1;nr=normalize(nr);
 vec3 u=normalize(cross(nr,abs(nr.y)<.9?vec3(0.,1.,0.):vec3(1.,0.,0.)));vec3 v=cross(nr,u);
 float z=-(nr.x*p.x+nr.y*p.y)/nr.z;vec3 P=vec3(p,z);float L=max(length(P),1e-4);
 vec2 gr=vec2(P.x-P.z*nr.x/nr.z,P.y-P.z*nr.y/nr.z)/L;float d=abs(L-rr)/max(length(gr),.05);
 float ang=atan(dot(P,v),dot(P,u));
 float behind=(z<0.&&length(p)<R)?.22:1.;float depth=.55+.45*clamp(z/rr+.5,0.,1.);
 float line=smoothstep(1.6*px,0.,d),glow=exp(-pow(d/(8.*px),2.));
 float sg=1.;if(dash>0.){float f=fract(ang/TAU*dash+t*spin*.08);sg=smoothstep(0.,.05,f)*smoothstep(.62,.57,f);}
 float head=mod(ang-t*spin,TAU);float comet=exp(-head*2.4);
 vec3 hot=mix(WH,OR,warm);
 vec3 c=(CY*(line*(.22+.5*sg)+glow*.2)+hot*line*comet*1.3+mix(CY,OR,warm)*glow*comet*.5)*behind*depth;
 float ea=t*spin*1.37+1.3;vec3 E=rr*(cos(ea)*u+sin(ea)*v);float de=length(p-E.xy);
 float ev=(E.z<0.&&length(E.xy)<R)?.22:1.;
 c+=(WH*exp(-de*de/(px*px*14.))*1.2+CY*exp(-de*de/(px*px*240.))*.3)*ev;
 return c;}
/* a floating schematic panel: frame, a few data rows, a leader line to the globe */
vec3 panel(vec2 p,vec2 at,vec2 hb,float t,float px,float seed,float warm,vec2 anchor){
 vec2 q=p-at;float d=rbox(q,hb,.012);
 float frame=smoothstep(1.2*px,0.,abs(d))*.75;
 float fill=smoothstep(0.,-.004,d)*.07;
 vec2 g=(q+hb)/(2.*hb);float rows=3.;float row=floor(g.y*rows);
 float len=.25+.65*h21(vec2(row,seed)+floor(t*.5+row*.37)*.03);
 float bar=step(g.x,len)*step(.28,fract(g.y*rows))*step(fract(g.y*rows),.66)*step(0.,-d)*step(.08,g.x)*step(g.y,.8);
 float head=step(.84,g.y)*step(g.y,.94)*step(0.,-d)*step(.08,g.x)*step(g.x,.5);
 float blink=.75+.25*sin(t*3.+seed*9.);
 vec3 tint=mix(CY,OR,warm);
 vec3 c=tint*(frame+bar*.42*blink+head*.6)+WH*fill*.6+tint*fill;
 /* leader line */
 vec2 a=anchor,b=at;vec2 ab=b-a;float h=clamp(dot(p-a,ab)/dot(ab,ab),0.,1.);float dl=length(p-a-ab*h);
 c+=tint*smoothstep(1.1*px,0.,dl)*.35*step(.02,h)*step(h,.98);
 c+=WH*exp(-pow(length(p-a)/(px*2.2),2.))*.8;
 return c;}
void main(){float s=min(uRes.x,uRes.y);vec2 p0=(gl_FragCoord.xy-.5*uRes)/(.5*s);float px=2./s;
 float t=mod(uTime,3600.);
 /* hologram glitch: a thin horizontal slice slips sideways for a frame or two */
 float gt=floor(t*7.);float gs=h21(vec2(gt,3.7));
 vec2 p=p0;if(gs>.93){float gy=h21(vec2(gt,8.1))*1.6-.8;p.x+=(step(abs(p0.y-gy),.06))*(h21(vec2(gt,5.5))-.5)*.05;}
 vec3 col=vec3(0.);
 float rr0=length(p0);
 /* the globe floats above a projector; the projector sits low in the circle */
 vec2 c0=vec2(0.,.10);vec2 pc=p-c0;float r=length(pc),a=atan(pc.y,pc.x);
 float R=.40*(1.+.010*sin(t*.8));
 /* projector base: an ellipse of concentric rings, and the light cone up to the globe */
 vec2 base=vec2(0.,-.66);vec2 pb=(p-base)*vec2(1.,3.4);float rb=length(pb);
 float disc=smoothstep(.34,.30,rb)*.10+smoothstep(1.4*px,0.,abs(rb-.31))*.55+smoothstep(1.2*px,0.,abs(rb-.22))*.32+smoothstep(1.2*px,0.,abs(rb-.12))*.25;
 float sweep=pow(max(0.,cos(atan(pb.y,pb.x)-t*.9)),8.)*smoothstep(.34,.30,rb)*.25;
 col+=CY*(disc+sweep)+WH*exp(-rb*rb*60.)*.5+TE*smoothstep(.34,.0,rb)*.12;
 float hy=clamp((p.y-base.y)/(c0.y-R*.1-base.y),0.,1.);
 float cw=.05+.33*hy;float beam=exp(-pow(p.x/cw,2.)*2.)*(1.-hy)*step(base.y,p.y)*step(p.y,c0.y+R*.2);
 float rays=.75+.25*sin(p.x*90.+p.y*14.-t*2.);
 col+=TE*beam*.34*rays+CY*beam*.10+WH*beam*exp(-pow(p.x/(cw*.35),2.))*.08;
 /* rising motes inside the beam */
 vec2 mg=vec2(p.x*22.,(p.y-t*.12)*22.);vec2 mc=floor(mg),mf=fract(mg)-.5;float mh=h21(mc+2.2);
 if(mh>.9){float tw=.5+.5*sin(t*4.+mh*30.);col+=CY*smoothstep(.09,0.,length(mf-vec2(mh-.5,h21(mc+9.)-.5)*.5))*tw*beam*2.2;}
 /* soft haze around the projection */
 col+=TE*.14*exp(-r*r*5.)+CY*.04*exp(-r*r*1.4);
 vec3 globe=vec3(0.);
 if(r<R){float z=sqrt(R*R-r*r);vec3 nf=vec3(pc,z)/R,nb=vec3(pc,-z)/R;float fres=pow(1.-nf.z,2.2);
  globe+=DEEP*.30+TE*fres*.55;
  vec3 q=ry(rx(nf,.3),t*.13);float pl=fbm(q*2.2+vec3(0.,t*.2,t*.08));
  globe+=CY*smoothstep(.58,.80,pl)*(1.-fres*.5)*.30+TE*pl*.12;
  globe+=shell(nb,t,.30,px)+shell(nf,t,1.,px);
  float sy=(fract(t*.13)*2.-1.)*R*1.25;globe+=WH*exp(-pow((pc.y-sy)/(R*.035),2.))*.22*(.3+fres);}
 float dr=abs(r-R);globe+=CY*(smoothstep(2.0*px,0.,dr)*.9+exp(-dr*dr*600.)*.26);
 /* the heart: a hollow bright core with turning blades */
 float pu=.5+.5*sin(t*2.3);
 globe+=WH*exp(-r*r*(420.-120.*pu))*1.1+CY*exp(-r*r*70.)*.45;
 globe+=CY*smoothstep(1.8*px,0.,abs(r-(.115+.004*pu)))*.9;
 globe+=WH*pow(max(0.,cos(a*6.+t*1.6)),16.)*band(r,.05,.10,px)*.6;
 globe+=CY*pow(max(0.,cos(a*12.-t*1.05)),26.)*band(r,.14,.19,px)*.5;
 col+=globe;
 /* the equatorial schematic ring: a wide, nearly flat disc with notches, turning slowly */
 col+=orbit(pc,px,vec3(1.30,.10+t*.02,.0),.56,.16,36.,t,R,0.);
 col+=orbit(pc,px,vec3(1.30,.10+t*.02,.0),.62,-.11,12.,t,R,1.);
 /* three tilted orbits with comets and electrons */
 col+=orbit(pc,px,vec3(1.22,.18+t*.03,.42),.68,.42,0.,t,R,0.);
 col+=orbit(pc,px,vec3(1.02,-.62-t*.02,-.52),.74,-.27,28.,t,R,0.);
 col+=orbit(pc,px,vec3(.62,1.16+t*.025,.3),.58,.58,0.,t,R,0.);
 /* floating schematic panels, one warm */
 float bob=sin(t*.9)*.012,bob2=sin(t*.7+2.)*.012;
 col+=panel(p,vec2(-.57,.44+bob),vec2(.12,.075),t,px,1.,0.,c0+vec2(-R*.6,R*.55));
 col+=panel(p,vec2(.58,.30+bob2),vec2(.12,.075),t,px,2.,1.,c0+vec2(R*.7,R*.35));
 col+=panel(p,vec2(.54,-.30-bob),vec2(.11,.07),t,px,3.,0.,c0+vec2(R*.55,-R*.6));
 if(uHud>.5){float ta=atan(p0.y,p0.x)/TAU;float r0=rr0;
  float h=smoothstep(1.2*px,0.,abs(r0-.80))*.3;
  float x=fract(ta*120.+t*.004);float tk=smoothstep(1.3*px,0.,min(x,1.-x)/120.*TAU*r0)*band(r0,.845,.868,px)*.55;
  float x2=fract(ta*12.+t*.0004);float tm=smoothstep(1.6*px,0.,min(x2,1.-x2)/12.*TAU*r0)*band(r0,.835,.89,px)*.9;
  float sa=fract(ta*5.-t*.03);float arc=step(sa,.52)*smoothstep(2.*px,0.,abs(r0-.93))*.75+smoothstep(.02,0.,min(sa,abs(sa-.52)))*band(r0,.915,.945,px)*.8;
  float dsh=step(fract(ta*90.+t*.02),.45)*smoothstep(1.*px,0.,abs(r0-.755))*.35;
  float sw=exp(-mod(atan(p0.y,p0.x)-t*.55,TAU)*2.2)*band(r0,.45,.79,px)*.07;
  col+=CY*(h+tk+tm+arc+dsh)+TE*sw;}
 /* drifting data dust */
 vec2 g=p*16.+vec2(0.,t*.25);vec2 cl=floor(g),fp=fract(g)-.5;float hh=h21(cl);
 if(hh>.86){vec2 off=vec2(h21(cl+3.1),h21(cl+7.7))-.5;float tw=.5+.5*sin(t*(1.+hh*3.)+hh*40.);
  col+=CY*smoothstep(.08,0.,length(fp-off*.6))*tw*.5*smoothstep(1.,.6,rr0)*smoothstep(.3,.5,r);}
 /* hologram texture: scanlines, a slow bright band rolling up, flicker */
 col*=.84+.16*sin(p0.y/px*.9+t*2.);
 float roll=exp(-pow((fract(p0.y*.5-t*.07)-.5)*6.,2.));col*=1.+roll*.22;
 float fl=.965+.035*sin(t*37.)*sin(t*13.);fl*=1.-.10*step(.985,h21(vec2(floor(t*18.),2.)));col*=fl;
 col*=smoothstep(1.,.93,rr0);
 float al=clamp(max(col.r,max(col.g,col.b)),0.,1.);gl_FragColor=vec4(min(col,vec3(al)),al);}`;
  function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){try{console.warn('core shader: '+gl.getShaderInfoLog(s));}catch(_){}return null;}return s;}
  const vs=sh(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'),fs=sh(gl.FRAGMENT_SHADER,FS);
  if(!vs||!fs)return null;
  const pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return null;
  gl.useProgram(pr);gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const uRes=gl.getUniformLocation(pr,'uRes'),uTime=gl.getUniformLocation(pr,'uTime'),uHud=gl.getUniformLocation(pr,'uHud');
  const dpr=Math.min(2,window.devicePixelRatio||1),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,t0=performance.now()-((opt&&opt.phase)||0)*1000,clock=coreClock(opt);
  let lost=false,drawn=false;cv.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});
  function frame(now){if(lost||(opt&&opt.stopWhenGone&&!cv.isConnected))return;
    if(!document.hidden&&cv.offsetParent!==null){const b=cv.getBoundingClientRect();const w=Math.max(1,Math.round(b.width*dpr)),h=Math.max(1,Math.round(b.height*dpr));
      if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes,w,h);gl.uniform1f(uTime,reduced?14.0:clock(now));gl.uniform1f(uHud,opt&&opt.hud===false?0:1);gl.drawArrays(gl.TRIANGLES,0,3);drawn=true;}
    if(!reduced||!drawn)requestAnimationFrame(frame);}
  requestAnimationFrame(frame);return true;}
function startCore(cv,opt){if(!cv)return;const ok=holoCore(cv,opt);if(ok)return;
  if(ok===null){const c2=cv.cloneNode(false);cv.replaceWith(c2);cv=c2;}                  // WebGL there but the shader failed: a fresh canvas for 2D
  livingCore(cv,opt);}

// Wake-page wiring: the canvas in the stage, speed eased toward the PC state (sleeping slow, waking fast); brightness and
// the speaking pulse are CSS on body[data-state] / body[data-speaking].
(function(){
  const stage=document.getElementById('hologram-stage'),cv=document.getElementById('hologram');if(!stage||!cv)return;
  const target=()=>{const s=document.body.dataset.state;return s==='waking'?1.7:s==='sleeping'?.35:s==='online'?1:.7;};
  let rate=target(),prev=performance.now();
  function eased(){const now=performance.now(),dt=Math.min(.1,Math.max(0,(now-prev)/1000));prev=now;rate+=(target()-rate)*Math.min(1,dt*2.5);return rate;}
  stage.dataset.renderer='core';
  startCore(cv,{hud:true,labels:true,rate:eased});
  const note=document.getElementById('projection-note');if(note)note.textContent='LIVING CORE · LOCAL';
})();
