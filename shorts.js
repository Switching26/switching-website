/* Section Shorts de l'accueil (13/10/2026) : lecture muette des vidéos visibles, son au choix, barre rouge, visionneuse. */
(function(){
var rail=document.querySelector('.sh-rail');if(!rail)return;
var cards=[].slice.call(rail.querySelectorAll('.sh-card'));
var viewer=document.querySelector('.sh-viewer'),vv=viewer.querySelector('video'),vbar=viewer.querySelector('.shv-prog i'),vvol=viewer.querySelector('.shv-vol');
var cur=-1,soundCard=null;
function load(v){if(!v.src&&v.dataset.src)v.src=v.dataset.src}
// lecture seulement des vidéos visibles
var io=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target.querySelector('video');if(e.isIntersecting&&!viewer.classList.contains('open')){load(v);var p=v.play();if(p)p.catch(function(){})}else v.pause()})},{root:rail,threshold:.55});
cards.forEach(function(c){io.observe(c)});
// coupe aussi quand la section sort de l'écran
new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)cards.forEach(function(c){c.querySelector('video').pause()});else cards.forEach(function(c){var r=c.getBoundingClientRect(),rr=rail.getBoundingClientRect();if(r.right>rr.left+20&&r.left<rr.right-20){var v=c.querySelector('video');load(v);var p=v.play();if(p)p.catch(function(){})}})})},{threshold:.15}).observe(rail);
function mute(c,m){var v=c.querySelector('video');v.muted=m;c.querySelector('.sh-vol').classList.toggle('on',!m);c.querySelector('.sh-vol').setAttribute('aria-label',m?'Activer le son':'Couper le son')}
cards.forEach(function(c,i){
 c.querySelector('.sh-vol').addEventListener('click',function(e){e.stopPropagation();var v=c.querySelector('video');var turnOn=v.muted;cards.forEach(function(o){mute(o,true)});if(turnOn){mute(c,false);load(v);v.play();soundCard=c}else soundCard=null});
 c.addEventListener('click',function(){open(i)});
});
// barre rouge
function tick(){cards.forEach(function(c){var v=c.querySelector('video');if(v.duration)c.querySelector('.sh-prog i').style.transform='scaleX('+(v.currentTime/v.duration)+')'});
 if(viewer.classList.contains('open')&&vv.duration)vbar.style.transform='scaleX('+(vv.currentTime/vv.duration)+')';requestAnimationFrame(tick)}
requestAnimationFrame(tick);
// flèches ordinateur
var prev=document.querySelector('.sh-prev'),next=document.querySelector('.sh-next');
function step(d){rail.scrollBy({left:d*(cards[0].offsetWidth+14)*2,behavior:'smooth'})}
prev.onclick=function(){step(-1)};next.onclick=function(){step(1)};
function navState(){prev.disabled=rail.scrollLeft<8;next.disabled=rail.scrollLeft+rail.clientWidth>rail.scrollWidth-8}
rail.addEventListener('scroll',navState,{passive:true});navState();
// visionneuse
function open(i){cur=(i+cards.length)%cards.length;var c=cards[cur],src=c.querySelector('video');
 cards.forEach(function(o){o.querySelector('video').pause();mute(o,true)});
 vv.src=src.dataset.src;vv.poster=src.poster;vv.currentTime=0;vv.muted=false;vvol.classList.add('on');
 viewer.querySelector('.sh-dom i').style.background=getComputedStyle(c).getPropertyValue('--c');
 viewer.querySelector('.sh-dom em').textContent=c.querySelector('.sh-dom').textContent;
 viewer.querySelector('.shv-cap b').textContent=c.querySelector('.sh-cap b').textContent;
 viewer.classList.add('open');viewer.setAttribute('aria-hidden','false');document.documentElement.style.overflow='hidden';
 var p=vv.play();if(p)p.catch(function(){vv.muted=true;vvol.classList.remove('on');vv.play()})}
function close(){viewer.classList.remove('open');viewer.setAttribute('aria-hidden','true');vv.pause();document.documentElement.style.overflow='';
 cards.forEach(function(c){var r=c.getBoundingClientRect(),rr=rail.getBoundingClientRect();if(r.right>rr.left+20&&r.left<rr.right-20)c.querySelector('video').play().catch(function(){})})}
viewer.querySelector('.shv-x').onclick=close;viewer.querySelector('.shv-bg').onclick=close;
viewer.querySelector('.shv-p').onclick=function(){open(cur-1)};viewer.querySelector('.shv-n').onclick=function(){open(cur+1)};
vvol.onclick=function(e){e.stopPropagation();vv.muted=!vv.muted;vvol.classList.toggle('on',!vv.muted)};
vv.addEventListener('click',function(){vv.paused?vv.play():vv.pause()});
document.addEventListener('keydown',function(e){if(!viewer.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowDown'||e.key==='ArrowRight')open(cur+1);if(e.key==='ArrowUp'||e.key==='ArrowLeft')open(cur-1)});
var y0=null;viewer.addEventListener('touchstart',function(e){y0=e.touches[0].clientY},{passive:true});
viewer.addEventListener('touchend',function(e){if(y0===null)return;var d=e.changedTouches[0].clientY-y0;y0=null;if(d<-60)open(cur+1);else if(d>60)open(cur-1)},{passive:true});
})();
