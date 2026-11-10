let analysisDetailTaskId=0,analysisDetailActive=0,analysisDetailSource='',analysisDetailScrollTop=0;
let analysisDetailRunning=false,analysisDetailNotice='',analysisDetailDoneAdded=0,analysisDetailPendingUsed=0;
const analysisDetailStatuses=new Map(),analysisDetailEdits=new Map(),analysisDetailResults=new Set();
let analysisDetailDraft=null,analysisDetailLoading=false,analysisDetailEmptyPreviewId=-1,analysisDetailHiddenPreviewId=-1,analysisDetailViewer=null;
const analysisDetailClouds=new Map(),analysisDetailViews=new Map();
let oneClickLoading=false,oneClickRows=null,oneClickSummary=null;

function detailConfig(){return cfg.analysis_detail||{}}
function detailQuickNav(){
 const buttons=obj((cfg.home||{}).buttons||'',';').slice(0,5);
 return `<nav class="detail-quick-nav" aria-label="功能切换">${buttons.map(([label,id])=>`<button type="button" data-detail-nav="${esc(id)}" class="${id==='geometry'?'active':''}" ${id==='geometry'?'aria-current="page"':''}>${esc(label)}</button>`).join('')}</nav>`;
}

function detailCards(){
 const d=detailConfig(),source=String(d.cards||'');
 if(source!==analysisDetailSource){analysisDetailSource=source;analysisDetailActive=0;analysisDetailScrollTop=0;analysisDetailRunning=false;analysisDetailNotice='';analysisDetailDoneAdded=0;analysisDetailPendingUsed=0;analysisDetailStatuses.clear();analysisDetailEdits.clear();analysisDetailResults.clear();analysisDetailDraft=null;analysisDetailLoading=false;analysisDetailEmptyPreviewId=-1;analysisDetailHiddenPreviewId=-1;analysisDetailClouds.clear();analysisDetailViews.clear();analysisDetailViewer?.destroy();analysisDetailViewer=null}
 return obj(source,';').map(([location,mileage,status],id)=>({id,location:analysisDetailEdits.get(id)?.location??location??'',mileage:analysisDetailEdits.get(id)?.mileage??mileage??'',status:analysisDetailStatuses.get(id)||status||d.pending_status||''}));
}

function detailCardMarkup(card,d){return `<article class="detail-card ${card.id===analysisDetailActive?'selected':''}" data-detail-card="${card.id}"><div class="detail-card-accent"></div><div class="detail-card-inner"><div>${esc(d.status_label)}：</div><strong class="detail-badge ${card.status===d.done_status?'done':card.status===d.working_status?'working':'pending'}">${esc(card.status)}</strong><div>${esc(d.engineering_label)}：</div><span class="detail-card-link">${esc(d.engineering_value)}</span><div>${esc(d.mileage_label)}：<span>${esc(card.mileage||d.mileage_default)}</span></div><div class="detail-card-location">${esc(d.location_label)}：<span>${esc(card.location)}</span></div><button type="button" class="detail-edit" data-detail-edit="${card.id}">${esc(d.edit_button)}</button></div></article>`}

function ensureDetailFileInput(d){
 let input=document.querySelector('#detail-local-file');
 if(!input){input=document.createElement('input');input.type='file';input.id='detail-local-file';input.hidden=true;document.body.appendChild(input)}
 input.accept=d.file_accept||'';
 return input;
}

