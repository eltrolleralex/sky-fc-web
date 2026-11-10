
/* SKY FC · Parte médico público, datos en SKY_DATA.injuries */
(function () {
  "use strict";
  function byId(id){ return document.getElementById(id); }
  function esc(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g,function(char){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char];
    });
  }
  function fmt(date){
    if(!date) return "Fecha no registrada";
    var parts=String(date).split("-");
    if(parts.length!==3) return esc(date);
    var dt=new Date(Number(parts[0]),Number(parts[1])-1,Number(parts[2]));
    return dt.toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"});
  }
  function folded(txt){
    return String(txt||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  }
  function stateOf(entry){ return entry.state==="recovered" ? "recovered" : "active"; }
  function statusMarkup(entry){
    var recovered=stateOf(entry)==="recovered";
    return '<span class="medical-chip '+(recovered?'medical-chip--recovered':'')+'">'+(recovered?'✓ Recuperado':'● En recuperación')+'</span>';
  }
  function startOf(entry){return entry.since ? fmt(entry.since) : esc(entry.sinceText||"Fecha no registrada");}
  function returnOf(entry){
    if(entry.returnDate) return "Reincorporación · "+fmt(entry.returnDate);
    return entry.returnNote || (stateOf(entry)==="recovered"?"Alta deportiva confirmada; fecha exacta no registrada":"Vuelta aún sin fecha confirmada");
  }
  function caseTimeline(entry){
    var begin='<li><strong>'+startOf(entry)+'</strong>'+esc(entry.type)+(entry.context?' · '+esc(entry.context):'')+'</li>';
    var end='<li><strong>'+(entry.returnDate?fmt(entry.returnDate):stateOf(entry)==="recovered"?"Fecha no registrada":"Situación actual")+'</strong>'+esc(returnOf(entry))+'</li>';
    return '<ol class="medical-timeline">'+begin+end+'</ol>';
  }
  function recordMarkup(entry){
    var state=stateOf(entry),start=startOf(entry);
    var number=entry.number!=null?String(entry.number):"—";
    var name=entry.playerName || entry.player || "Jugador";
    var detail=entry.detail||entry.context||"";
    return '<article class="medical-record medical-record--'+(state==="recovered"?"closed":"open")+'">'+
      '<div class="medical-record-head"><div class="medical-record-number" aria-label="Dorsal '+esc(number)+'">'+esc(number)+'</div>'+
      '<div class="medical-record-titles"><h4>'+esc(name)+'</h4><p class="medical-record-title">'+esc(entry.role||"SKY FC")+'</p></div>'+
      '<div class="medical-record-status">'+statusMarkup(entry)+'</div></div>'+
      '<div class="medical-record-main"><p><strong>'+esc(entry.type)+'</strong></p>'+
      (detail?'<p>'+esc(detail)+'</p>':'')+
      '<div class="medical-record-meta"><span class="medical-meta-pill">Inicio: '+start+'</span>'+
      '<span class="medical-meta-pill">'+esc(returnOf(entry))+'</span></div></div>'+
      '<details class="medical-details"><summary>Ver evolución del caso</summary>'+caseTimeline(entry)+'</details>'+
      '</article>';
  }
  function openMarkup(entry){
    var num=entry.number!=null?String(entry.number):"—";
    return '<article class="medical-feature"><div class="medical-jersey" aria-hidden="true">'+esc(num)+'</div>'+
      '<div class="medical-feature-top">'+statusMarkup(entry)+
      (entry.role?'<span class="medical-chip medical-chip--muted">'+esc(entry.role)+'</span>':'')+'</div>'+
      '<h4>'+esc(entry.playerName||entry.player||"Jugador")+'</h4>'+
      '<p class="medical-condition">'+esc(entry.type)+'</p>'+
      '<p>'+esc(entry.context||"")+'</p>'+
      '<p>Inicio: <strong>'+startOf(entry)+'</strong></p>'+
      '<p class="medical-return">'+esc(returnOf(entry))+'</p></article>';
  }
  window.renderSkyInjuryHub=function(data){
    var records=Array.isArray(data.injuries)?data.injuries.slice():[];
    var open=records.filter(function(e){return stateOf(e)==="active";});
    var closed=records.filter(function(e){return stateOf(e)==="recovered";});
    var update=byId("medicalUpdated");
    if(update) update.textContent=fmt(data.injuryUpdatedAt||"2026-11-10");
    var stats=byId("injuryStats");
    if(stats) stats.innerHTML=
      '<div class="medical-number medical-number--open"><strong>'+open.length+'</strong><span>Casos en seguimiento</span></div>'+
      '<div class="medical-number medical-number--closed"><strong>'+closed.length+'</strong><span>Recuperaciones registradas</span></div>'+
      '<div class="medical-number medical-number--total"><strong>'+records.length+'</strong><span>Registros históricos</span></div>';
    var active=byId("injuryActive");
    if(active) active.innerHTML=open.length?open.map(openMarkup).join(""):'<div class="medical-no-open">No hay bajas activas registradas en el parte público.</div>';
    var holder=byId("injuryHistory"), counter=byId("medicalHistoryCount"),search=byId("medicalSearch");
    var buttons=Array.prototype.slice.call(document.querySelectorAll("[data-medical-filter]"));
    var chosen="all";
    function draw(){
      var query=folded(search?search.value:"");
      var found=records.filter(function(e){
        if(chosen!=="all"&&stateOf(e)!==chosen)return false;
        return folded([e.playerName,e.player,e.type,e.context,e.role].join(" ")).indexOf(query)!==-1;
      }).sort(function(a,b){
        if(stateOf(a)!==stateOf(b))return stateOf(a)==="active"?-1:1;
        return (b.since||"").localeCompare(a.since||"");
      });
      if(counter)counter.textContent=found.length+" de "+records.length+" registros";
      if(holder)holder.innerHTML=found.length?found.map(recordMarkup).join(""):'<div class="medical-empty">No se han encontrado registros con esos filtros.</div>';
    }
    buttons.forEach(function(button){
      button.addEventListener("click",function(){
        chosen=button.getAttribute("data-medical-filter")||"all";
        buttons.forEach(function(b){
          var active=b===button;b.classList.toggle("is-active",active);b.setAttribute("aria-pressed",String(active));
        });
        draw();
      });
    });
    if(search)search.addEventListener("input",draw);
    draw();
  };
}());
