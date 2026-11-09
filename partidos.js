(function(){
"use strict";
var D=window.SKY_DATA||{fixtures:[],results:[]};
var $=function(s){return document.querySelector(s)};
var esc=function(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var sky=function(n){return /SKY\s*FC/i.test(n||"")};
var other=function(m){return sky(m.home)?m.away:m.home};
var slug=function(s){return (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")};
var key=function(m){return m.competition==="liga"?"liga-j"+m.jornada+"-"+m.date:"amistoso-"+m.date+"-"+slug(other(m))};
var url=function(m){return "/partido.html?partido="+encodeURIComponent(key(m))};
var fmt=function(d){return d?new Intl.DateTimeFormat("es-ES",{day:"numeric",month:"long",year:"numeric"}).format(new Date(d+"T12:00:00")):"Fecha por confirmar"};
var finished=function(m){return Number.isFinite(m.homeScore)&&Number.isFinite(m.awayScore)};
var badge=function(m){return '<span class="mc-tag '+(m.competition==="amistoso"?"friendly":"")+'">'+(m.competition==="amistoso"?"● AMISTOSO":"● LIGA OFICIAL")+"</span>"};
var crest=function(name){return sky(name)?'<span class="mc-crest"><img src="/escudo-oficial-skyfc.webp" alt="Escudo oficial M+Qpizza SKY FC"></span>':'<span class="mc-crest" aria-label="Equipo rival">'+esc((name||"").split(/\s+/).slice(0,2).map(function(a){return a.charAt(0)}).join("").toUpperCase())+"</span>"};
var side=function(name,right){return '<div class="mc-side '+(right?"away":"")+'">'+crest(name)+'<div class="mc-team-info"><div class="mc-team-name">'+esc(name)+'</div><small class="mc-team-small">'+(sky(name)?"SKY FC · ALBACETE":"EQUIPO RIVAL")+"</small></div></div>"};
var score=function(m){return finished(m)?'<div class="mc-big-score">'+m.homeScore+'<span class="mc-dash">:</span>'+m.awayScore+'</div><div class="mc-score-sub">FINALIZADO</div>':'<div class="mc-big-score">VS</div><div class="mc-score-sub">'+esc(m.time||"HORA POR CONFIRMAR")+"</div>"};
var scoreline=function(m){return '<div class="mc-scoreline">'+side(m.home,false)+'<div class="mc-center-result">'+score(m)+'</div>'+side(m.away,true)+'</div>'};
var metadata=function(m){return '<div class="mc-mini-metadata"><span>◷ '+esc(fmt(m.date))+'</span><span>⌁ '+esc(m.round||"")+'</span><span>⌖ '+esc(m.venue||"Campo por confirmar")+'</span></div>'};
var games=(D.results||[]).concat(D.fixtures||[]).sort(function(a,b){return (b.date||"").localeCompare(a.date||"")});
var each=function(m){return '<a class="mc-game" href="'+url(m)+'" aria-label="Ver ficha de '+esc(m.home)+' contra '+esc(m.away)+'"><div class="mc-game-top">'+badge(m)+'<span class="mc-date">'+esc(fmt(m.date))+'</span></div>'+scoreline(m)+'<div class="mc-game-foot"><span>'+esc(m.round||"Temporada 2026/27")+'</span><strong>VER PARTIDO ↗</strong></div></a>'};
function renderList(){
 var spot=$("#mc-highlight");
 var pick=(D.fixtures||[]).filter(function(m){return !m.date||new Date(m.date+"T23:59:59")>=new Date()}).sort(function(a,b){return (a.date||"").localeCompare(b.date||"")})[0]||D.results[0]||games[0];
 if(pick){spot.innerHTML='<div class="mc-feature-head"><span class="mc-kicker-line">'+(finished(pick)?"ÚLTIMO RESULTADO":"PRÓXIMO ENCUENTRO")+'</span><a href="'+url(pick)+'" class="mc-feature-link">VER FICHA COMPLETA ↗</a></div><div class="mc-match-inner">'+scoreline(pick)+metadata(pick)+'</div>'}else spot.hidden=true;
 var grid=$("#mc-list"),filter="todos";
 function update(){var subset=games.filter(function(m){switch(filter){case "liga":return m.competition==="liga";case "amistoso":return m.competition==="amistoso";case "final":return finished(m);case "proximos":return !finished(m);default:return true}});grid.innerHTML=subset.map(each).join("")||'<div class="mc-empty">Todavía no hay partidos en esta categoría.</div>';$("#mc-match-count").textContent=subset.length+" partidos";document.querySelectorAll(".mc-filter").forEach(function(btn){btn.setAttribute("aria-pressed",String(btn.dataset.filter===filter))})}
 document.querySelectorAll(".mc-filter").forEach(function(b){b.addEventListener("click",function(){filter=b.dataset.filter;update()})});update()
}
function renderDetail(){
 var id=new URLSearchParams(location.search).get("partido"),m=games.find(function(g){return key(g)===id});
 if(!m){document.title="Partido no encontrado | SKY FC";$("#mc-detail").innerHTML='<section class="mc-intro"><div class="mc-eyebrow">MATCH CENTER</div><h1 class="mc-display">Partido no encontrado</h1><p class="mc-lede">La ficha solicitada no existe o ha cambiado de dirección.</p><div class="mc-actions"><a class="mc-btn primary" href="/partidos.html">Ver todos los partidos</a></div></section>';return}
 var isDone=finished(m);document.title=other(m)+" vs SKY FC | Partido "+fmt(m.date)+" | SKY FC";
 $("#mc-detail-intro").innerHTML='<div class="mc-eyebrow">'+(m.competition==="liga"?"COMPETICIÓN OFICIAL":"PARTIDO AMISTOSO")+' · TEMPORADA 2026/27</div><h1>'+esc(m.round||"Ficha del encuentro")+'</h1><p>Resumen, goles, incidencias y datos confirmados del partido.</p>';
 $("#mc-board").innerHTML='<div class="mc-feature-head">'+badge(m)+'<span class="mc-kicker-line">'+(isDone?"RESULTADO FINAL":"PREVIA DEL ENCUENTRO")+'</span></div>'+scoreline(m)+metadata(m);
 var events=Array.isArray(m.events)?m.events:[],goals=events.filter(function(e){return e.type==="goal"&&e.team==="sky"}),assisted=[];
 goals.forEach(function(e){var s=assisted.find(function(p){return p.player===e.player});if(s)s.goals++;else assisted.push({player:e.player,goals:1,number:e.number})});
 var opp=sky(m.home)?m.homeScore:m.awayScore, against=sky(m.home)?m.awayScore:m.homeScore;
 var stats=isDone?[["Goles SKY",opp,"Marcador final"],["Goles rival",against,"Marcador final"],["Goleadores SKY",assisted.length,"Identificados"],["Tarjetas",Array.isArray(m.cards)?m.cards.length:"—",Array.isArray(m.cards)?"Registradas":"Sin registro"]]:[["Estado","Próximo","Pendiente de jugar"],["Fecha",m.date?fmt(m.date):"—","Calendario"],["Hora",m.time||"—",m.time?"Confirmada":"Por asignar"],["Sede",m.venue?"Asignada":"—",m.venue?"Ver abajo":"Por confirmar"]];
 $("#mc-stat-row").innerHTML=stats.map(function(s){return '<div class="mc-stat"><small>'+esc(s[0])+'</small><strong>'+esc(s[1])+'</strong><p>'+esc(s[2])+"</p></div>"}).join("");
 $("#mc-scorers").innerHTML=assisted.length?assisted.map(function(e){return '<div class="mc-player-row"><div class="mc-player-main"><span class="mc-shirt">'+esc(e.number==null?"★":e.number)+'</span><div><div class="mc-player-name">'+esc(e.player)+'</div><div class="mc-player-number">'+(e.number!=null?"Dorsal "+e.number:"Jugador del SKY FC")+'</div></div></div><span class="mc-goal-total">⚽ × '+e.goals+"</span></div>"}).join(""):'<div class="mc-notice">'+(isDone?"Los goleadores individuales de este encuentro están pendientes de confirmar.":"Los goleadores aparecerán aquí cuando se dispute el encuentro y se confirmen los datos.")+"</div>";
 $("#mc-events").innerHTML=events.length?events.map(function(e){return '<div class="mc-event"><span class="mc-minute">'+esc(e.minute||"—")+'′</span><div class="mc-event-content"><strong>'+(e.type==="goal"?"⚽ Gol":e.type==="yellow"?"🟨 Tarjeta amarilla":e.type==="red"?"🟥 Tarjeta roja":"Incidencia")+'</strong><small>'+esc(e.player||e.description||"")+'</small></div></div>'}).join(""):'<div class="mc-notice">'+(isDone?"No se han registrado incidencias individuales confirmadas.":"La cronología estará disponible después del partido.")+"</div>";
 var cards=Array.isArray(m.cards)?m.cards:null;
 $("#mc-cards").innerHTML=cards===null?'<div class="mc-notice">No disponemos de un acta confirmada de tarjetas. No significa que el encuentro terminara sin amonestaciones.</div>':cards.length?cards.map(function(c){return '<div class="mc-player-row"><span>'+esc(c.player||"Jugador")+'</span><strong>'+(c.type==="red"?"🟥 Roja":"🟨 Amarilla")+' · '+esc(c.minute||"—")+"′</strong></div>"}).join(""):'<div class="mc-notice">Sin tarjetas registradas en el acta del encuentro.</div>';
 $("#mc-context").innerHTML='<div class="mc-player-row"><span>Competición</span><strong>'+esc(m.competition==="liga"?"Liga · Grupo A":"Amistoso")+'</strong></div><div class="mc-player-row"><span>Fecha</span><strong>'+esc(fmt(m.date))+'</strong></div><div class="mc-player-row"><span>Hora</span><strong>'+esc(m.time||"Por confirmar")+'</strong></div><div class="mc-player-row"><span>Campo</span><strong>'+esc(m.venue||"Por confirmar")+'</strong></div>';
 $("#mc-confirmation").textContent=(m.competition==="amistoso"?"Este amistoso no cuenta para los números de la liga. ":"")+("Las estadísticas individuales solo muestran los datos confirmados. Los minutos de los goles del rival y las tarjetas no se deducen del marcador.");
 var i=games.findIndex(function(g){return key(g)===key(m)}),prev=games[i+1],next=games[i-1];
 $("#mc-neighbors").innerHTML=(prev?'<a class="mc-btn" href="'+url(prev)+'">← Partido anterior</a>':"")+'<a class="mc-btn primary" href="/partidos.html">Todos los partidos</a>'+(next?'<a class="mc-btn" href="'+url(next)+'">Partido siguiente →</a>':"");
}
if(document.body.dataset.mcPage==="list")renderList();
if(document.body.dataset.mcPage==="detail")renderDetail();
})();