function renderAnalysisDetail(){
 const d=detailConfig(),cards=detailCards();if(analysisDetailActive>=cards.length)analysisDetailActive=0;
 const selected=cards[analysisDetailActive],headers=split(d.measurement_columns||'','|'),values=split(d.measurement_values||'','|');
 const draft=analysisDetailDraft?.id===analysisDetailActive?analysisDetailDraft:null,entry=draft?.cloud?draft:analysisDetailClouds.get(analysisDetailActive),cloud=entry?.cloud;
 const previewOpen=analysisDetailHiddenPreviewId!==analysisDetailActive&&(Boolean(draft)||Boolean(cloud)||analysisDetailEmptyPreviewId===analysisDetailActive);
 const showValues=analysisDetailResults.has(analysisDetailActive);
 const preview=previewOpen?`<div class="pointcloud-panel"><div class="pointcloud-titlebar"><span>${esc(d.preview_title)}</span><button type="button" data-preview-close aria-label="${esc(d.cancel_button)}">×</button></div><div class="pointcloud-workspace">${cloud?'<canvas class="pointcloud-canvas" data-pointcloud-canvas></canvas>':`<span class="pointcloud-empty">${esc(analysisDetailLoading?d.loading_text:d.empty_preview_text)}</span>`}<div class="pointcloud-tools"><button type="button" data-color-constant ${cloud?'':'disabled'}>${esc(d.constant_button)}</button><button type="button" data-color-strength ${cloud?'':'disabled'}>${esc(d.strength_button)}</button><button type="button" data-geometry ${cloud?'':'disabled'}>${esc(d.geometry_button)}</button><button type="button" data-preview-clear>${esc(d.clear_button)}</button></div>${cloud?`<div class="pointcloud-help">${esc(d.mouse_help)}</div>`:''}</div><div class="pointcloud-footer"><span>${esc(d.file_label)}${esc(entry?.fileName||draft?.fileName||'')}</span><button type="button" data-preview-cancel>${esc(d.cancel_button)}</button><button type="button" data-preview-confirm ${draft?.cloud?'':'disabled'}>${esc(d.confirm_button)}</button></div></div>`:analysisDetailHiddenPreviewId===analysisDetailActive?`<span>${esc(d.preview_closed_text)}</span>`:`<span>${esc(analysisDetailResults.has(analysisDetailActive)?d.preset_result_text:d.awaiting_text)}</span>`;
 document.title=(d.heading||'')+' · '+(cfg.app?.name||'');
 analysisDetailViewer?.destroy();analysisDetailViewer=null;
 $('#app').innerHTML=`<div class="detail-page"><header class="detail-header"><div class="detail-header-title"><span class="detail-header-icon" aria-hidden="true">▤</span>${esc(d.heading)}</div><button type="button" data-detail-home aria-label="${esc(d.close_label)}">×</button></header><div class="detail-body"><aside class="detail-sidebar"><div class="detail-sidebar-shell"><div class="detail-card-list" data-detail-list>${cards.map(card=>detailCardMarkup(card,d)).join('')}</div><div class="detail-scrollbar"><button type="button" data-detail-up aria-label="${esc(d.scroll_up_label)}">▲</button><div class="detail-scroll-rail" data-detail-rail><div class="detail-scroll-thumb" data-detail-thumb role="scrollbar" aria-label="${esc(d.scroll_label)}" tabindex="0"></div></div><button type="button" data-detail-down aria-label="${esc(d.scroll_down_label)}">▼</button></div></div></aside><main class="detail-main"><div class="detail-context"><div><b>${esc(d.route_label)}：</b>${esc(d.route_value)}</div><div><b>${esc(d.segment_label)}：</b>${esc(d.segment_value)}</div><div><b>${esc(d.site_label)}：</b>${esc(d.site_value)}</div><div><b>${esc(d.chute_label)}：</b>${esc(d.chute_value)}</div><button type="button" data-detail-export>${esc(d.export_button)}</button></div><div class="detail-toolbar"><b>${esc(d.detail_label)}</b>${detailQuickNav()}<div class="detail-toolbar-right"><button type="button" data-detail-single ${analysisDetailRunning||analysisDetailLoading?'disabled':''}>${esc(d.single_button)}</button><button type="button" data-detail-all ${analysisDetailRunning||analysisDetailLoading?'disabled':''}>${esc(d.all_button)}</button></div></div><section class="detail-measurements"><table class="detail-measurement-table"><tbody>${headers.map((title,i)=>`<tr><th scope="row">${esc(title)}</th><td>${showValues?esc(values[i]??d.empty_value):''}</td></tr>`).join('')}</tbody></table><div class="detail-measurement-body">${preview}</div></section><div class="detail-bottom"><span class="detail-notice" role="status">${esc(analysisDetailNotice)}</span><button type="button" data-detail-next>${esc(d.next_button)}</button><button type="button" data-detail-back aria-label="${esc(d.back_button)}">↩</button></div></main></div><div id="detail-modal"></div></div>`;
 document.querySelectorAll('[data-detail-nav]').forEach(button=>button.onclick=()=>{const id=button.dataset.detailNav;section=({geometry:'analysis',defect:'image_analysis',flatness:'flatness'})[id]||id;demoState='ready';render()});
 document.querySelector('[data-detail-home]').onclick=()=>{section='home';render()};
 document.querySelectorAll('[data-detail-back]').forEach(button=>button.onclick=()=>{section='analysis';render()});
 document.querySelector('[data-detail-next]').onclick=()=>{section='inspection';sub='geometry';demoState='done';render()};
 document.querySelectorAll('[data-detail-card]').forEach(card=>card.onclick=event=>{if(event.target.closest('[data-detail-edit]'))return;analysisDetailActive=Number(card.dataset.detailCard);analysisDetailHiddenPreviewId=-1;renderAnalysisDetail()});
 document.querySelectorAll('[data-detail-edit]').forEach(button=>button.onclick=event=>{event.stopPropagation();detailEdit(Number(button.dataset.detailEdit))});
 const fileInput=ensureDetailFileInput(d);
 document.querySelector('[data-detail-single]').onclick=()=>{fileInput.value='';fileInput.click()};
 fileInput.onchange=event=>{const file=event.target.files?.[0];if(file)detailLoadLocalFile(file)};
 document.querySelector('[data-detail-all]').onclick=startOneClickSelection;
 document.querySelector('[data-detail-export]').onclick=async()=>{if(await detailExport()){section='measurement_export';render()}};
 document.querySelector('[data-preview-close]')?.addEventListener('click',detailCancelPreview);
 document.querySelector('[data-preview-cancel]')?.addEventListener('click',detailCancelPreview);
 document.querySelector('[data-preview-clear]')?.addEventListener('click',detailClearPreview);
 document.querySelector('[data-preview-confirm]')?.addEventListener('click',detailConfirmPreview);

 const setColorMode=mode=>{const state=analysisDetailViews.get(analysisDetailActive);if(!state)return;state.colorMode=mode;analysisDetailViewer?.redraw();document.querySelector('[data-color-constant]')?.classList.toggle('active',mode==='constant');document.querySelector('[data-color-strength]')?.classList.toggle('active',mode==='strength')};
 document.querySelector('[data-color-constant]')?.addEventListener('click',()=>setColorMode('constant'));
 document.querySelector('[data-color-strength]')?.addEventListener('click',()=>setColorMode('strength'));
 document.querySelector('[data-geometry]')?.addEventListener('click',()=>{const state=analysisDetailViews.get(analysisDetailActive);if(state){state.geometry=!state.geometry;analysisDetailViewer?.redraw();document.querySelector('[data-geometry]')?.classList.toggle('active',state.geometry)}});
 const canvas=document.querySelector('[data-pointcloud-canvas]');if(canvas&&cloud){let state=analysisDetailViews.get(analysisDetailActive);if(!state){state={yaw:1.3,pitch:.15,zoom:1,panX:0,panY:0,geometry:false,colorMode:'plain'};analysisDetailViews.set(analysisDetailActive,state)}analysisDetailViewer=mountPointCloud(canvas,cloud,state,values);document.querySelector('[data-geometry]')?.classList.toggle('active',state.geometry);document.querySelector('[data-color-constant]')?.classList.toggle('active',state.colorMode==='constant');document.querySelector('[data-color-strength]')?.classList.toggle('active',state.colorMode==='strength');}
 detailBindScroll();
 if(d.preview_cache_path&&typeof fetch==='function')loadBundledPointCloudPreview(d.preview_cache_path,ver).catch(()=>{});
}

