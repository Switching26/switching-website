(function(){
  if(!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  var style=document.createElement('style');
  style.textContent=`
    .sw-cursor-dot{position:fixed;width:10px;height:10px;border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);background:rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.25);box-shadow:0 0 8px rgba(0,0,0,.08);transition:background .3s ease,border-color .3s ease,box-shadow .3s ease}
    .sw-cursor-dot.on-dark{background:rgba(255,255,255,.4);border-color:rgba(255,255,255,.3);box-shadow:0 0 8px rgba(255,255,255,.1)}
    .sw-cursor-dot.on-light{background:rgba(30,41,59,.2);border-color:rgba(30,41,59,.1);box-shadow:0 0 8px rgba(0,0,0,.06)}
    .sw-cursor-ring{position:fixed;width:35px;height:35px;border:1.5px solid #10ABAF;border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);opacity:.5;transition:width .4s cubic-bezier(.16,1,.3,1),height .4s cubic-bezier(.16,1,.3,1),border-color .4s ease,background .4s ease,opacity .3s ease}
    .sw-cursor-ring.hover{width:55px;height:55px;border-color:#0E9599;background:rgba(16,171,175,.08);opacity:.8}
    @media(hover:hover) and (pointer:fine){*{cursor:none!important}}
    @media(hover:none),(pointer:coarse){.sw-cursor-dot,.sw-cursor-ring{display:none}*{cursor:auto!important}}
  `;
  document.head.appendChild(style);

  var dot=document.createElement('div');
  dot.className='sw-cursor-dot on-light';
  var ring=document.createElement('div');
  ring.className='sw-cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  var mx=0,my=0,rx=0,ry=0;
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
      currentMode=mode;
    }
  }

  document.addEventListener('mousemove',function(e){
    mx=e.clientX;my=e.clientY;
    dot.style.left=mx+'px';
    dot.style.top=my+'px';
    checkBackground();
  });

  (function animate(){
    rx+=(mx-rx)*.12;
    ry+=(my-ry)*.12;
    ring.style.left=rx+'px';
    ring.style.top=ry+'px';
    requestAnimationFrame(animate);
  })();

  document.querySelectorAll('a,button,[role="button"],input[type="submit"],.nav-cta,.btn-glow,.btn-ghost,.card').forEach(function(el){
    el.addEventListener('mouseenter',function(){ring.classList.add('hover')});
    el.addEventListener('mouseleave',function(){ring.classList.remove('hover')});
  });
})();
