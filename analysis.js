let analysisDraft='',analysisQuery='',analysisPage=1,analysisSource='',analysisBusy=-1,analysisNotice='';
const analysisDeleted=new Set(),analysisStatuses=new Map();

function analysisTasks(){
 const a=cfg.analysis||{};
 if(analysisSource!==String(a.tasks||'')){
  analysisSource=String(a.tasks||'');analysisDeleted.clear();analysisStatuses.clear();analysisBusy=-1;analysisPage=1;analysisNotice='';
 }
 return obj(a.tasks||'',';').map((parts,id)=>({id,name:parts[0]||'',route:parts[1]||'',segment:parts[2]||'',site:parts[3]||'',siteEn:parts[4]||'',status:analysisStatuses.get(id)||parts[5]||a.pending_status||''})).filter(task=>!analysisDeleted.has(task.id));
}

function renderAnalysis(){
 const a=cfg.analysis||{},tasks=analysisTasks(),match=tasks.filter(task=>task.name.toLocaleLowerCase().includes(analysisQuery.toLocaleLowerCase()));
 const pageSize=Math.max(1,Number.parseInt(a.page_size,10)||6),pageCount=Math.max(1,Math.ceil(match.length/pageSize));
 analysisPage=Math.min(Math.max(1,analysisPage),pageCount);
 const shown=match.slice((analysisPage-1)*pageSize,analysisPage*pageSize);
 const columns=split(a.columns||'','|');
 document.title=(a.heading||'')+' · '+(cfg.app?.name||'');
 $('#app').innerHTML=`<div class="analysis-page"><header class="analysis-header"><div class="analysis-heading"><span class="analysis-icon" aria-hidden="true">▤</span><strong>${esc(a.heading)}</strong></div><button class="analysis-close" type="button" data-analysis-home aria-label="${esc(a.close_label)}">×</button></header><main class="analysis-main"><form class="analysis-search" data-analysis-search><input type="search" name="task" placeholder="${esc(a.search_placeholder)}" aria-label="${esc(a.search_placeholder)}"><button type="submit">${esc(a.search_button)}</button></form><div class="analysis-table-viewport"><section class="analysis-table" aria-label="${esc(a.heading)}"><div class="analysis-table-head analysis-grid">${columns.map(title=>`<div>${esc(title)}</div>`).join('')}</div><div class="analysis-table-shell"><div class="analysis-rows" data-analysis-rows>${shown.map(task=>`<div class="analysis-row analysis-grid"><div class="analysis-task-name">${esc(task.name)}</div><div>${esc(task.route)}</div><div>${esc(task.segment)}</div><div>${esc(task.site)}</div><div>${esc(task.siteEn)}</div><div><span class="analysis-status ${task.status===(a.done_status||'')?'done':''}">${task.status===(a.pending_status||'')&&task.id===analysisBusy?'<i aria-hidden="true"></i>':''}${esc(task.status)}</span></div><div class="analysis-operations"><button type="button" class="analysis-action" data-analyze="${task.id}">${esc(a.analyze_action)}</button><button type="button" class="analysis-delete" data-delete="${task.id}">${esc(a.delete_action)}</button></div></div>`).join('')}${shown.length?'':`<div class="analysis-empty">${esc(a.empty_text)}</div>`}</div><div class="analysis-scrollbar"><button type="button" data-scroll-up aria-label="${esc(a.scroll_up_label)}">▲</button><div class="analysis-scroll-rail" data-scroll-rail><div class="analysis-scroll-thumb" data-scroll-thumb role="scrollbar" aria-label="${esc(a.scroll_label)}" tabindex="0"></div></div><button type="button" data-scroll-down aria-label="${esc(a.scroll_down_label)}">▼</button></div></div></section></div><div class="analysis-pagination"><span>${esc(a.total_prefix)}${match.length}${esc(a.total_suffix)}</span><button type="button" data-analysis-prev aria-label="${esc(a.previous_label)}" ${analysisPage===1?'disabled':''}>‹</button><div class="analysis-pages">${Array.from({length:pageCount},(_,i)=>`<button type="button" data-analysis-page="${i+1}" class="${analysisPage===i+1?'active':''}" aria-current="${analysisPage===i+1?'page':'false'}">${i+1}</button>`).join('')}</div><button type="button" data-analysis-next aria-label="${esc(a.next_label)}" ${analysisPage===pageCount?'disabled':''}>›</button></div><p class="analysis-notice" role="status">${esc(analysisNotice)}</p></main><button class="analysis-back" type="button" data-analysis-home aria-label="${esc(a.back_label)}">↩</button></div>`;
 const input=document.querySelector('.analysis-search input');input.value=analysisDraft;
 document.querySelectorAll('[data-analysis-home]').forEach(button=>button.onclick=()=>{section='home';render()});
 input.oninput=()=>{analysisDraft=input.value};
 document.querySelector('[data-analysis-search]').onsubmit=event=>{event.preventDefault();analysisQuery=input.value.trim();analysisDraft=input.value;analysisPage=1;analysisNotice='';renderAnalysis()};
 document.querySelectorAll('[data-analysis-page]').forEach(button=>button.onclick=()=>{analysisPage=Number(button.dataset.analysisPage);renderAnalysis()});
 document.querySelector('[data-analysis-prev]').onclick=()=>{if(analysisPage>1){analysisPage--;renderAnalysis()}};
 document.querySelector('[data-analysis-next]').onclick=()=>{if(analysisPage<pageCount){analysisPage++;renderAnalysis()}};
 document.querySelectorAll('[data-delete]').forEach(button=>button.onclick=()=>{analysisDeleted.add(Number(button.dataset.delete));analysisNotice=a.deleted_notice||'';renderAnalysis()});
 document.querySelectorAll('[data-analyze]').forEach(button=>button.onclick=()=>{
  const id=Number(button.dataset.analyze);
  if(!tasks.some(task=>task.id===id))return;
  analysisDetailTaskId=id;section='analysis_detail';render();
 });
 analysisBindScroll();
}