async function detailLoadLocalFile(file){
 if(analysisDetailLoading||analysisDetailRunning)return;
 const d=detailConfig(),id=analysisDetailActive,draft={id,fileName:file.name,cloud:null};
 analysisDetailDraft=draft;analysisDetailLoading=true;analysisDetailEmptyPreviewId=-1;analysisDetailHiddenPreviewId=-1;analysisDetailNotice=d.loading_notice||'';analysisDetailViews.set(id,{yaw:1.3,pitch:.15,zoom:1,panX:0,panY:0,geometry:false,colorMode:'plain'});renderAnalysisDetail();
 let timeoutId;
 try{
  if(file.size>(Number(d.max_file_mb)||500)*1024*1024)throw Error('size');
  const progress=fraction=>{if(analysisDetailDraft!==draft)return;const message=(d.loading_text||'')+' '+Math.round(fraction*100)+'%';if(typeof document!=='undefined'){const display=document.querySelector('.pointcloud-empty');if(display)display.textContent=message;const notice=document.querySelector('.detail-notice');if(notice)notice.textContent=message}};
  const sameBundledFile=d.preview_cache_path&&file.name===d.preview_cache_filename&&Number(file.size)===Number(d.preview_cache_size);
  const readCloud=async()=>{if(sameBundledFile){try{return await loadBundledPointCloudPreview(d.preview_cache_path,ver)}catch(error){console.warn('Local preview cache unavailable; reading selected file',error)}}return parsePointCloudFile(file,Number(d.max_preview_points)||40000,progress)};
  const cloud=await Promise.race([readCloud(),new Promise((_,reject)=>{timeoutId=setTimeout(()=>reject(Error('timeout')),Math.max(2000,Number(d.load_timeout_ms)||30000))})]);
  if(analysisDetailDraft!==draft)return;
  draft.cloud=cloud;analysisDetailLoading=false;analysisDetailNotice=(d.loaded_prefix||'')+cloud.total.toLocaleString('zh-CN')+(d.loaded_suffix||'');renderAnalysisDetail();
 }catch(error){if(analysisDetailDraft!==draft)return;analysisDetailDraft=null;analysisDetailLoading=false;analysisDetailNotice=error.message==='size'?d.too_large_text:error.message==='format'?d.unsupported_text:error.message==='timeout'?d.timeout_text:d.load_error_text;renderAnalysisDetail()}finally{clearTimeout(timeoutId)}
}

