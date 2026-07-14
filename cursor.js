(function(){
  if(!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  var style=document.createElement('style');
  style.textContent=`
    .sw-cursor-dot{position:fixed;left:0;top:0;width:10px;height:10px;border-radius:50%;pointer-events:none;z-index:2147483647;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);background:rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.25);box-shadow:0 0 8px rgba(0,0,0,.08);transition:background .16s ease,border-color .16s ease,box-shadow .16s ease;will-change:transform}
    .sw-cursor-dot.on-dark{background:rgba(255,255,255,.62);border-color:rgba(255,255,255,.55);box-shadow:0 0 9px rgba(255,255,255,.16)}
    .sw-cursor-dot.on-light{background:rgba(30,41,59,.24);border-color:rgba(30,41,59,.16);box-shadow:0 0 8px rgba(0,0,0,.07)}
    .sw-cursor-ring{position:fixed;left:0;top:0;width:34px;height:34px;border:1.5px solid rgba(15,23,42,.62);border-radius:50%;pointer-events:none;z-index:2147483646;opacity:.92;transition:width .4s cubic-bezier(.16,1,.3,1),height .4s cubic-bezier(.16,1,.3,1),border-color .16s ease,background .16s ease,box-shadow .16s ease,opacity .16s ease;will-change:transform}
    .sw-cursor-ring.on-dark{border-color:rgba(255,255,255,.82);box-shadow:0 0 0 .5px rgba(15,23,42,.18)}
    .sw-cursor-ring.hover{width:52px;height:52px;background:rgba(15,23,42,.05)}
    .sw-cursor-ring.on-dark.hover{background:rgba(255,255,255,.08)}
    @media(hover:hover) and (pointer:fine){*{cursor:none!important}}
    @media(hover:none),(pointer:coarse){.sw-cursor-dot,.sw-cursor-ring{display:none}*{cursor:auto!important}}
  `;
  document.head.appendChild(style);

  var dot=document.createElement('div');
  dot.className='sw-cursor-dot on-light';
  var ring=document.createElement('div');
  ring.className='sw-cursor-ring';
  dot.style.visibility='hidden';
  ring.style.visibility='hidden';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  var mx=0,my=0,rx=0,ry=0,seen=false;
  var dotMode='on-light',ringMode='on-light';

  function getLuminance(r,g,b){
    var a=[r,g,b].map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});
    return .2126*a[0]+.7152*a[1]+.0722*a[2];
  }

  function parseColor(value){
    if(!value||value==='transparent') return null;
    var match=value.match(/rgba?\(([^)]+)\)/i);
    if(!match) return null;
    var raw=match[1].replace(/,/g,' ').replace(/\//g,' / ').trim().split(/\s+/);
    var slash=raw.indexOf('/');
    var alpha=slash>-1?raw[slash+1]:(raw.length>3?raw[3]:'1');
    function channel(v){return v&&v.indexOf('%')>-1?parseFloat(v)*2.55:parseFloat(v)}
    function opacity(v){return v&&v.indexOf('%')>-1?parseFloat(v)/100:parseFloat(v)}
    var color=[channel(raw[0]),channel(raw[1]),channel(raw[2]),opacity(alpha)];
    return color.some(function(v){return !isFinite(v)})?null:color;
  }

  function composite(fg,bg){
    var alpha=fg[3]+bg[3]*(1-fg[3]);
    if(alpha<=0) return [255,255,255,0];
    return [
      (fg[0]*fg[3]+bg[0]*bg[3]*(1-fg[3]))/alpha,
      (fg[1]*fg[3]+bg[1]*bg[3]*(1-fg[3]))/alpha,
      (fg[2]*fg[3]+bg[2]*bg[3]*(1-fg[3]))/alpha,
      alpha
    ];
  }

  function gradientColor(value){
    if(!value||value==='none'||value.indexOf('gradient')===-1) return null;
    var matches=value.match(/rgba?\([^)]+\)/gi)||[];
    var colors=matches.map(parseColor).filter(Boolean);
    if(!colors.length) return null;
    var alpha=0,red=0,green=0,blue=0;
    colors.forEach(function(color){
      alpha+=color[3];
      red+=color[0]*color[3];
      green+=color[1]*color[3];
      blue+=color[2]*color[3];
    });
    if(alpha<=0) return null;
    return [red/alpha,green/alpha,blue/alpha,Math.min(1,alpha/colors.length)];
  }

  function getBgColor(x,y){
    var el=document.elementFromPoint(x,y);
    if(!el) return [255,255,255,1];
    var chain=[];
    while(el&&el!==document){chain.push(el);el=el.parentElement}
    var result=[255,255,255,1];
    for(var i=chain.length-1;i>=0;i--){
      var style=getComputedStyle(chain[i]);
      var solid=parseColor(style.backgroundColor);
      var gradient=gradientColor(style.backgroundImage);
      if(solid) result=composite(solid,result);
      if(gradient) result=composite(gradient,result);
    }
    return result;
  }

  function modeAt(x,y){
    var rgb=getBgColor(x,y);
    return getLuminance(rgb[0],rgb[1],rgb[2])<0.4?'on-dark':'on-light';
  }

  function setMode(el,mode,previous){
    if(mode===previous) return previous;
    el.classList.remove(previous);
    el.classList.add(mode);
    return mode;
  }

  var lastCheck=0;
  function checkBackground(force){
    if(!seen) return;
    var now=Date.now();
    if(!force&&now-lastCheck<60) return;
    lastCheck=now;
    var nextDotMode=modeAt(mx,my);
    var nextRingMode=Math.abs(mx-rx)+Math.abs(my-ry)<6?nextDotMode:modeAt(rx,ry);
    dotMode=setMode(dot,nextDotMode,dotMode);
    ringMode=setMode(ring,nextRingMode,ringMode);
  }

  document.addEventListener('mousemove',function(e){
    mx=e.clientX;my=e.clientY;
    var firstMove=!seen;
    if(firstMove){seen=true;rx=mx;ry=my;dot.style.visibility='';ring.style.visibility='';}
    dot.style.transform='translate3d('+mx+'px,'+my+'px,0) translate(-50%,-50%)';
    checkBackground(firstMove);
  });

  (function animate(){
    rx+=(mx-rx)*.28;
    ry+=(my-ry)*.28;
    ring.style.transform='translate3d('+rx+'px,'+ry+'px,0) translate(-50%,-50%)';
    checkBackground();
    requestAnimationFrame(animate);
  })();

  document.querySelectorAll('a,button,[role="button"],input[type="submit"],.nav-cta,.btn-glow,.btn-ghost,.card').forEach(function(el){
    el.addEventListener('mouseenter',function(){ring.classList.add('hover')});
    el.addEventListener('mouseleave',function(){ring.classList.remove('hover')});
  });
})();
