
(function(){
'use strict';
var Q=JSON.parse(document.getElementById('questions-data').textContent);
var CONFIG=JSON.parse(document.getElementById('test-config').textContent);
var DOMAINS=Object.keys(CONFIG.domains);
var LETTERS=['A','B','C','D','E'];
/* schémas d'énoncé : reprennent uniquement les valeurs données dans le texte */
var VIS=CONFIG.visuals||{};
var state={i:0,a:[]};
function reset(){state.i=0;state.a=Q.map(function(){return null});}
reset();
function $(id){return document.getElementById(id)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(s){var e=esc(s);return /^=/.test(s)?'<span class="fx">'+e+'</span>':e}
function norm(v){return String(v).replace(/[\s  ]/g,'')}
function isNum(v){return /^-?\d+([.,]\d+)?$/.test(norm(v))}
function toNum(v){return parseFloat(norm(v).replace(',','.'))}
function isRight(q,a){if(!a||a.kind==='skip')return false;if(q.type==='number')return isNum(a.raw)&&toNum(a.raw)===q.answer;return a.value===q.answer}
function answerText(q,a){if(!a)return'Sans réponse';if(a.kind==='skip')return'Je ne sais pas';if(q.type==='number')return a.raw;return q.options[a.value]}
function goodText(q){return q.type==='number'?String(q.answer):q.options[q.answer]}

var app=$('test-app'),qv=$('question-view'),rv=$('result'),form=$('q-form'),hint=$('q-hint');
var segs=$('segs');segs.style.gridTemplateColumns='repeat('+Q.length+',1fr)';for(var s=0;s<Q.length;s++)segs.appendChild(document.createElement('i'));

function setHint(t,info){hint.textContent=t||'';hint.className='hint'+(info?' info':'')}
function visual(q){
 var v=VIS[q.id];if(!v)return'';
 var h='<p class="mini-cap">Schéma de l\'énoncé</p><div class="mini" role="img" aria-label="Schéma des cellules citées dans l\'énoncé" style="grid-template-columns:repeat('+v.cols.length+',auto)">';
 v.cols.forEach(function(c){h+='<div class="hd">'+esc(c)+'</div>'});
 v.rows.forEach(function(r,ri){r.forEach(function(c,ci){var cl=ci===0?'rh':'';if(c==='?'||/\?$/.test(c))cl+=' ask';if(v.f&&v.f.indexOf(ci)>-1)cl+=' f';if(v.lab&&v.lab.some(function(p){return p[0]===ri+1&&p[1]===ci}))cl+=' lab';h+='<div class="'+cl+'">'+esc(c)+'</div>'})});
 return h+'</div>';
}
function render(focus){
 var q=Q[state.i],a=state.a[state.i],last=state.i===Q.length-1;
 $('q-count').textContent='Question '+(state.i+1)+' sur '+Q.length;
 $('q-domain').textContent=q.domain;
 [].forEach.call(segs.children,function(el,k){el.className=(k===state.i?'cur':(state.a[k]?'done':''))});
 $('q-title').textContent=q.title;
 $('q-context').textContent=q.context;
 if(CONFIG.slug==='anglais'){$('q-context').lang='en'}
 $('q-visual').innerHTML=visual(q);
 var box=$('q-answers'),h='';
 if(q.type==='number'){
  h='<div class="num"><label for="q-number">Votre réponse (un nombre)</label><input id="q-number" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="'+(a&&a.kind==='number'?esc(a.raw):'')+'"><small>Chiffres uniquement, par exemple 12.</small></div>';
 }else{
  h='<div class="opts">';
  q.options.forEach(function(o,k){h+='<label class="opt"><input type="radio" name="q-answer" value="'+k+'"'+(a&&a.kind==='choice'&&a.value===k?' checked':'')+'><span class="k" aria-hidden="true">'+LETTERS[k]+'</span><span class="t">'+fmt(o)+'</span></label>'});
  h+='</div>';
 }
 box.innerHTML=h;
 var skipped=!!(a&&a.kind==='skip');
 $('skip-question').setAttribute('aria-pressed',skipped?'true':'false');
 setHint(skipped?'Réponse actuelle : « Je ne sais pas ». Vous pouvez choisir une réponse à la place.':'',true);
 $('previous-question').disabled=state.i===0;
 $('next-question').firstChild.nodeValue=last?'Voir mon résultat':'Question suivante';
 var body=$('q-body');body.classList.remove('q-enter');void body.offsetWidth;body.classList.add('q-enter');
 if(focus)$('q-title').focus({preventScroll:true});
}
form.addEventListener('change',function(e){
 if(e.target.name==='q-answer'){state.a[state.i]={kind:'choice',value:+e.target.value};$('skip-question').setAttribute('aria-pressed','false');setHint('');segs.children[state.i].className='cur'}
});
form.addEventListener('input',function(e){
 if(e.target.id==='q-number'){var raw=e.target.value.trim();state.a[state.i]=raw?{kind:'number',raw:raw}:null;$('skip-question').setAttribute('aria-pressed','false');setHint('')}
});
function scrollApp(){var t=app.getBoundingClientRect().top+window.scrollY-72;window.scrollTo({top:Math.max(t,0),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
function go(n){state.i=n;render(true);scrollApp()}
function advance(){if(state.i<Q.length-1)go(state.i+1);else showResult()}
form.addEventListener('submit',function(e){
 e.preventDefault();
 var a=state.a[state.i],q=Q[state.i];
 if(!a){setHint('Choisissez une réponse, ou « Je ne sais pas » si vous préférez passer.');var f=form.querySelector('input');if(f)f.focus();return}
 if(q.type==='number'&&a.kind==='number'&&!isNum(a.raw)){setHint('Saisissez un nombre, par exemple 12.');$('q-number').focus();return}
 advance();
});
$('skip-question').addEventListener('click',function(){state.a[state.i]={kind:'skip'};advance()});
$('previous-question').addEventListener('click',function(){if(state.i>0)go(state.i-1)});

function stats(){
 var r={score:0,skip:0,ko:0,d:{}};
 DOMAINS.forEach(function(d){r.d[d]={n:0,ok:0,ko:0,skip:0,marks:[]}});
 Q.forEach(function(q,k){var a=state.a[k],d=r.d[q.domain];d.n++;
  if(a&&a.kind==='skip'){d.skip++;r.skip++;d.marks.push('skip')}
  else if(isRight(q,a)){d.ok++;r.score++;d.marks.push('ok')}
  else{d.ko++;r.ko++;d.marks.push('ko')}});
 return r;
}
function plural(n,s,p){return n+' '+(n>1?p:s)}
function priorities(r){
 return DOMAINS.map(function(d){return{d:d,miss:r.d[d].ko+r.d[d].skip,ko:r.d[d].ko,skip:r.d[d].skip,n:r.d[d].n}})
  .filter(function(x){return x.miss>0})
  .sort(function(a,b){return(b.miss/b.n)-(a.miss/a.n)||b.miss-a.miss});
}
function showResult(){
 var r=stats(),pr=priorities(r),n=Q.length;
 $('res-score').innerHTML=r.score+'<small>/'+n+'</small>';
 $('res-sub').textContent=plural(r.score,'bonne réponse','bonnes réponses')+' · '+plural(r.ko,'réponse à revoir','réponses à revoir')+' · '+r.skip+' « je ne sais pas »';
 var dh='';DOMAINS.forEach(function(d){var x=r.d[d];
  dh+='<div class="dom"><b>'+d+'</b><div class="v">'+x.ok+'<small> / '+x.n+'</small></div><div class="pips">'+x.marks.map(function(m){return'<i class="pip '+m+'"></i>'}).join('')+'</div><div class="d">'+(x.ko+x.skip===0?'Aucun point à revoir ici':[x.ko?plural(x.ko,'à revoir','à revoir'):'',x.skip?x.skip+' « je ne sais pas »':''].filter(Boolean).join(' · '))+'</div></div>'});
 $('res-domains').innerHTML=dh;
 var c=[];
 if(r.score/n<=0.4)c.push('Ce premier repère montre que plusieurs notions restent à installer ou à revoir. C\'est un bon point de départ : un parcours progressif commence par elles.');
 else if(r.score/n<=0.8)c.push('Vous avez des repères sur une partie des notions testées. Quelques points méritent d\'être repris pour gagner en sûreté au quotidien.');
 else c.push('Vous avez de bons repères sur cet échantillon de '+n+' questions. Un échange sur vos besoins réels permettra de préciser ce qui vous serait utile.');
 c.push(CONFIG.scope);
 if(pr.length){c.push('À travailler d\'abord : '+pr.map(function(x){var p=[];if(x.ko)p.push(plural(x.ko,'réponse à revoir','réponses à revoir'));if(x.skip)p.push(x.skip+' « je ne sais pas »');return x.d+' ('+p.join(', ')+')'}).join(', puis ')+'.')}
 else c.push('Aucune réponse à revoir dans cet échantillon.');
 if(r.skip)c.push('Vos « je ne sais pas » ne rapportent pas de point, mais ce ne sont pas des erreurs : ils montrent simplement les notions à découvrir.');
 $('res-comment').innerHTML=c.map(function(t){return'<p>'+esc(t)+'</p>'}).join('');
 var ch='';Q.forEach(function(q,k){var a=state.a[k],ok=isRight(q,a),sk=a&&a.kind==='skip',st=sk?'skip':(ok?'ok':'ko'),lab=sk?'Je ne sais pas':(ok?'Juste':'À revoir');
  ch+='<details><summary><span class="n">Q'+(k+1)+'</span><span>'+esc(q.title)+'</span><span class="st '+st+'">'+lab+'</span></summary><div class="body"><p class="ctx">'+esc(q.context)+'</p><p><span class="lbl">Votre réponse</span>'+fmt(answerText(q,a))+'</p><p><span class="lbl">Bonne réponse</span>'+fmt(goodText(q))+'</p><p class="exp">'+esc(q.explanation)+'</p></div></details>'});
 $('res-corrige').innerHTML=ch;
 qv.hidden=true;rv.hidden=false;
 scrollApp();$('res-title').focus({preventScroll:true});
}
function currentGoal(){var g=document.querySelector('input[name="goal"]:checked');return g?g.value:''}
$('goals').addEventListener('change',function(){$('goal-note').hidden=!(CONFIG.slug==='excel'&&currentGoal()==='Automatiser des tâches répétitives');if(!$('prep-out').hidden)buildPrep()});
function buildPrep(){
 var r=stats(),pr=priorities(r),g=currentGoal();
 var t=['Test '+CONFIG.name+' Switching Formation (repère indicatif)','Score : '+r.score+'/'+Q.length,
  DOMAINS.map(function(d){return d+' : '+r.d[d].ok+'/'+r.d[d].n}).join(' · '),
  '« Je ne sais pas » : '+r.skip,
  'À travailler en priorité : '+(pr.length?pr.map(function(x){return x.d}).join(', '):'aucun domaine signalé par le test'),
  'Objectif : '+(g||'à préciser lors de l\'échange'),
  '','Je souhaite échanger avec un conseiller sur le parcours adapté.'];
 $('prep-text').value=t.join('\n');
}
$('prepare-contact').addEventListener('click',function(){buildPrep();$('prep-out').hidden=false;$('copy-status').textContent='Ce texte n\'est ni enregistré ni transmis.';$('prep-text').focus()});
$('copy-prep').addEventListener('click',function(){
 var ta=$('prep-text'),st=$('copy-status');
 function fallback(){ta.focus();ta.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}st.textContent=ok?'Texte copié.':'Sélectionnez le texte pour le copier.'}
 if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(ta.value).then(function(){st.textContent='Texte copié.'},fallback)}else fallback();
});
$('restart-test').addEventListener('click',function(){
 reset();
 [].forEach.call(document.querySelectorAll('input[name="goal"]'),function(i){i.checked=false});
 $('goal-note').hidden=true;$('prep-out').hidden=true;$('prep-text').value='';
 rv.hidden=true;qv.hidden=false;render(true);scrollApp();
});
$('start-test').addEventListener('click',function(){app.hidden=false;if(rv.hidden){qv.hidden=false;render(true)}scrollApp()});
document.documentElement.classList.add('js');
if($('engine-fallback'))$('engine-fallback').hidden=true;
})();