function detailConfirmPreview(){
 const draft=analysisDetailDraft;if(!draft?.cloud)return;
 const d=detailConfig(),card=detailCards()[draft.id],wasDone=card?.status===d.done_status;
 analysisDetailClouds.set(draft.id,{fileName:draft.fileName,cloud:draft.cloud});analysisDetailResults.add(draft.id);analysisDetailStatuses.set(draft.id,d.done_status||'');
 if(!wasDone&&analysisDetailPendingUsed<(Number(d.pending_count)||0)){analysisDetailDoneAdded++;analysisDetailPendingUsed++}
 analysisStatuses.set(analysisDetailTaskId,(cfg.analysis||{}).done_status||'');analysisDetailDraft=null;analysisDetailNotice=d.done_notice||'';renderAnalysisDetail();
}

function detailCancelPreview(){
 if(analysisDetailDraft){analysisDetailDraft=null;analysisDetailLoading=false;analysisDetailNotice=detailConfig().cancel_notice||''}
 else{analysisDetailHiddenPreviewId=analysisDetailActive;analysisDetailNotice=detailConfig().preview_closed_text||''}
 analysisDetailEmptyPreviewId=-1;renderAnalysisDetail();
}

function detailClearPreview(){
 const d=detailConfig(),id=analysisDetailActive,base=obj(d.cards||'',';')[id]?.[2]||d.pending_status;
 if(analysisDetailStatuses.get(id)===d.done_status&&base!==d.done_status){analysisDetailDoneAdded=Math.max(0,analysisDetailDoneAdded-1);analysisDetailPendingUsed=Math.max(0,analysisDetailPendingUsed-1)}
 analysisDetailStatuses.delete(id);analysisDetailResults.delete(id);analysisDetailClouds.delete(id);analysisDetailDraft=null;analysisDetailLoading=false;analysisDetailEmptyPreviewId=id;analysisDetailHiddenPreviewId=-1;analysisDetailNotice=d.cleared_notice||'';renderAnalysisDetail();
}

function detailRun(mode){
 if(analysisDetailRunning||analysisDetailLoading)return;
 const d=detailConfig(),cards=detailCards(),source=analysisDetailSource;
 analysisDetailDraft=null;analysisDetailRunning=true;analysisDetailNotice=d.all_running_notice||'';
 cards.forEach(card=>{if(card.status!==d.done_status)analysisDetailStatuses.set(card.id,d.working_status||'')});render();
 setTimeout(()=>{
  if(source!==analysisDetailSource)return;
  const remaining=Math.max(0,(Number(d.pending_count)||0)-analysisDetailPendingUsed),newlyDone=Math.min(remaining,cards.filter(card=>card.status!==d.done_status).length);analysisDetailDoneAdded+=newlyDone;analysisDetailPendingUsed+=newlyDone;
  cards.forEach(card=>{analysisDetailStatuses.set(card.id,(cfg.analysis_detail||{}).done_status||'');analysisDetailResults.add(card.id)});
  analysisDetailRunning=false;analysisDetailNotice=(cfg.analysis_detail||{}).done_notice||'';analysisStatuses.set(analysisDetailTaskId,(cfg.analysis||{}).done_status||'');
  if(['analysis_detail','measurement_export','one_click_analysis'].includes(section))render();
 },Math.max(300,Number(d.analysis_delay_ms)||1800));
}

function detailEdit(id){
 const d=detailConfig(),card=detailCards()[id],root=document.querySelector('#detail-modal');if(!card)return;
 root.innerHTML=`<div class="capture-modal-backdrop"><form class="capture-modal"><h2>${esc(d.edit_heading)}</h2><label>${esc(d.location_label)}<input name="location" value="${esc(card.location)}" required></label><label>${esc(d.mileage_label)}<input name="mileage" value="${esc(card.mileage)}"></label><div><button type="button" data-detail-cancel>${esc(d.cancel_button)}</button><button type="submit">${esc(d.save_button)}</button></div></form></div>`;
 root.querySelector('[data-detail-cancel]').onclick=()=>root.innerHTML='';
 root.querySelector('form').onsubmit=event=>{event.preventDefault();const form=event.target;analysisDetailEdits.set(id,{location:form.elements.location.value.trim(),mileage:form.elements.mileage.value.trim()});render()};
}

