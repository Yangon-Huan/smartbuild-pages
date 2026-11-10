let bimCardActive=0;
const bimCardEdits=new Map();
let bimBuildGeneration=0;
let bimModelStarted=false,bimModelLoading=false,bimModelItems=[],bimSelectedId=null,bimViewer=null,bimModelError='',bimRenderGeneration=0;
const bimExpandedGroups=new Set();

function bimEntityTree(items){
 const groups=new Map();
 for(const item of items){const parent=item.properties.find(row=>row[0]==='上级构件')?.[1]||item.type;if(!groups.has(parent))groups.set(parent,[]);groups.get(parent).push(item)}
 return [...groups].map(([group,children])=>`<details class="bim-tree-group" data-bim-group="${esc(group)}" ${bimExpandedGroups.has(group)?'open':''}><summary>${esc(group)} <small>${children.length}</small></summary>${children.map(item=>`<button type="button" class="bim-tree-item ${item.id===bimSelectedId?'selected':''}" data-bim-entity="${item.id}" title="${esc(item.type)}">${esc(item.name)}</button>`).join('')}</details>`).join('');
}
function bimSelectEntity(id){
 bimSelectedId=id;
 const item=bimModelItems.find(row=>row.id===id);
 document.querySelectorAll('[data-bim-entity]').forEach(button=>button.classList.toggle('selected',Number(button.dataset.bimEntity)===id));
 const selectedButton=document.querySelector(`[data-bim-entity="${id}"]`);
 if(selectedButton){
  const group=selectedButton.closest('[data-bim-group]');
  if(group){bimExpandedGroups.add(group.dataset.bimGroup);group.open=true}
  requestAnimationFrame(()=>{if(!selectedButton.isConnected)return;const tree=selectedButton.closest('.bim-tree');if(!tree)return;const buttonBox=selectedButton.getBoundingClientRect(),treeBox=tree.getBoundingClientRect();tree.scrollTo({top:tree.scrollTop+buttonBox.top-treeBox.top-tree.clientHeight/2+buttonBox.height/2,behavior:'smooth'})});
 }
 const pane=document.querySelector('[data-bim-properties]');
 if(pane)pane.innerHTML=item?`<h3>${esc(item.name)}</h3><div class="bim-property-rows">${item.properties.map(([key,value])=>`<div><b>${esc(key)}</b><span>${esc(value)}</span></div>`).join('')}</div>`:`<div class="bim-empty-parameter">${esc(cfg.bim_page?.select_hint||'请选择模型构件查看参数')}</div>`;
 if(bimViewer)bimViewer.select(id);
}
async function bimStartModel(){
 if(bimModelLoading)return;
 bimExpandedGroups.clear();bimSelectedId=null;bimModelItems=[];
 bimModelStarted=true;bimModelLoading=true;bimModelError='';const generation=++bimBuildGeneration;renderBimPage();
 try{
  const bim=cfg.bim||{},path=bim.model||'data/隧道BIM.ifc';
  const [ifcResponse,metaResponse]=await Promise.all([fetch(path),fetch(cfg.bim_page?.viewer_entities||'data/隧道BIM.elements.json')]);
  if(!ifcResponse.ok||!metaResponse.ok)throw new Error('找不到 IFC 模型或构件数据');
  const [buffer,metadata]=await Promise.all([ifcResponse.arrayBuffer(),metaResponse.json()]);
  if(new TextDecoder().decode(buffer.slice(0,32)).indexOf('ISO-10303-21')<0)throw new Error('IFC 文件格式无效');
  const digest=await crypto.subtle.digest('SHA-256',buffer);
  const sha=[...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  if(metadata.sha256!==sha)throw new Error('IFC 文件已更新，请重新生成模型显示数据');
  if(generation!==bimBuildGeneration)return;
  bimModelItems=metadata.items;
  bimModelLoading=false;renderBimPage();
 }catch(error){if(generation!==bimBuildGeneration)return;bimModelLoading=false;bimModelError=error.message||String(error);renderBimPage()}
}

function bimExportModel(){
 if(bimModelLoading||bimModelError||!bimModelItems.length)return;
 const path=cfg.bim?.model||'data/隧道BIM.ifc';
 const link=document.createElement('a');
 link.href=new URL(path,document.baseURI).href;
 link.download=String(path).split(/[\\/]/).pop()||'隧道BIM.ifc';
 document.body.append(link);link.click();link.remove();
}

function bimQuickNav(){
 const buttons=obj((cfg.home||{}).buttons||'',';').slice(0,5);
 return `<nav class="bim-quick-nav" aria-label="功能切换">${buttons.map(([label,id])=>`<button type="button" data-bim-nav="${esc(id)}" class="${id==='bim'?'active':''}" ${id==='bim'?'aria-current="page"':''}>${esc(label)}</button>`).join('')}</nav>`;
}
function bimLeave(target){
 bimRenderGeneration++;bimBuildGeneration++;
 if(bimViewer)bimViewer.destroy();
 bimViewer=null;bimModelStarted=false;bimModelLoading=false;bimModelItems=[];bimSelectedId=null;bimModelError='';bimExpandedGroups.clear();
 section=target;demoState='ready';render();
}

function renderBimPage(){
 const generation=++bimRenderGeneration;
 if(bimViewer){bimViewer.destroy();bimViewer=null}
 const page=cfg.bim_page||{},bim=cfg.bim||{},detail=cfg.analysis_detail||{};
 const title=page.title||'BIM建模',parent=page.parent||'数据分析';
 const name=path=>String(path||'').split(/[\\/]/).pop()||'—';
 const modelName=name(bim.model),cloudName=name(bim.pointcloud);
 const columns=String(bim.columns||'').split('|').filter(Boolean);
 const rows=obj(bim.rows||'',';');
 const cards=obj(page.cards||'左|—|分析完成;右|—|未分析;右|—|未分析',';').map(([location,mileage,status],id)=>({
  id,location:bimCardEdits.get(id)?.location??location,
  mileage:bimCardEdits.get(id)?.mileage??mileage,
  status:status||detail.pending_status||'未分析'
 }));
 if(bimCardActive>=cards.length)bimCardActive=0;
 document.title=`${title} · ${cfg.app?.name||'百隧智云'}`;
 $('#app').innerHTML=`<div class="detail-page bim-page">
  <header class="detail-header"><div class="detail-header-title"><span class="detail-header-icon" aria-hidden="true">▤</span><span>${esc(parent)} <span class="bim-crumb-arrow">›</span> ${esc(title)}</span></div><button type="button" data-bim-home aria-label="${esc(page.close_label||'返回首页')}">×</button></header>
  <div class="detail-body">
   <aside class="detail-sidebar"><div class="detail-sidebar-shell"><div class="detail-card-list" data-bim-list>${cards.map(card=>`<article class="detail-card ${card.id===bimCardActive?'selected':''}" data-bim-card="${card.id}"><div class="detail-card-accent"></div><div class="detail-card-inner"><div>${esc(detail.status_label||'分析状态')}：</div><strong class="detail-badge ${card.status===(detail.done_status||'分析完成')?'done':'pending'}">${esc(card.status)}</strong><div>${esc(detail.engineering_label||'接口工程内容')}：</div><span class="detail-card-link">${esc(detail.engineering_value||'接触网预留槽道')}</span><div>${esc(detail.mileage_label||'铁路里程')}：<span>${esc(card.mileage||'—')}</span></div><div class="detail-card-location">${esc(detail.location_label||'所在位置')}：<span>${esc(card.location)}</span></div><button type="button" class="detail-edit" data-bim-edit="${card.id}">${esc(detail.edit_button||'编辑')}</button></div></article>`).join('')}</div><div class="detail-scrollbar"><button type="button" data-bim-scroll-up aria-label="向上滚动">▲</button><div class="detail-scroll-rail" data-bim-rail><div class="detail-scroll-thumb" data-bim-thumb role="scrollbar" aria-label="状态卡片滚动条" tabindex="0"></div></div><button type="button" data-bim-scroll-down aria-label="向下滚动">▼</button></div></div></aside>
   <main class="bim-main">
    <div class="bim-context"><div>${esc(detail.route_label||'线路')}：${esc(detail.route_value||'—')}</div><div>${esc(detail.segment_label||'标段')}：${esc(detail.segment_value||'—')}</div><div>${esc(detail.site_label||'工点')}：${esc(detail.site_value||'—')}</div><div>${esc(detail.chute_label||'滑槽(单据)')}：${esc(detail.chute_value||'—')}</div></div>
    <div class="bim-toolbar"><b>${esc(page.detail_label||'详情')}</b>${bimQuickNav()}<div class="bim-toolbar-actions"><button type="button" class="bim-build-button" data-bim-build ${bimModelLoading?'disabled':''}>${esc(bimModelLoading?(page.loading_button||'建模中…'):(bimModelStarted?(page.rebuild_button||'重新BIM建模'):(page.build_button||'BIM建模')))}</button><button type="button" class="bim-build-button" data-bim-export ${bimModelLoading||bimModelError||!bimModelItems.length?'disabled':''}>${esc(page.export_button||'导出建模')}</button></div></div>
    <div class="bim-workspace">
     <section class="bim-preview"><div class="bim-preview-bar"><strong>${esc(page.preview_title||'BIM模型展示')}</strong></div><div class="bim-preview-canvas" data-bim-canvas>${bimModelError?`<p class="bim-model-message error">${esc(bimModelError)}</p>`:bimModelLoading?`<p class="bim-model-message">${esc(page.loading_hint||'正在读取 IFC 并建立交互模型…')}</p>`:!bimModelStarted?`<p class="bim-model-message">${esc(page.initial_hint||'点击 BIM建模 加载隧道模型')}</p>`:''}</div></section>
     <section class="bim-info"><h2>${esc(page.tree_title||'BIM构件元素树')}${bimModelItems.length?` <small>${bimModelItems.length}${esc(page.element_unit||'个构件')}</small>`:''}</h2><div class="bim-tree" data-bim-tree>${bimModelItems.length?bimEntityTree(bimModelItems):`<div class="bim-tree-empty">${esc(page.tree_hint||'建模后显示构件')}</div>`}</div><div class="bim-parameters" data-bim-properties><div class="bim-empty-parameter">${esc(page.select_hint||'请选择模型构件查看参数')}</div></div></section>
    </div>
    <div class="bim-bottom"><button type="button" data-bim-home-bottom>${esc(page.back_button||'返回首页')} ↩</button></div>
   </main>
  </div>
 </div><div id="bim-edit-root"></div>`;
 document.querySelectorAll('[data-bim-home],[data-bim-home-bottom]').forEach(button=>button.onclick=()=>bimLeave('home'));
 document.querySelectorAll('[data-bim-nav]').forEach(button=>button.onclick=()=>{const id=button.dataset.bimNav;if(id==='bim')return;bimLeave(({geometry:'analysis',defect:'image_analysis',flatness:'flatness'})[id]||id)});
 document.querySelector('[data-bim-build]').onclick=bimStartModel;
 document.querySelector('[data-bim-export]').onclick=bimExportModel;
 document.querySelectorAll('[data-bim-entity]').forEach(button=>button.onclick=()=>bimSelectEntity(Number(button.dataset.bimEntity)));
 document.querySelectorAll('[data-bim-group]').forEach(group=>group.ontoggle=()=>{if(group.open)bimExpandedGroups.add(group.dataset.bimGroup);else bimExpandedGroups.delete(group.dataset.bimGroup)});
 if(bimSelectedId!==null)bimSelectEntity(bimSelectedId);
 if(bimModelStarted&&!bimModelLoading&&!bimModelError&&bimModelItems.length){
  import('./bim_viewer.js').then(async module=>{
   if(generation!==bimRenderGeneration)return;
   const mounted=await module.mountBimViewer(document.querySelector('[data-bim-canvas]'),cfg.bim_page?.viewer_model||'data/隧道BIM.glb',bimSelectEntity,cfg.bim_page?.camera_position,cfg.bim_page?.camera_target);
   if(generation===bimRenderGeneration){bimViewer=mounted;if(bimSelectedId!==null)mounted.select(bimSelectedId)}else mounted.destroy();
  }).catch(error=>{if(generation===bimRenderGeneration){bimModelError=error.message||String(error);renderBimPage()}});
 }
 document.querySelectorAll('[data-bim-card]').forEach(card=>card.onclick=event=>{if(event.target.closest('[data-bim-edit]'))return;bimCardActive=Number(card.dataset.bimCard);renderBimPage()});
 document.querySelectorAll('[data-bim-edit]').forEach(button=>button.onclick=event=>{event.stopPropagation();const id=Number(button.dataset.bimEdit),card=cards[id],root=$('#bim-edit-root');root.innerHTML=`<div class="bim-edit-overlay"><form class="bim-edit-dialog"><h2>${esc(detail.edit_heading||'编辑分析工作区')}</h2><label>${esc(detail.location_label||'所在位置')}<input name="location" value="${esc(card.location)}"></label><label>${esc(detail.mileage_label||'铁路里程')}<input name="mileage" value="${esc(card.mileage)}"></label><div><button type="button" data-bim-edit-cancel>${esc(detail.cancel_button||'取消')}</button><button type="submit">${esc(detail.save_button||'保存')}</button></div></form></div>`;root.querySelector('[data-bim-edit-cancel]').onclick=()=>root.innerHTML='';root.querySelector('form').onsubmit=e=>{e.preventDefault();const form=e.currentTarget;bimCardEdits.set(id,{location:form.elements.location.value.trim(),mileage:form.elements.mileage.value.trim()});bimCardActive=id;renderBimPage()}});
 const list=$('[data-bim-list]'),rail=$('[data-bim-rail]'),thumb=$('[data-bim-thumb]');
 const updateScroll=()=>{const ratio=Math.min(1,list.clientHeight/Math.max(1,list.scrollHeight)),travel=rail.clientHeight;thumb.style.height=`${Math.max(28,travel*ratio)}px`;thumb.style.top=`${list.scrollTop/Math.max(1,list.scrollHeight-list.clientHeight)*Math.max(0,travel-thumb.offsetHeight)}px`};
 list.onscroll=updateScroll;document.querySelector('[data-bim-scroll-up]').onclick=()=>list.scrollBy({top:-170,behavior:'smooth'});document.querySelector('[data-bim-scroll-down]').onclick=()=>list.scrollBy({top:170,behavior:'smooth'});rail.onclick=event=>{if(event.target===thumb)return;const box=rail.getBoundingClientRect();list.scrollTop=((event.clientY-box.top)/Math.max(1,box.height))*Math.max(0,list.scrollHeight-list.clientHeight)};requestAnimationFrame(updateScroll);
}
