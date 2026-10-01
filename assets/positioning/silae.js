(function(){
'use strict';
var OK='<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
var KO='<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>';
var STEPS=[
{label:'Qualifier',doc:'releve',
 q:'Le relevé indique une absence sans motif. Que faites-vous ?',
 ctx:'Vous préparez la paie de septembre 2026 d’Atelier Horizon. Dans le relevé d’absence de Camille Martin (pièce RA-09), la ligne du 17 septembre ne porte aucun motif.',
 opts:[
  {t:'Saisir une absence maladie par défaut, c’est le cas le plus fréquent',ok:false,fb:'Un motif choisi par défaut invente une information absente des pièces. La qualification d’une absence vient d’un document ou d’une confirmation, pas d’une supposition.'},
  {t:'Demander la qualification de l’absence et la pièce justificative',ok:true,fb:'Une information incertaine se clarifie avant la saisie. Vous obtenez une réponse écrite, que vous pourrez citer si l’on vous demande d’où vient la donnée.'},
  {t:'Ignorer la ligne : sans motif, elle ne compte pas',ok:false,fb:'Une absence non traitée ne disparaît pas : elle deviendrait une erreur impossible à expliquer. Elle doit être qualifiée, pas écartée.'}],
 lesson:'La RH répond : le 17 septembre est une journée de congé autorisée. La pièce RH-03 rejoint le dossier. L’exercice ne donne aucune règle de valorisation : ici, on ne calcule rien, on qualifie.'},
{label:'Comparer',doc:'fiche',
 q:'Avant la saisie, quels repères contrôler ?',
 ctx:'Vous avez maintenant trois pièces : la fiche salarié, le relevé d’absence et la confirmation RH. Avant de reporter quoi que ce soit, vous vérifiez qu’elles décrivent bien la même situation.',
 opts:[
  {t:'Le nom du fichier du relevé : il suffit à identifier la salariée et le mois',ok:false,fb:'Un nom de fichier n’est pas une pièce. Il peut être mal nommé, incomplet ou concerner quelqu’un d’autre.'},
  {t:'La période précédente, déjà validée, pour reprendre les mêmes éléments',ok:false,fb:'Chaque période a ses propres événements. Reprendre ceux d’août ferait entrer des informations qui ne concernent pas septembre.'},
  {t:'L’identité de la salariée, la période et la cohérence entre les pièces',ok:true,fb:'C’est le contrôle attendu : même personne, même période, et des pièces qui se confirment l’une l’autre.'}],
 lesson:'Les trois pièces concernent Camille Martin et septembre 2026 ; la date du 17/09 concorde entre le relevé et la RH. Vous pouvez saisir en sachant d’où vient chaque information.'},
{label:'Sans doublon',doc:'registre',
 q:'Faut-il ajouter à nouveau la même journée ?',
 ctx:'Le registre d’exercice contient déjà une ligne pour le 17/09, rattachée à la pièce RH-03. Vous vous apprêtez à saisir l’absence de Camille Martin.',
 opts:[
  {t:'Oui, l’ajouter encore une fois pour être sûr qu’elle soit prise en compte',ok:false,fb:'La même journée compterait deux fois. Le doublon est l’une des erreurs les plus simples à éviter : on vérifie ce qui existe avant d’ajouter.'},
  {t:'Non : vérifier la ligne existante, constater qu’elle correspond à RH-03 et ne rien ajouter',ok:true,fb:'La ligne existante correspond à la pièce : elle suffit. Le registre reste juste et traçable.'}],
 lesson:'Le registre reste à une seule ligne : 17/09 — congé — 1 journée, pièce RH-03. Vérifier l’existant avant d’ajouter évite qu’une même absence compte deux fois.'},
{label:'Contrôler',doc:'registre',
 q:'Le résultat paraît incohérent. Première démarche ?',
 ctx:'Au contrôle de fin d’exercice, le résultat affiché ne correspond pas à ce que vous attendiez au vu des pièces. Aucun montant n’est donné ici : c’est votre démarche qui compte.',
 opts:[
  {t:'Valider quand même : le logiciel a fait le calcul',ok:false,fb:'Un calcul automatique dépend de ce qu’on lui a fourni. Un résultat incohérent se comprend avant d’être validé.'},
  {t:'Corriger le montant à la main pour qu’il paraisse juste',ok:false,fb:'Modifier un montant sans cause identifiée masque l’erreur au lieu de la corriger, et vous ne pourriez pas expliquer votre choix.'},
  {t:'Revenir aux pièces, aux variables saisies et au paramétrage pour expliquer l’écart',ok:true,fb:'C’est la bonne démarche : on remonte la chaîne jusqu’à l’origine de l’écart, puis on explique avant de valider.'}],
 lesson:'Un logiciel calcule à partir de ce qu’on lui donne. Face à un écart, on remonte la chaîne — pièces, variables, paramétrage — et on explique avant toute validation.'}
];
var PROFILES={
 bases:{t:'Vos bases de paie sont à consolider',p:'La formule SILAE 20 h demande la maîtrise des fondamentaux : lire un bulletin, distinguer brut et net, identifier les cotisations. Parlez-en d’abord avec un conseiller : il vérifie vos acquis et vous oriente vers un parcours adapté avant toute inscription.',label:'Mes bases de paie sont à consolider'},
 decouvre:{t:'Vous connaissez la paie et découvrez SILAE',p:'La formule 20 h en visioconférence individuelle vous fait pratiquer dans le logiciel, du paramétrage du dossier jusqu’à la DSN. Un entretien vérifie d’abord vos prérequis et vos besoins.',label:'Je connais la paie et je découvre SILAE'},
 perfection:{t:'Vous utilisez déjà SILAE',p:'Listez les situations qui vous ralentissent : paramétrage, congés et absences, contrôle des cotisations, DSN. Un conseiller compare avec vous les formules SILAE et précise contenus, durée et modalités.',label:'J’utilise déjà SILAE et veux me perfectionner'}
};
var st;
function reset(){st={i:0,far:0,pick:STEPS.map(function(){return null}),done:STEPS.map(function(){return false}),doc:'fiche',seen:{}}}
reset();
function $(id){return document.getElementById(id)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var app=$('demo-app'),dossier=$('dossier');
var rhOpen=function(){return st.done[0]};
var regOpen=function(){return st.far>=2};
function showDoc(name,focus){
 st.doc=name;st.seen[name]=true;
 ['fiche','releve','rh','registre'].forEach(function(d){var t=$('tab-'+d),p=$('doc-'+d),on=d===name;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;p.hidden=!on;if(on){p.style.animation='none';void p.offsetWidth;p.style.animation=''}});
 syncTabs();if(focus)$('tab-'+name).focus();
}
function syncTabs(){
 $('rh-locked').hidden=rhOpen();$('rh-open').hidden=!rhOpen();
 $('reg-locked').hidden=regOpen();$('reg-open').hidden=!regOpen();
 dossier.classList.toggle('has-rh',rhOpen());
 $('tab-rh').classList.toggle('locked',!rhOpen());$('tab-registre').classList.toggle('locked',!regOpen());
 $('tab-rh').classList.toggle('new',rhOpen()&&!st.seen.rh);$('tab-registre').classList.toggle('new',regOpen()&&!st.seen.registre);
}
var tabs=['fiche','releve','rh','registre'];
[].forEach.call(document.querySelectorAll('.tab'),function(t){
 t.addEventListener('click',function(){showDoc(t.getAttribute('data-doc'))});
 t.addEventListener('keydown',function(e){var k=tabs.indexOf(t.getAttribute('data-doc'));if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();showDoc(tabs[(k+(e.key==='ArrowRight'?1:3))%4],true)}});
});
function stepper(){
 var h='';STEPS.forEach(function(s,k){h+='<li><button type="button" data-step="'+k+'"'+(k>st.far?' disabled':'')+(k===st.i?' aria-current="step"':'')+' class="'+(st.done[k]?'done':'')+'"><span>0'+(k+1)+'</span>'+esc(s.label)+'</button></li>'});
 $('stepper').innerHTML=h;
}
$('stepper').addEventListener('click',function(e){var b=e.target.closest('button[data-step]');if(b&&!b.disabled)go(+b.getAttribute('data-step'))});
function visualBefore(k){
 if(k===2)return'<div class="vis"><p class="vis-cap">Ligne déjà présente au registre</p><div class="reg-line">17/09 — congé — 1 journée <span class="ref">RH-03</span></div></div>';
 if(k===3)return'<div class="vis"><div class="gap"><b>Écart à expliquer</b>Le résultat ne correspond pas à ce que les pièces laissent attendre.</div></div>';
 return'';
}
function visualAfter(k){
 if(k===1)return'<div class="vis" style="margin-top:18px"><p class="vis-cap">Le dossier comparé aux pièces</p><div class="cmp">'+
  '<div><span class="l">Salariée</span><span class="val">Camille Martin</span><span class="src"><span>FS-01</span><span>RA-09</span><span>RH-03</span></span></div>'+
  '<div><span class="l">Période</span><span class="val">Septembre 2026</span><span class="src"><span>FS-01</span><span>RA-09</span></span></div>'+
  '<div><span class="l">Date</span><span class="val">17/09/2026</span><span class="src"><span>RA-09</span><span>RH-03</span></span></div>'+
  '<div><span class="l">Qualification</span><span class="val">Congé autorisé, 1 journée</span><span class="src"><span>RH-03</span><span class="no">absente du relevé</span></span></div></div></div>';
 if(k===2)return'<div class="vis" style="margin-top:18px"><p class="vis-cap">Registre après contrôle · 1 ligne</p><div class="reg-line">17/09 — congé — 1 journée <span class="ref">RH-03</span></div></div>';
 if(k===3)return'<div class="vis" style="margin-top:18px"><p class="vis-cap">Points à retravailler avant validation</p><ul class="syn">'+
  '<li><b>Pièces</b><span>Absence du 17/09 qualifiée par la RH (RH-03)</span><span class="s fait">vérifié</span></li>'+
  '<li><b>Variable</b><span>Une seule ligne, rattachée à sa pièce</span><span class="s fait">vérifié</span></li>'+
  '<li><b>Paramétrage</b><span>À relire : l’exercice ne donne pas de règle de valorisation</span><span class="s todo">à reprendre</span></li>'+
  '<li><b>Écart</b><span>À expliquer avant toute validation</span><span class="s todo">à reprendre</span></li></ul>'+
  '<p class="syn-note">Ce n’est pas un bulletin : aucun montant n’est calculé ni certifié conforme.</p></div>';
 return'';
}
function renderOpts(k){
 var s=STEPS[k],done=st.done[k],p=st.pick[k],h='';
 s.opts.forEach(function(o,j){var cls='opt'+(done?(o.ok?' good':'')+(p===j?' picked'+(o.ok?'':' bad'):''):'');
  var v=done?(o.ok?(p===j?'Votre choix · bonne démarche':'Bonne démarche'):(p===j?'Votre choix':'')):'';
  h+='<label class="'+cls+'"><input type="radio" name="step-opt" value="'+j+'"'+(p===j?' checked':'')+(done?' disabled':'')+'><span class="dot"></span><span class="t">'+esc(o.t)+'</span>'+(v?'<span class="v">'+v+'</span>':'')+'</label>'});
 var box=$('step-opts');box.innerHTML=h;box.classList.toggle('locked',done);
}
function feedback(k){
 var s=STEPS[k];if(!st.done[k])return'';
 var o=s.opts[st.pick[k]],good=s.opts.filter(function(x){return x.ok})[0];
 var h='<div class="fb '+(o.ok?'ok':'ko')+'"><p class="fb-v">'+(o.ok?OK+'Bonne démarche':KO+'Ce n’est pas la démarche attendue')+'</p><p>'+esc(o.fb)+'</p>';
 if(!o.ok)h+='<p class="good-way"><b>La démarche attendue :</b> '+esc(good.t)+'. '+esc(good.fb)+'</p>';
 return h+'<p class="lesson">'+esc(s.lesson)+'</p></div>';
}
function render(focus){
 var k=st.i,s=STEPS[k],last=k===STEPS.length-1;
 stepper();
 $('step-k').textContent='Étape '+(k+1)+' sur '+STEPS.length+' · '+s.label;
 $('step-q').textContent=s.q;$('step-ctx').textContent=s.ctx;
 $('step-visual').innerHTML=visualBefore(k);
 renderOpts(k);$('step-hint').textContent='';
 $('validate-step').hidden=st.done[k];
 $('step-feedback').innerHTML=feedback(k);
 $('step-after').innerHTML=st.done[k]?visualAfter(k):'';
 $('previous-step').disabled=k===0;
 var nx=$('next-step');nx.disabled=!st.done[k];nx.firstChild.nodeValue=last?'Voir la synthèse':'Étape suivante';
 var b=$('step-body');b.classList.remove('enter');void b.offsetWidth;b.classList.add('enter');
 if(focus)$('step-q').focus({preventScroll:true});
}
function smooth(){return matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}
function headOffset(){var hd=document.getElementById('hd');if(!hd)return 84;var top=parseFloat(getComputedStyle(hd).top)||0;return Math.ceil(hd.offsetHeight+top+12)}
function scrollTo(el){var t=el.getBoundingClientRect().top+window.scrollY-headOffset();window.scrollTo({top:Math.max(t,0),behavior:smooth()})}
function go(k){st.i=k;if(k>st.far)st.far=k;showDoc(STEPS[k].doc);render(true);scrollTo(app)}
$('step-opts').addEventListener('change',function(e){if(e.target.name==='step-opt'){st.pick[st.i]=+e.target.value;$('step-hint').textContent=''}});
$('validate-step').addEventListener('click',function(){
 var k=st.i;if(st.pick[k]===null){$('step-hint').textContent='Choisissez d’abord une décision.';var f=document.querySelector('input[name="step-opt"]');if(f)f.focus();return}
 st.done[k]=true;
 if(k===0){syncTabs();showDoc('rh')}
 if(k===1){showDoc('releve')}
 render(false);
 var fb=$('step-feedback');if(fb.firstChild){fb.firstChild.setAttribute('tabindex','-1');fb.firstChild.focus({preventScroll:true});if(window.innerWidth<=1024)scrollTo(fb)}
});
$('previous-step').addEventListener('click',function(){if(st.i>0)go(st.i-1)});
$('next-step').addEventListener('click',function(){if(!st.done[st.i])return;if(st.i<STEPS.length-1)go(st.i+1);else showResult()});
function score(){return STEPS.reduce(function(n,s,k){return n+(st.done[k]&&s.opts[st.pick[k]].ok?1:0)},0)}
function toRework(){return STEPS.filter(function(s,k){return st.done[k]&&!s.opts[st.pick[k]].ok}).map(function(s){return s.label})}
function showResult(){
 var n=score();
 $('res-big').innerHTML=n+'<small> / '+STEPS.length+' bons réflexes</small>';
 $('res-p').textContent=n===STEPS.length?'Vous avez suivi la démarche attendue à chaque étape. En formation, ces contrôles se pratiquent sur des cas complets, dans le logiciel.':'Les étapes marquées « à retravailler » sont celles où la démarche attendue diffère de votre premier choix. Vous pouvez les revoir avec les étapes ci-dessus.';
 var h='';STEPS.forEach(function(s,k){var o=s.opts[st.pick[k]];h+='<li><i>0'+(k+1)+'</i><div><b>'+esc(s.label)+'</b>'+(o.ok?'<span class="ok">Bonne démarche dès votre premier choix</span>':'<span class="ko">À retravailler · vous aviez choisi : « '+esc(o.t)+' »</span>')+'</div></li>'});
 $('res-list').innerHTML=h;
 var r=$('demo-result');r.hidden=false;scrollTo(r);r.focus({preventScroll:true});
 stepper();
}
function profile(){var p=document.querySelector('input[name="profile"]:checked');return p?p.value:''}
$('profiles').addEventListener('change',function(){
 var p=PROFILES[profile()];if(!p)return;
 $('advice').innerHTML='<div class="advice"><b>'+esc(p.t)+'</b>'+esc(p.p)+'</div>';
 var offer=$('offer-link'),ask=$('ask-advice');
 if(profile()==='bases'){offer.className='btn btn-ghost';ask.className='btn btn-primary';offer.parentNode.insertBefore(ask,offer)}
 else{offer.className='btn btn-primary';ask.className='btn btn-ghost';offer.parentNode.insertBefore(offer,ask)}
 if(!$('prep-out').hidden)buildPrep();
});
function buildPrep(){
 var p=PROFILES[profile()],rw=toRework();
 $('prep-text').value=['Cas guidé SILAE « Avant de valider une paie » (exercice fictif, Switching Formation)',
  'Bons réflexes : '+score()+' sur '+STEPS.length,
  'À retravailler : '+(rw.length?rw.join(', '):'aucune étape'),
  'Mon profil : '+(p?p.label:'à préciser lors de l’échange'),
  '','Je souhaite échanger avec un conseiller sur la formation SILAE et vérifier les prérequis.'].join('\n');
}
$('prepare-contact').addEventListener('click',function(){buildPrep();$('prep-out').hidden=false;$('copy-status').textContent='Ce texte n’est ni enregistré ni transmis.';$('prep-text').focus()});
$('copy-prep').addEventListener('click',function(){
 var ta=$('prep-text'),s=$('copy-status');
 function fallback(){ta.focus();ta.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}s.textContent=ok?'Texte copié.':'Sélectionnez le texte pour le copier.'}
 if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(ta.value).then(function(){s.textContent='Texte copié.'},fallback)}else fallback();
});
$('restart-demo').addEventListener('click',function(){
 reset();
 [].forEach.call(document.querySelectorAll('input[name="profile"]'),function(i){i.checked=false});
 $('advice').innerHTML='';$('prep-out').hidden=true;$('prep-text').value='';
 var offer=$('offer-link'),ask=$('ask-advice');offer.className='btn btn-primary';ask.className='btn btn-ghost';offer.parentNode.insertBefore(offer,ask);
 $('demo-result').hidden=true;go(0);
});
$('start-demo').addEventListener('click',function(){var first=app.hidden;app.hidden=false;if(first){showDoc('releve');render(true)}scrollTo(app);$('step-q').focus({preventScroll:true})});
document.documentElement.classList.add('js');
})();