async function detailExport(){
 const d=detailConfig(),entry=analysisDetailClouds.get(analysisDetailActive);
 if(!entry?.fileName||!analysisDetailResults.has(analysisDetailActive)){
  analysisDetailNotice=d.export_no_cloud_notice||'';
  const notice=document.querySelector('.detail-notice');if(notice)notice.textContent=analysisDetailNotice;
  return false;
 }
 analysisDetailNotice=d.export_saving_notice||'';
 const notice=document.querySelector('.detail-notice');if(notice)notice.textContent=analysisDetailNotice;
 try{
  const card=detailCards()[analysisDetailActive];
  const response=await fetch('/api/export-measurements',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file_name:entry.fileName,card_id:analysisDetailActive,location:card?.location||''})});
  const result=await response.json();
  if(!response.ok||!result.ok)throw Error(result.error||String(response.status));
  analysisDetailNotice=(d.export_saved_prefix||'')+result.relative_path;
  const latest=document.querySelector('.detail-notice');if(latest)latest.textContent=analysisDetailNotice;
  return true;
 }catch(error){
  analysisDetailNotice=(d.export_failed_prefix||'')+error.message;
  const latest=document.querySelector('.detail-notice');if(latest)latest.textContent=analysisDetailNotice;
  return false;
 }
}

