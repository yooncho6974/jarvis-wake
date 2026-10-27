'use strict';
const $=id=>document.getElementById(id);
const storageKey='my-pc-remote-connection-v1';
let connection=null,lastStatus=null,busy=false,fetching=false,demo=false,demoAwake=false,toastTimer=null,latestCommand=null,statusError=false,phase=null;
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&validUrl(saved.url)&&typeof saved.key==='string'&&saved.key.length>=32)connection=saved;}catch{}
if(location.hostname==='my-pc-remote-dkwi4.dkwi44.chatgpt.site')connection={url:location.origin,managed:true};
function validUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&u.pathname==='/'&&!u.search&&!u.hash;}catch{return false;}}
function normalizeUrl(raw){const u=new URL(raw);if(!validUrl(u.href))throw Error('HTTPS 서버 주소를 입력해 주십시오.');return u.origin;}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
function log(message){$('system-log').textContent=message;}
function render(){
  $('wake').disabled=busy;$('sleep').disabled=busy;$('demo-toggle').disabled=busy;
  $('demo-toggle').setAttribute('aria-pressed',String(demo));$('demo-banner').hidden=!demo;
  $('demo-toggle').textContent=demo?'◇ 시뮬레이션 종료':'◇ 시뮬레이션';
  let state='unlinked',label='연결 대기',detail='연결 정보를 확인해 주십시오.',mode='STANDBY',link='NOT CONNECTED',remote='연결 필요',caption='연결을 기다리겠습니다.';
  if(demo){state=demoAwake?'online':'sleeping';label=demoAwake?'시뮬레이션 · 활성':'시뮬레이션 · 절전';detail='실제 PC 상태가 아닙니다.';mode='SIMULATION';link='PREVIEW';remote='시뮬레이션';caption=demoAwake?'시스템 준비 완료입니다.':'다음 명령까지 대기하겠습니다.';}
  else if(connection){
    if(statusError){label='연결 확인 필요';detail='서버의 응답이 없습니다.';mode='NO RESPONSE';link='LINK UNAVAILABLE';remote='연결 확인 필요';caption='연결을 다시 확인하겠습니다.';}
    else if(!lastStatus){label='연결 확인 중';detail='잠시만 기다려 주십시오.';mode='ESTABLISHING LINK';link='CONNECTING';remote='상태 확인 중';caption='시스템에 접속하겠습니다.';}
    else if(lastStatus.online){state='online';label='시스템 활성';detail='PC 응답 확인 완료';mode='SYSTEM ONLINE';link='CONNECTED';remote='제어 가능';caption='시스템 준비 완료입니다.';}
    else{state='sleeping';label='PC 응답 대기';detail=lastStatus.lastSeen?'마지막 응답 '+new Date(lastStatus.lastSeen).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}):'절전 또는 연결 중단 상태';mode='AWAITING SIGNAL';link='RELAY CONNECTED';remote='깨우기 가능';caption='깨우기 명령을 기다리겠습니다.';}
  }
  if(phase==='waking'){state='waking';mode=demo?'SIMULATION / WAKING':'WAKE TRANSMISSION';caption='시스템을 호출하겠습니다.';}
  document.body.dataset.state=state;$('status-label').textContent=label;$('last-seen').textContent=detail;$('status').classList.toggle('online',state==='online');$('core-mode').textContent=mode;$('link-state').textContent=link;$('remote-mode').textContent=remote;$('core-caption').textContent=caption;
  $('connect-hint').textContent=connection?'연결 정보 ↗':'연결 설정 ↗';
}
function openSettings(){if(busy)return;if(connection?.managed){toast('본인 계정으로 연결되어 있습니다. 접속 상태를 다시 확인하겠습니다.');refresh();return;}$('server-url').value=connection?.url||'';$('access-key').value=connection?.key||'';$('settings-error').textContent='';$('settings').showModal();}
async function request(path,body,config=connection){
  if(!config)throw Error('먼저 연결을 설정해 주십시오.');
  const response=await fetch(config.url+path,{method:body===undefined?'GET':'POST',headers:{...(config.managed?{}:{Authorization:'Bearer '+config.key}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',credentials:config.managed?'same-origin':'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(75000)});
  let data;try{data=await response.json();}catch{throw Error('서버의 응답을 읽을 수 없습니다. 연결 주소를 확인해 주십시오.');}
  if(!response.ok)throw Error(data.error||'요청을 완료하지 못했습니다.');return data;
}
function friendlyError(error){const messages={'연결 서버가 응답하지 않아요. 잠시 후 다시 시도해주세요.':'연결 서버의 응답이 없습니다. 잠시 후 다시 시도해 주십시오.','본인 ChatGPT 계정으로 로그인해주세요.':'본인의 ChatGPT 계정으로 로그인해 주십시오.','PC 연결을 준비 중이에요.':'PC 연결을 준비하고 있습니다.'};return error.name==='TimeoutError'?'서버 기동에 시간이 필요합니다. 잠시 후 다시 시도해 주십시오.':error instanceof TypeError?'서버에 접속하지 못했습니다. 연결 상태를 확인해 주십시오.':messages[error.message]||error.message;}
async function refresh(){
  if(!connection||demo||fetching)return null;fetching=true;const current=connection;
  try{const data=await request('/api/status');if(connection!==current||demo)return null;const first=!lastStatus;lastStatus=data;statusError=false;render();if(first&&!busy&&!latestCommand)log(data.online?'PC와의 연결이 안정적입니다. 명령을 내려 주십시오.':'PC의 응답을 기다리고 있습니다. 필요하시면 깨우기 신호를 보내겠습니다.');if(latestCommand&&data.command?.id===latestCommand){const messages={accepted:'PC가 절전 명령을 수신했습니다.',failed:'절전 명령을 실행하지 못했습니다. PC 연결 프로그램을 확인해 주십시오.',expired:'응답 시간이 초과되어 절전 명령을 취소했습니다.',cancelled:'PC 연결이 변경되어 절전 명령을 취소했습니다.'};if(messages[data.command.state]){log(messages[data.command.state]);toast(messages[data.command.state]);latestCommand=null;}}return data;}
  catch(error){if(connection===current&&!demo){lastStatus=null;statusError=true;render();log(friendlyError(error));}return null;}
  finally{fetching=false;}
}
$('settings-open').addEventListener('click',openSettings);$('connect-hint').addEventListener('click',openSettings);
$('install-help').addEventListener('click',()=>$('install').showModal());
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('settings-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('save-settings');button.disabled=true;$('settings-error').textContent='연결을 확인하겠습니다. 서버 기동에 시간이 필요할 수 있습니다.';
  try{const next={url:normalizeUrl($('server-url').value.trim()),key:$('access-key').value.trim()};if(next.key.length<32)throw Error('연결 키를 확인해 주십시오.');const state=await request('/api/status',undefined,next);if(typeof state.online!=='boolean')throw Error('PC 제어 서버인지 확인해 주십시오.');localStorage.setItem(storageKey,JSON.stringify(next));connection=next;lastStatus=state;statusError=false;demo=false;render();$('settings').close();log('서버 연결을 확보했습니다. PC의 응답을 확인하겠습니다.');toast('연결 정보를 저장했습니다.');}catch(error){$('settings-error').textContent=friendlyError(error);}finally{button.disabled=false;}
});
$('forget').addEventListener('click',()=>{try{localStorage.removeItem(storageKey);}catch{}connection=null;lastStatus=null;latestCommand=null;demo=false;statusError=false;render();$('settings').close();log('저장된 연결 정보를 삭제했습니다.');toast('이 브라우저의 연결 정보가 삭제되었습니다.');});
$('demo-toggle').addEventListener('click',()=>{if(busy)return;demo=!demo;demoAwake=false;render();log(demo?'시뮬레이션을 시작합니다. 깨우기 명령을 내려 주십시오.':'실제 PC 제어로 복귀했습니다. 연결을 확인하겠습니다.');if(!demo)refresh();});
$('wake').addEventListener('click',async()=>{
  if(busy)return;if(!demo&&!connection){openSettings();return;}
  busy=true;phase='waking';render();window.jarvisVoice?.speak('주인님, 일어날게요. 사랑해요');log(demo?'시뮬레이션: 코어를 활성화하고 있습니다.':'깨우기 신호를 전송하고 있습니다.');
  try{if(demo){await new Promise(r=>setTimeout(r,2300));demoAwake=true;log('시뮬레이션 완료. 명령을 기다리겠습니다.');}else{await request('/api/wake',{});log('호출 신호를 전송했습니다. PC의 응답을 확인하겠습니다.');toast('전송 완료. 실제 PC가 깨어날 때까지 잠시 기다려 주십시오.');await refresh();}}catch(error){log(friendlyError(error));toast(friendlyError(error));}finally{busy=false;phase=null;render();}
});
$('sleep').addEventListener('click',()=>{
  if(busy)return;if(demo){if(!demoAwake){toast('시뮬레이션은 이미 절전 상태입니다.');return;}demoAwake=false;render();window.jarvisVoice?.speak('주인님, 잘 자요. 사랑해요');log('시뮬레이션: 절전 전환 완료. 다시 부르실 때까지 대기하겠습니다.');return;}
  if(!connection){openSettings();return;}if(!lastStatus?.online){toast('PC의 응답이 없습니다. 연결 상태를 먼저 확인해 주십시오.');return;}$('confirm').returnValue='';$('confirm').showModal();
});
$('confirm-action').addEventListener('click',()=>{if(!busy&&!demo)window.jarvisVoice?.speak('주인님, 잘 자요. 사랑해요');});
$('confirm').addEventListener('close',async()=>{
  if($('confirm').returnValue!=='confirm'||busy||demo)return;busy=true;render();
  try{const result=await request('/api/command',{action:'sleep',confirmed:true,nonce:crypto.randomUUID()});latestCommand=result.id;log('절전 명령을 전달했습니다. PC의 수신 확인을 기다리겠습니다.');toast('절전 명령 전송 완료.');}catch(error){log(friendlyError(error));toast(friendlyError(error));}finally{busy=false;render();}
});
function updateClock(){$('clock').textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Seoul',hour12:false});}
updateClock();setInterval(updateClock,1000);setInterval(()=>{if(document.visibilityState==='visible')refresh();},5000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
render();if(!connection)log('연결을 설정하시면 시스템 제어를 시작하겠습니다.');refresh();
const modelContext=document.modelContext;
if(modelContext?.registerTool){const lifecycle=new AbortController();const tool={name:'read_pc_connection_status',title:'Read PC connection status',description:'Read the same PC connection state shown on screen. Does not send power commands or reveal access keys.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:async input=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw Error('Expected an empty object');if(!demo)await refresh();return {configured:!!connection,preview:demo,online:demo?null:(lastStatus?.online??null),display:$('status-label').textContent};}};try{Promise.resolve(modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
