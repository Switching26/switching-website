/* Menu téléphone des pages du blog : même comportement que financement.html (tools/blog_menu.py). */
function positionMenu(){var nav=document.querySelector('header');var drop=document.getElementById('menuDrop');if(nav&&drop){var r=nav.getBoundingClientRect();drop.style.top=(r.bottom+8)+'px'}}
function toggleMenu(){document.body.classList.toggle('menu-open');if(document.body.classList.contains('menu-open'))positionMenu()}
function closeMenu(){document.body.classList.remove('menu-open');document.body.classList.remove('f-open')}
(function(){
var b=document.querySelector('.menu-toggle'),drop=document.getElementById('menuDrop');if(!b||!drop)return;
b.addEventListener('click',toggleMenu);
var bd=document.querySelector('.menu-backdrop');if(bd)bd.addEventListener('click',closeMenu);
document.querySelectorAll('.mc-nav a[href], .mc-bottom a[href]').forEach(function(a){a.addEventListener('click',closeMenu)});
window.addEventListener('scroll',function(){if(document.body.classList.contains('menu-open'))positionMenu()},{passive:true});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu()});
})();