function renderMeasurementExport(){
 const d=detailConfig(),e=cfg.measurement_export||{},cards=detailCards();
 if(analysisDetailActive>=cards.length)analysisDetailActive=0;
 const headers=split(d.measurement_columns||'','|'),values=split(d.measurement_values||'','|'),ready=analysisDetailResults.has(analysisDetailActive);
 const rowLabels=split(e.row_labels||'','|');
 const doneCount=Math.max(0,(Number(d.analyzed_count)||0)+analysisDetailDoneAdded),pendingCount=Math.max(0,(Number(d.pending_count)||0)-analysisDetailPendingUsed);
 document.title=(e.heading||d.heading||'')+' · '+(cfg.app?.name||'');
 analysisDetailViewer?.destroy();analysisDetailViewer=null;
 $('#app').innerHTML=`<div class="detail-page export-page"><header class="detail-header"><div class="detail-header-title"><span class="detail-header-icon" aria-hidden="true">▤</span>${esc(e.heading||d.heading)}</div><button type="button" data-export-home aria-label="${esc(d.close_label)}">×</button></header><div class="detail-body"><aside class="detail-sidebar"><div class="detail-sidebar-shell"><div class="detail-card-list" data-detail-list>${cards.map(card=>detailCardMarkup(card,d)).join('')}</div><div class="detail-scrollbar"><button type="button" data-detail-up aria-label="${esc(d.scroll_up_label)}">▲</button><div class="detail-scroll-rail" data-detail-rail><div class="detail-scroll-thumb" data-detail-thumb role="scrollbar" aria-label="${esc(d.scroll_label)}" tabindex="0"></div></div><button type="button" data-detail-down aria-label="${esc(d.scroll_down_label)}">▼</button></div></div></aside><main class="detail-main export-main"><div class="detail-context"><div><b>${esc(d.route_label)}：</b>${esc(d.route_value)}</div><div><b>${esc(d.segment_label)}：</b>${esc(d.segment_value)}</div><div><b>${esc(d.site_label)}：</b>${esc(d.site_value)}</div><div><b>${esc(d.chute_label)}：</b>${esc(d.chute_value)}</div><button type="button" data-export-download>${esc(d.export_button)}</button></div><div class="detail-toolbar"><b>${esc(d.detail_label)}</b><div class="detail-toolbar-right"><span>${esc(d.analyzed_label)}：<em>${doneCount}${esc(d.count_unit)}</em></span><span>${esc(d.pending_label)}：<em>${pendingCount}${esc(d.count_unit)}</em></span><span>${esc(d.no_data_label)}：<em>${esc(d.no_data_count)}${esc(d.count_unit)}</em></span><button type="button" data-export-single>${esc(d.single_button)}</button><button type="button" data-export-all ${analysisDetailRunning?'disabled':''}>${esc(d.all_button)}</button></div></div><section class="export-results"><div class="export-table-wrap"><table class="export-table"><thead><tr><th scope="col">${esc(e.group_heading)}</th>${headers.map(title=>`<th scope="col">${esc(title)}</th>`).join('')}</tr></thead><tbody>${rowLabels.map((label,row)=>`<tr><th scope="row">${esc(label)}</th>${headers.map((_,i)=>`<td>${ready?esc(values[i]??d.empty_value):''}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="export-blank">${esc(e.awaiting_text||d.awaiting_text)}</div></section><div class="detail-bottom"><span class="detail-notice" role="status">${esc(analysisDetailNotice)}</span><button type="button" data-export-next>${esc(d.next_button)}</button><button type="button" data-export-back aria-label="${esc(d.back_button)}">↩</button></div></main></div><div id="detail-modal"></div></div>`;
 document.querySelector('[data-export-home]').onclick=()=>{section='home';render()};
 document.querySelectorAll('[data-export-back]').forEach(button=>button.onclick=()=>{section='analysis_detail';render()});
 document.querySelector('[data-export-download]').onclick=detailExport;
 document.querySelector('[data-export-single]').onclick=()=>{section='analysis_detail';render();document.querySelector('[data-detail-single]')?.click()};
 document.querySelector('[data-export-all]').onclick=startOneClickSelection;
 document.querySelector('[data-export-next]').onclick=()=>{section='inspection';sub='geometry';demoState='done';render()};
 document.querySelectorAll('[data-detail-card]').forEach(card=>card.onclick=event=>{if(event.target.closest('[data-detail-edit]'))return;analysisDetailActive=Number(card.dataset.detailCard);renderMeasurementExport()});
 document.querySelectorAll('[data-detail-edit]').forEach(button=>button.onclick=event=>{event.stopPropagation();detailEdit(Number(button.dataset.detailEdit))});
 detailBindScroll();
}

function ensureOneClickFolderInput(){
 let input=document.querySelector('#one-click-folder-input');
 if(!input){input=document.createElement('input');input.type='file';input.id='one-click-folder-input';input.hidden=true;input.multiple=true;input.setAttribute('webkitdirectory','');input.setAttribute('directory','');document.body.appendChild(input)}
 return input;
}

async function startOneClickSelection(){
 if(oneClickLoading)return;
 const expected=(cfg.one_click_analysis||{}).folder_name||'导出数据';
 const fail=message=>{analysisDetailNotice=message;const notice=document.querySelector('.detail-notice');if(notice)notice.textContent=message};
 if(typeof window!=='undefined'&&typeof window.showDirectoryPicker==='function'){
  try{
   const handle=await window.showDirectoryPicker({mode:'read'});
   if(handle.name!==expected){fail((cfg.one_click_analysis||{}).folder_error||'请选择 data 下的导出数据文件夹');return}
   const names=[];
   for await(const entry of handle.values())if(entry.kind==='file'&&/\.(ply|xyz|pts|txt|csv)$/i.test(entry.name))names.push(entry.name);
   if(!names.length){fail('所选文件夹中没有点云文件');return}
   runOneClickAnalysis(expected,names);return;
  }catch(error){
   if(error?.name==='AbortError')return;
   if(error?.name!=='SecurityError'&&error?.name!=='NotSupportedError'){fail('文件夹选择失败：'+error.message);return}
  }
 }
 const input=ensureOneClickFolderInput();input.value='';
 input.onchange=event=>{
  const files=Array.from(event.target.files||[]),folder=(files[0]?.webkitRelativePath||'').replaceAll('\\','/').split('/')[0];
  const pointFiles=files.filter(file=>/\.(ply|xyz|pts|txt|csv)$/i.test(file.name));
  if(!files.length)return;
  if(folder&&folder!==expected){fail((cfg.one_click_analysis||{}).folder_error||'请选择 data 下的导出数据文件夹');return}
  if(!pointFiles.length){fail('所选文件夹中没有点云文件');return}
  runOneClickAnalysis(expected,pointFiles.map(file=>file.name));
 };
 input.click();
}

function updateOneClickCard(id,status){
 const d=detailConfig(),badge=document.querySelector(`[data-detail-card="${id}"] .detail-badge`);
 analysisDetailStatuses.set(id,status);
 if(badge){badge.classList.add('changing');setTimeout(()=>{badge.textContent=status;badge.classList.toggle('done',status===d.done_status);badge.classList.toggle('working',status===d.working_status);badge.classList.toggle('pending',status===d.pending_status);badge.classList.remove('changing')},110)}
 const done=document.querySelector('[data-one-click-done]'),pending=document.querySelector('[data-one-click-pending]');
 if(done)done.textContent=Math.max(0,(Number(d.analyzed_count)||0)+analysisDetailDoneAdded)+String(d.count_unit||'');
 if(pending)pending.textContent=Math.max(0,(Number(d.pending_count)||0)-analysisDetailPendingUsed)+String(d.count_unit||'');
}

async function runOneClickAnalysis(folderName,names){
 const e=cfg.one_click_analysis||{},d=detailConfig(),delay=500;
 const cards=detailCards().slice(0,3),source=analysisDetailSource;
 oneClickRows=null;oneClickSummary=null;oneClickLoading=true;analysisDetailNotice=e.loading_notice||'正在分析导出数据…';
 analysisDetailDoneAdded=0;analysisDetailPendingUsed=0;
 cards.forEach(card=>analysisDetailStatuses.set(card.id,d.pending_status||'未分析'));
 section='one_click_analysis';render();
 const responsePromise=fetch('/api/one-click-analysis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({folder_name:folderName,files:names})}).then(async response=>{const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||String(response.status));return result}).catch(error=>({error}));
 try{
  for(const card of cards){
   updateOneClickCard(card.id,d.working_status||'分析中');
   await new Promise(resolve=>setTimeout(resolve,delay));
   analysisDetailResults.add(card.id);
   analysisDetailDoneAdded++;analysisDetailPendingUsed++;
   updateOneClickCard(card.id,d.done_status||'分析完成');
   await new Promise(resolve=>setTimeout(resolve,delay));
  }
  const result=await responsePromise;if(result.error)throw result.error;
  if(source!==analysisDetailSource)return;
  oneClickRows=result.rows;oneClickSummary=result.summary;
  analysisDetailNotice=(e.done_notice||'分析完成：')+result.measured_count+'/'+result.file_count;
 }catch(error){analysisDetailNotice=(e.error_prefix||'分析失败：')+error.message}
 finally{oneClickLoading=false;if(section==='one_click_analysis')render()}
}

function renderOneClickAnalysis(){
 const d=detailConfig(),e=cfg.one_click_analysis||{},cards=detailCards();
 if(analysisDetailActive>=cards.length)analysisDetailActive=0;
 const headers=[...split(d.measurement_columns||'','|'),e.twist_label||''];
 const doneCount=Math.max(0,(Number(d.analyzed_count)||0)+analysisDetailDoneAdded),pendingCount=Math.max(0,(Number(d.pending_count)||0)-analysisDetailPendingUsed);
 const shown=Array.isArray(oneClickRows)&&!oneClickLoading;
 const table=shown?`<div class="export-table-wrap"><table class="export-table"><thead><tr><th scope="col">${esc(e.group_heading||'')}</th>${headers.map(title=>`<th scope="col">${esc(title)}</th>`).join('')}</tr></thead><tbody>${oneClickRows.map(entry=>`<tr><th scope="row" title="${esc(entry.file_name)}">${esc(entry.label)}</th>${headers.slice(0,6).map((_,i)=>`<td>${esc(entry.values?.[i]||'')}</td>`).join('')}<td>${esc(entry.twist)}</td></tr>`).join('')}<tr><th scope="row">${esc(e.summary_label||'总结')}</th>${headers.slice(0,6).map((_,i)=>`<td>${esc(oneClickSummary?.[i]||'')}</td>`).join('')}<td>----</td></tr></tbody></table></div>`:'';
 const allButton=oneClickLoading?`<span class="one-click-spinner" aria-hidden="true"></span>${esc(e.loading_button||'分析中')}`:esc(d.all_button);
 document.title=(e.heading||d.heading||'')+' · '+(cfg.app?.name||'');
 analysisDetailViewer?.destroy();analysisDetailViewer=null;
 $('#app').innerHTML=`<div class="detail-page export-page one-click-page"><header class="detail-header"><div class="detail-header-title"><span class="detail-header-icon" aria-hidden="true">▤</span>${esc(e.heading||d.heading)}</div><button type="button" data-export-home aria-label="${esc(d.close_label)}">×</button></header><div class="detail-body"><aside class="detail-sidebar"><div class="detail-sidebar-shell"><div class="detail-card-list" data-detail-list>${cards.map(card=>detailCardMarkup(card,d)).join('')}</div><div class="detail-scrollbar"><button type="button" data-detail-up aria-label="${esc(d.scroll_up_label)}">▲</button><div class="detail-scroll-rail" data-detail-rail><div class="detail-scroll-thumb" data-detail-thumb role="scrollbar" aria-label="${esc(d.scroll_label)}" tabindex="0"></div></div><button type="button" data-detail-down aria-label="${esc(d.scroll_down_label)}">▼</button></div></div></aside><main class="detail-main export-main"><div class="detail-context"><div><b>${esc(d.route_label)}：</b>${esc(d.route_value)}</div><div><b>${esc(d.segment_label)}：</b>${esc(d.segment_value)}</div><div><b>${esc(d.site_label)}：</b>${esc(d.site_value)}</div><div><b>${esc(d.chute_label)}：</b>${esc(d.chute_value)}</div><button type="button" data-export-download>${esc(d.export_button)}</button></div><div class="detail-toolbar"><b>${esc(d.detail_label)}</b><div class="detail-toolbar-right"><span>${esc(d.analyzed_label)}：<em data-one-click-done>${doneCount}${esc(d.count_unit)}</em></span><span>${esc(d.pending_label)}：<em data-one-click-pending>${pendingCount}${esc(d.count_unit)}</em></span><span>${esc(d.no_data_label)}：<em>${esc(d.no_data_count)}${esc(d.count_unit)}</em></span><button type="button" data-export-single>${esc(d.single_button)}</button><button type="button" data-export-all class="${oneClickLoading?'one-click-loading':''}" ${oneClickLoading?'disabled':''}>${allButton}</button></div></div><section class="export-results">${table}${shown?'':`<div class="export-blank">${esc(oneClickLoading?(e.loading_notice||'正在分析导出数据…'):shown?(e.awaiting_text||''):(e.select_notice||'请选择导出数据文件夹'))}</div>`}</section><div class="detail-bottom"><span class="detail-notice" role="status">${esc(analysisDetailNotice)}</span><button type="button" data-export-next>${esc(d.next_button)}</button><button type="button" data-export-back aria-label="${esc(d.back_button)}">↩</button></div></main></div><div id="detail-modal"></div></div>`;
 document.querySelector('[data-export-home]').onclick=()=>{section='home';render()};
 document.querySelectorAll('[data-export-back]').forEach(button=>button.onclick=()=>{section='measurement_export';render()});
 document.querySelector('[data-export-download]').onclick=detailExport;
 document.querySelector('[data-export-single]').onclick=()=>{section='analysis_detail';render();document.querySelector('[data-detail-single]')?.click()};
 document.querySelector('[data-export-all]').onclick=startOneClickSelection;
 document.querySelector('[data-export-next]').onclick=()=>{section='inspection';sub='geometry';demoState='done';render()};
 document.querySelectorAll('[data-detail-card]').forEach(card=>card.onclick=event=>{if(event.target.closest('[data-detail-edit]'))return;analysisDetailActive=Number(card.dataset.detailCard);renderOneClickAnalysis()});
 document.querySelectorAll('[data-detail-edit]').forEach(button=>button.onclick=event=>{event.stopPropagation();detailEdit(Number(button.dataset.detailEdit))});
 detailBindScroll();
}

function detailBindScroll(){
 const list=document.querySelector('[data-detail-list]'),rail=document.querySelector('[data-detail-rail]'),thumb=document.querySelector('[data-detail-thumb]');if(!list||!rail||!thumb)return;
 list.scrollTop=analysisDetailScrollTop;
 const sync=()=>{const max=Math.max(0,list.scrollHeight-list.clientHeight),height=rail.clientHeight,thumbHeight=max?Math.max(30,Math.min(height,height*list.clientHeight/list.scrollHeight)):height,travel=Math.max(0,height-thumbHeight);thumb.style.height=thumbHeight+'px';thumb.style.transform=`translateY(${max?list.scrollTop/max*travel:0}px)`;thumb.setAttribute('aria-valuemin','0');thumb.setAttribute('aria-valuemax',String(Math.round(max)));thumb.setAttribute('aria-valuenow',String(Math.round(list.scrollTop)))};
 list.onscroll=()=>{analysisDetailScrollTop=list.scrollTop;sync()};
 document.querySelector('[data-detail-up]').onclick=()=>list.scrollBy({top:-170,behavior:'smooth'});
 document.querySelector('[data-detail-down]')?.addEventListener('click',()=>list.scrollBy({top:170,behavior:'smooth'}));
 rail.onclick=event=>{if(event.target===thumb)return;const box=rail.getBoundingClientRect(),max=list.scrollHeight-list.clientHeight,travel=Math.max(1,rail.clientHeight-thumb.offsetHeight);list.scrollTop=Math.max(0,Math.min(max,(event.clientY-box.top-thumb.offsetHeight/2)/travel*max))};
 thumb.onpointerdown=event=>{event.preventDefault();event.stopPropagation();thumb.setPointerCapture(event.pointerId);const startY=event.clientY,startTop=list.scrollTop;thumb.onpointermove=move=>{const max=list.scrollHeight-list.clientHeight,travel=Math.max(1,rail.clientHeight-thumb.offsetHeight);list.scrollTop=startTop+(move.clientY-startY)*max/travel};const stop=()=>{thumb.onpointermove=null;thumb.onpointerup=null;thumb.onpointercancel=null};thumb.onpointerup=stop;thumb.onpointercancel=stop};
 thumb.onkeydown=event=>{const distance=event.key==='ArrowDown'?80:event.key==='ArrowUp'?-80:event.key==='PageDown'?list.clientHeight*.8:event.key==='PageUp'?-list.clientHeight*.8:0;if(distance){event.preventDefault();list.scrollBy({top:distance,behavior:'smooth'})}};
 requestAnimationFrame(sync);
}
