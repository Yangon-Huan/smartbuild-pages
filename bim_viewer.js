import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function mountBimViewer(host, source, onSelect, cameraPreset, targetPreset){
 if(!host)throw new Error('找不到模型展示区域');
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.setClearColor(0xdce8e9);
 host.replaceChildren(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xdce8e9);
 const camera=new THREE.PerspectiveCamera(48,1,.01,100000);
 camera.up.set(0,0,1);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.dampingFactor=.08;
 controls.screenSpacePanning=true;
 scene.add(new THREE.HemisphereLight(0xffffff,0x829aa0,2.5));
 const light=new THREE.DirectionalLight(0xffffff,2.1);light.position.set(-15,-20,30);scene.add(light);
 const fill=new THREE.DirectionalLight(0xb8e9ff,.8);fill.position.set(10,12,2);scene.add(fill);
 let model=null, selected=null, selectedOutline=null, previousMaterial=null, previousRenderOrder=0, frame=0, destroyed=false;
 const highlight=new THREE.MeshBasicMaterial({color:0xff9500,side:THREE.DoubleSide,depthTest:false,depthWrite:false});
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const resize=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const select=id=>{
  if(selected&&previousMaterial){selected.material=previousMaterial;selected.renderOrder=previousRenderOrder}
  if(selectedOutline){scene.remove(selectedOutline);selectedOutline.geometry.dispose();selectedOutline.material.dispose();selectedOutline=null}
  selected=null;previousMaterial=null;
  if(id===null||!model)return;
  model.traverse(object=>{if(!selected&&object.isMesh&&object.name.endsWith('_'+id)){selected=object;previousMaterial=object.material;previousRenderOrder=object.renderOrder;object.material=highlight;object.renderOrder=1000}});
  if(selected){selectedOutline=new THREE.BoxHelper(selected,0xffba36);selectedOutline.material.depthTest=false;selectedOutline.renderOrder=1001;scene.add(selectedOutline)}
  return selected?.name||null;
 };
 let down=null;
 renderer.domElement.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY}});
 renderer.domElement.addEventListener('pointerup',event=>{
  if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>5||!model)return;
  const box=renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObject(model,true)[0];
  const match=hit?.object?.name.match(/_(\d+)$/);
  if(match)onSelect(Number(match[1]));
  down=null;
 });
 const render=()=>{if(destroyed)return;frame=requestAnimationFrame(render);controls.update();renderer.render(scene,camera)};render();
 try{
  const gltf=await new GLTFLoader().loadAsync(source);
  if(destroyed)return {select(){},destroy(){}};
  model=gltf.scene;
  model.traverse(object=>{if(object.isMesh){const materials=Array.isArray(object.material)?object.material:[object.material];for(const material of materials){material.side=THREE.DoubleSide;material.roughness=.85;material.metalness=0;material.needsUpdate=true}}});
  scene.add(model);
  const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  model.position.sub(center);
  const distance=Math.max(size.x,size.y,size.z)*.65;
  const pose=String(cameraPreset||'1.35,-0.6,0.45').split(',').map(Number);
  const [cx,cy,cz]=pose.length===3&&pose.every(Number.isFinite)?pose:[1.35,-.6,.45];
  camera.position.set(distance*cx,distance*cy,distance*cz);
  camera.near=Math.max(distance/150,.3);camera.far=Math.max(distance*20,1000);camera.updateProjectionMatrix();
  const aim=String(targetPreset||'0.2,0,0').split(',').map(Number);
  const [tx,ty,tz]=aim.length===3&&aim.every(Number.isFinite)?aim:[.2,0,0];
  controls.target.set(size.x*tx,size.y*ty,size.z*tz);controls.minDistance=Math.max(distance*.05,.1);controls.maxDistance=distance*15;controls.update();
  const grid=new THREE.GridHelper(Math.max(size.x,size.y,size.z)*2,30,0x9abcc1,0xb5cdd0);
  grid.rotation.x=Math.PI/2;grid.position.z=-size.z/2-.1;grid.material.transparent=true;grid.material.opacity=.18;scene.add(grid);
 }catch(error){destroy();throw new Error('IFC 模型显示数据加载失败：'+(error.message||error))}
 function destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();if(selectedOutline){selectedOutline.geometry.dispose();selectedOutline.material.dispose()}if(model)model.traverse(object=>{if(object.isMesh){object.geometry.dispose();if(object.material!==highlight){const mats=Array.isArray(object.material)?object.material:[object.material];mats.forEach(material=>material?.dispose())}}});highlight.dispose();renderer.dispose();renderer.domElement.remove()}
 return {select,destroy};
}
