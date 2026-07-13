(function(){
  if(!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  var style=document.createElement('style');
  style.textContent=`
    .sw-cursor-dot{position:fixed;left:0;top:0;width:10px;height:10px;border-radius:50%;pointer-events:none;z-index:9999;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);background:rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.25);box-shadow:0 0 8px rgba(0,0,0,.08);transition:background .3s ease,border-color .3s ease,box-shadow .3s ease;will-change:transform}
    .sw-cursor-dot.on-dark{background:rgba(255,255,255,.4);border-color:rgba(255,255,255,.3);box-shadow:0 0 8px rgba(255,255,255,.1)}
    .sw-cursor-dot.on-light{background:rgba(30,41,59,.2);border-color:rgba(30,41,59,.1);box-shadow:0 0 8px rgba(0,0,0,.06)}
    .sw-cursor-ring{position:fixed;left:0;top:0;width:34px;height:34px;border:1.5px solid rgba(15,23,42,.55);border-radius:50%;pointer-events:none;z-index:9998;opacity:.85;transition:width .4s cubic-bezier(.16,1,.3,1),height .4s cubic-bezier(.16,1,.3,1),border-color .3s ease,background .3s ease,opacity .3s ease;will-change:transform}
    .sw-cursor-ring.on-dark{border-color:rgba(255,255,255,.65)}
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
  var currentMode='on-light';

  function getLuminance(r,g,b){
    var a=[r,g,b].map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});
    return .2126*a[0]+.7152*a[1]+.0722*a[2];
  }

  function getBgColor(el){
    while(el&&el!==document){
      var bg=getComputedStyle(el).backgroundColor;
      if(bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent') return bg;
      el=el.parentElement;
    }
    return 'rgb(255,255,255)';
  }

  function parseRgb(s){var m=s.match(/(\d+)/g);return m?[+m[0],+m[1],+m[2]]:[255,255,255]}

  var lastCheck=0;
  function checkBackground(){
    var now=Date.now();
    if(now-lastCheck<100) return;
    lastCheck=now;
    var el=document.elementFromPoint(mx,my);
    if(!el) return;
    var rgb=parseRgb(getBgColor(el));
    var mode=getLuminance(rgb[0],rgb[1],rgb[2])<0.4?'on-dark':'on-light';
    if(mode!==currentMode){
      dot.classList.remove(currentMode);
      dot.classList.add(mode);
      ring.classList.remove(currentMode);
      ring.classList.add(mode);
      currentMode=mode;
    }
  }

  document.addEventListener('mousemove',function(e){
    mx=e.clientX;my=e.clientY;
    if(!seen){seen=true;rx=mx;ry=my;dot.style.visibility='';ring.style.visibility='';}
    dot.style.transform='translate3d('+mx+'px,'+my+'px,0) translate(-50%,-50%)';
    checkBackground();
  });

  (function animate(){
    rx+=(mx-rx)*.28;
    ry+=(my-ry)*.28;
    ring.style.transform='translate3d('+rx+'px,'+ry+'px,0) translate(-50%,-50%)';
    requestAnimationFrame(animate);
  })();

  document.querySelectorAll('a,button,[role="button"],input[type="submit"],.nav-cta,.btn-glow,.btn-ghost,.card').forEach(function(el){
    el.addEventListener('mouseenter',function(){ring.classList.add('hover')});
    el.addEventListener('mouseleave',function(){ring.classList.remove('hover')});
  });
})();
