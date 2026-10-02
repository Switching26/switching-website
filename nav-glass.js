/* Barre du haut en verre liquide (02/10/2026). Voir /nav-glass.css. */
(function(){
var h=document.getElementById('hd');if(!h)return;
var s=document.createElement('div');s.innerHTML='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="sf-lens" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">\n<feImage id="sf-lens-map" x="0" y="0" width="100" height="60" preserveAspectRatio="none" result="map"/>\n<feDisplacementMap in="SourceGraphic" in2="map" scale="-55" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';document.body.appendChild(s.firstChild);
h.classList.add('lg');document.body.classList.add('lg-menu');
var chromium=!!(navigator.userAgentData&&navigator.userAgentData.brands&&navigator.userAgentData.brands.some(function(b){return /Chrom/.test(b.brand)}));
var img=document.getElementById('sf-lens-map'),lastW=0,lastH=0;
// carte de déformation : neutre au centre, les bords « tirent » vers l'extérieur comme une lentille
function lens(w,hh,r,band){var c=document.createElement('canvas');c.width=w;c.height=hh;var x=c.getContext('2d'),im=x.createImageData(w,hh),d=im.data;
 for(var j=0;j<hh;j++)for(var i=0;i<w;i++){var px=i+.5-w/2,py=j+.5-hh/2,qx=Math.abs(px)-(w/2-r),qy=Math.abs(py)-(hh/2-r),
  dist=Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r,inner=-dist,dx=0,dy=0;
  if(inner<band&&inner>-1){var t=1-Math.max(inner,0)/band,k=t*t*(3-2*t),nx,ny;
   if(qx>0&&qy>0){var l=Math.hypot(qx,qy)||1;nx=qx/l;ny=qy/l}else if(qx>qy){nx=1;ny=0}else{nx=0;ny=1}
   dx=nx*(px<0?-1:1)*k;dy=ny*(py<0?-1:1)*k}
  var o=(j*w+i)*4;d[o]=128+dx*127;d[o+1]=128+dy*127;d[o+2]=128;d[o+3]=255}
 x.putImageData(im,0,0);return c.toDataURL()}
function build(){var r=h.getBoundingClientRect(),w=Math.round(r.width),hh=Math.round(r.height);if(!w||!hh||(w===lastW&&hh===lastH))return;lastW=w;lastH=hh;
 var rad=parseFloat(getComputedStyle(h).borderTopLeftRadius)||20;
 img.setAttribute('href',lens(w,hh,Math.min(rad,hh/2),Math.min(18,hh/2.6)));img.setAttribute('width',w);img.setAttribute('height',hh);
 h.classList.add('lens')}
if(chromium){build();if('ResizeObserver' in window)new ResizeObserver(function(){requestAnimationFrame(build)}).observe(h)}
// reflet qui suit le mouvement : défilement, souris, inclinaison du téléphone
var gx=null;function setX(p){h.style.setProperty('--lg-x',(12+p*76).toFixed(1)+'%');h.style.setProperty('--lg-ang',(105+p*40).toFixed(0)+'deg')}
addEventListener('scroll',function(){if(gx===null)setX((Math.sin(scrollY/260)+1)/2)},{passive:true});
h.addEventListener('pointermove',function(e){var r=h.getBoundingClientRect();setX((e.clientX-r.left)/r.width)});
addEventListener('deviceorientation',function(e){if(e.gamma==null)return;gx=Math.max(0,Math.min(1,(e.gamma+30)/60));setX(gx)});
// verre sombre au-dessus des zones sombres
function lum(el){for(var n=el;n&&n!==document.documentElement;n=n.parentElement){if(n===h||h.contains(n))return null;
 if(n.tagName==='VIDEO')return .1;var c=getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
 if(c&&(c[3]===undefined||+c[3]>.6))return (.2126*c[0]+.7152*c[1]+.0722*c[2])/255}return 1}
var tick=false;function sample(){tick=false;var r=h.getBoundingClientRect(),y=r.top+r.height/2,dark=0,n=0;
 [.1,.3,.5,.7,.9].forEach(function(f){var els=document.elementsFromPoint(r.left+r.width*f,y);for(var k=0;k<els.length;k++){if(els[k]===h||h.contains(els[k]))continue;var L=lum(els[k]);if(L!==null){n++;if(L<.35)dark++;break}}});
 h.classList.toggle('lg-dark',n>0&&dark/n>=.8)}
addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(sample)}},{passive:true});setTimeout(sample,300);setX(.25);
})();