function analysisBindScroll(){
 const list=document.querySelector('[data-analysis-rows]'),rail=document.querySelector('[data-scroll-rail]'),thumb=document.querySelector('[data-scroll-thumb]');
 if(!list||!rail||!thumb)return;
 const sync=()=>{const max=Math.max(0,list.scrollHeight-list.clientHeight),height=rail.clientHeight,thumbHeight=max?Math.max(18,Math.min(height,height*list.clientHeight/list.scrollHeight)):height,travel=Math.max(0,height-thumbHeight);thumb.style.height=thumbHeight+'px';thumb.style.transform=`translateY(${max?list.scrollTop/max*travel:0}px)`;thumb.setAttribute('aria-valuemin','0');thumb.setAttribute('aria-valuemax',String(Math.round(max)));thumb.setAttribute('aria-valuenow',String(Math.round(list.scrollTop)))};
 list.onscroll=sync;
 document.querySelector('.analysis-scrollbar [data-scroll-up]').onclick=()=>list.scrollBy({top:-90,behavior:'smooth'});
 document.querySelector('.analysis-scrollbar [data-scroll-down]').onclick=()=>list.scrollBy({top:90,behavior:'smooth'});
 rail.onclick=event=>{if(event.target===thumb)return;const box=rail.getBoundingClientRect(),max=list.scrollHeight-list.clientHeight,travel=Math.max(1,rail.clientHeight-thumb.offsetHeight);list.scrollTop=Math.max(0,Math.min(max,(event.clientY-box.top-thumb.offsetHeight/2)/travel*max))};
 thumb.onpointerdown=event=>{event.preventDefault();event.stopPropagation();thumb.setPointerCapture(event.pointerId);const startY=event.clientY,startTop=list.scrollTop;thumb.onpointermove=move=>{const max=list.scrollHeight-list.clientHeight,travel=Math.max(1,rail.clientHeight-thumb.offsetHeight);list.scrollTop=startTop+(move.clientY-startY)*max/travel};const stop=()=>{thumb.onpointermove=null;thumb.onpointerup=null;thumb.onpointercancel=null};thumb.onpointerup=stop;thumb.onpointercancel=stop};
 thumb.onkeydown=event=>{const distance=event.key==='ArrowDown'?80:event.key==='ArrowUp'?-80:event.key==='PageDown'?list.clientHeight*.8:event.key==='PageUp'?-list.clientHeight*.8:0;if(distance){event.preventDefault();list.scrollBy({top:distance,behavior:'smooth'})}};
 requestAnimationFrame(sync);
}
