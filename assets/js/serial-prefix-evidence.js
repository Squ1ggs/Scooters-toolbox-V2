// Strict, bounded inspection of complete tokens before a failed full decode.
// Never repairs, re-encodes, or accepts a partial serial as a valid roll.
(function () {
  'use strict';
  function inspect(serial) {
    if (typeof window.customBase85Decode !== 'function') return null;
    var alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~';
    var body=String(serial || '').trim().replace(/^@u/i,'').replace(/\s/g,'').replace(/\//g,'|');
    // Do not derive evidence from wrapped uint32 values in invalid full groups.
    for(var group=0;group+5<=body.length;group+=5){
      var accumulator=0;
      for(var digit=0;digit<5;digit++){
        var index=alphabet.indexOf(body[group+digit]);if(index<0)return null;
        accumulator=accumulator*85+index;
      }
      if(accumulator>4294967295)return null;
    }
    var bytes;
    try { bytes=window.customBase85Decode(serial); } catch (_) { return null; }
    var position=0, limit=bytes.length*8, verified=0;
    function bits(n) {
      if(position+n>limit)throw new Error('Incomplete token at bit '+position);
      var v=0;for(var i=0;i<n;i++,position++)v=(v<<1)|((bytes[position>>3]>>(7-(position&7)))&1);
      return v;
    }
    function little(n) {var v=0;for(var i=0;i<n;i++)v+=bits(1)*Math.pow(2,i);return v;}
    function integer() {
      var v=0;
      for(var block=0;block<4;block++){
        v+=little(4)*Math.pow(16,block);
        if(!bits(1))return v;
      }
      throw new Error('Unsupported continued integer at bit '+position);
    }
    function token() {var lead=bits(2);return lead<2?lead:lead*2+bits(1);}
    function number(kind) {return kind===4?integer():little(little(5));}
    var sections=[], current=[], parts=[], stopped='', brokenAt=null, start=0;
    try {
      if(bits(7)!==16)return null;
      while(position<limit){
        start=position;
        var kind=token();
        if(kind===0){sections.push(current);current=[];}
        else if(kind===1){}
        else if(kind===4||kind===6){
          if(parts.length)throw new Error('Numeric tail outside verified header');
          current.push(number(kind));
        }else if(kind===5){
          var index=integer(), text;
          if(bits(1)){
            var value=integer();if(bits(3)!==0)throw new Error('Unsupported part marker');
            text='{'+index+':'+value+'}';
          }else{
            var subtype=bits(2);
            if(subtype===2)text='{'+index+'}';
            else if(subtype===1){
              if(token()!==1)throw new Error('Invalid part-list opening');
              var values=[];
              while(true){var item=token();if(item===0)break;if(item!==4&&item!==6)throw new Error('Unsupported part-list token');values.push(number(item));}
              text='{'+index+':['+values.join(' ')+']}';
            }else throw new Error('Unsupported part subtype');
          }
          parts.push(text);
        }else throw new Error('String or unknown token outside numeric-prefix scope');
        verified=position;
      }
    }catch(error){stopped=error.message;brokenAt=start;}
    var header=sections[0];
    if(!header||header.length!==4||header[1]!==0||header[2]!==1||!parts.length)return null;
    var head=sections.filter(function (section) {return section.length;}).map(function (section) {return section.join(', ');}).join('| ');
    return {complete:false,header_verified:true,itemTypeId:header[0],level:header[3],
      deserialized_prefix:head+'|| '+parts.join(' '),complete_part_tokens:parts.length,
      verified_prefix_bits:verified,total_available_bits:limit,stopped_at_bit:brokenAt,
      stop_reason:stopped||'Full decoder rejected the stream; prefix inspection is not acceptance',
      scope:'Complete header and part tokens only. Unparsed tail omitted; no bytes added or changed.'};
  }
  window.SerialPrefixEvidence={inspect:inspect};
})();
