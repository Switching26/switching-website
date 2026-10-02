/* Barre du haut en verre liquide (02/10/2026). Voir /nav-glass.css. */
(function(){
var h=document.getElementById('hd');if(!h)return;
function filt(id,sc){return '<filter id="'+id+'" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">'+
 '<feImage id="'+id+'-map" x="0" y="0" width="100" height="60" preserveAspectRatio="none" result="map"/>'+
 '<feDisplacementMap in="SourceGraphic" in2="map" scale="'+sc+'" xChannelSelector="R" yChannelSelector="G"/></filter>'}
var s=document.createElement('div');s.innerHTML='<svg width="0" height="0" style="position:absolute" aria-hidden="true">'+filt('sf-lens',-55)+filt('sf-lens-menu',-60)+'</svg>';document.body.appendChild(s.firstChild);
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
// menu téléphone : sous-titres sous chaque entrée, et même verre que la barre
var card=document.querySelector('.menu-drop .menu-card');
if(card){
 var SUB={'index.html':'Faisons grandir vos compétences','le-centre.html':'Paris 12ᵉ · depuis 2021','financement.html':'CPF, OPCO, France Travail','inscription.html':'Gratuit, réponse sous 24 h'};
 var wrap=function(el,sub){for(var n=el.lastChild;n;n=n.previousSibling){if(n.nodeType===3&&n.textContent.trim()){var t=document.createElement('span');t.className='mc-t';
  t.innerHTML='<b></b>'+(sub?'<small></small>':'');t.firstChild.textContent=n.textContent.trim();if(sub)t.lastChild.textContent=sub;el.replaceChild(t,n);return}}};
 document.querySelectorAll('.mc-nav > a.mc-link').forEach(function(a){var k=(a.getAttribute('href')||'').split('/').pop()||'index.html';wrap(a,SUB[k]||'')});
 var tl=document.querySelector('.mc-toggle .mc-tl'),cnt=document.querySelector('.mcx-all small');if(tl)wrap(tl,cnt?cnt.textContent:'');
 if(chromium){var mimg=document.getElementById('sf-lens-menu-map'),mw=0,mh=0;
  var mbuild=function(){var w=card.offsetWidth,hh=card.offsetHeight;if(!w||!hh||(w===mw&&hh===mh))return;mw=w;mh=hh;
   mimg.setAttribute('href',lens(w,hh,28,22));mimg.setAttribute('width',w);mimg.setAttribute('height',hh);card.classList.add('lens')};
  var isOpen=function(){return document.body.classList.contains('menu-open')};
  new MutationObserver(function(){if(isOpen())requestAnimationFrame(mbuild)}).observe(document.body,{attributes:true,attributeFilter:['class']});
  if('ResizeObserver' in window)new ResizeObserver(function(){if(isOpen())requestAnimationFrame(mbuild)}).observe(card)}
}
// barre devis des pages formation : repère « Faites défiler » tant que la fin du formulaire n'est pas atteinte
var qs=document.querySelector('.qb-scroll');
if(qs){var qm=document.createElement('div');qm.className='qb-more';qm.setAttribute('aria-hidden','true');
 qm.innerHTML='Faites défiler<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';qs.after(qm);
 var qe=function(){qs.classList.toggle('qb-end',qs.scrollTop+qs.clientHeight>=qs.scrollHeight-4)};
 qs.addEventListener('scroll',qe,{passive:true});addEventListener('resize',qe);
 new MutationObserver(function(){setTimeout(qe,650)}).observe(h,{attributes:true,attributeFilter:['class']});qe()}
})();
