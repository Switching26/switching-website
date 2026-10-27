/* Vidéo de présentation des pages formation (27/10/2026) : même comportement que la vidéo d'accueil.
   Chargée seulement quand le visiteur arrive dessus, démarre sans le son, bouton Son qui relance
   depuis le début, pause hors écran, rien d'automatique si l'appareil demande moins d'animations. */
(function(){var MUTE='<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/>',ON='<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>';
var calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.vf-vid').forEach(function(w){var v=w.querySelector('video'),b=w.querySelector('.vf-snd');if(!v||!b)return;
function load(){if(!v.getAttribute('src')&&v.dataset.src){v.src=v.dataset.src}}
function play(){load();var p=v.play();if(p)p.catch(function(){})}
function paint(){var on=!v.muted;b.querySelector('svg').innerHTML=on?ON:MUTE;b.querySelector('span').textContent=on?'Couper le son':'Son';b.setAttribute('aria-label',on?'Couper le son de la vidéo':'Activer le son de la vidéo')}
b.addEventListener('click',function(){if(v.muted){v.muted=false;load();v.currentTime=0;play()}else{v.muted=true}paint()});
v.addEventListener('click',function(){if(v.muted){b.click()}else if(v.paused){play()}else{v.pause()}});
if('IntersectionObserver' in window)new IntersectionObserver(function(e){if(e[0].isIntersecting){if(!calm||!v.muted)play()}else{v.pause()}},{threshold:.35}).observe(w);else if(!calm)play();});})();
