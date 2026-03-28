/**
 * Optional: paste at end of a standalone decoder page opened in an iframe so the parent
 * (cc-stx-decoder-bridge.js) can postMessage stx-decode-request / receive stx-decode-response.
 * The iframe target is legacy/bl4-bulk-decoder.html (or assets/stx-bulk-decoder-built.html); the
 * build bundles this bridge inline on those pages.
 */
(function bridgeForParent(){
  if(window===window.top)return;
  let initStarted=false;
  async function ensureDecoder(){
    if(window.stxDecodeBulk&&window.stxDecoderReady)return;
    if(!initStarted){initStarted=true;await initDecoder()}else{await new Promise(r=>setTimeout(r,50));return ensureDecoder()}
  }
  function norm(s){return String(s||'').trim().replace(/^["']|["']$/g,'')}
  function variants(s){
    const v=norm(s);
    if(!v)return[];
    const out=[v];
    if(v.length>2&&v.indexOf('@U')===0)out.push(v.slice(2));
    return Array.from(new Set(out));
  }
  window.addEventListener('message',async ev=>{
    const d=ev.data&&ev.data.type==='stx-decode-request'?ev.data:null;
    if(!d||!Array.isArray(d.serials))return;
    try{
      await ensureDecoder();
      const raw=JSON.parse(window.stxDecodeBulk(JSON.stringify(d.serials))||'[]');
      const variantToSerial={};
      for(let i=0;i<d.serials.length;i++){
        const s=d.serials[i];
        for(const v of variants(s))variantToSerial[v]=s;
      }
      const byInput={};
      for(let i=0;i<raw.length;i++){
        const r=raw[i];
        const ser=norm(r&&r.input);
        if(!ser)continue;
        const canonical=variantToSerial[ser];
        if(canonical)byInput[norm(canonical)]=r;
      }
      const orderPreserved=raw.length===d.serials.length;
      const results=[];
      for(let i=0;i<d.serials.length;i++){
        const serial=d.serials[i];
        const sn=norm(serial);
        let r=orderPreserved&&raw[i]&&typeof raw[i]==='object'?raw[i]:byInput[sn];
        if(r&&typeof r==='object'&&r!==null){
          const entry={};
          for(const k in r)if(Object.prototype.hasOwnProperty.call(r,k))entry[k]=r[k];
          entry.input=serial;
          results.push(entry);
        }else{
          results.push({input:serial,success:false,error:'no matching decoder result'});
        }
      }
      window.parent.postMessage({type:'stx-decode-response',id:d.id,results},'*');
    }catch(err){
      window.parent.postMessage({type:'stx-decode-response',id:d.id,results:[],error:String(err&&err.message||err)},'*');
    }
  });
  ensureDecoder().then(()=>{try{window.parent.postMessage({type:'stx-decoder-ready'},'*')}catch(_){}});
})();
