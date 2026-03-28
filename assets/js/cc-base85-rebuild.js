/**
 * cc-base85-rebuild.js
 * BL-base85 decode/encode for item serials. Per borderlands4-serials bitstream spec.
 */
(function () {
  'use strict';

  // Per borderlands4-serials spec: {/} not {|}; alphabet has / not |
  var CUSTOM_B85_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{/}~';

  function reverseBitsInByte(b) {
    var rev = 0;
    for (var i = 0; i < 8; i++) {
      rev = (rev << 1) | (b & 1);
      b >>= 1;
    }
    return rev;
  }

  function stripOuterQuotes(s) {
    s = String(s || '').trim();
    while (s.charAt(0) === '"' || s.charAt(0) === "'") {
      if ((s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') || (s.charAt(0) === "'" && s.charAt(s.length - 1) === "'")) break;
      s = s.slice(1).trim();
    }
    if ((s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') || (s.charAt(0) === "'" && s.charAt(s.length - 1) === "'")) {
      s = s.slice(1, -1).trim();
    }
    while (s.charAt(s.length - 1) === '"' || s.charAt(s.length - 1) === "'") s = s.slice(0, -1).trim();
    return s.trim();
  }

  function customBase85Decode(data) {
    if (data && data.indexOf('@U') === 0) data = data.slice(2);
    var padLen = (5 - (data.length % 5)) % 5;
    var lastChar = CUSTOM_B85_ALPHABET.charAt(CUSTOM_B85_ALPHABET.length - 1);
    for (var p = 0; p < padLen; p++) data += lastChar;
    var out = [];
    for (var i = 0; i < data.length; i += 5) {
      var chunk = data.slice(i, i + 5);
      var acc = 0;
      for (var j = 0; j < chunk.length; j++) {
        var idx = CUSTOM_B85_ALPHABET.indexOf(chunk.charAt(j));
        if (idx < 0) idx = 0;
        acc = acc * 85 + idx;
      }
      for (var k = 3; k >= 0; k--) {
        out.push((acc >> (8 * k)) & 0xff);
      }
    }
    if (padLen) out = out.slice(0, -padLen);
    var mirrored = new Uint8Array(out.length);
    for (var m = 0; m < out.length; m++) mirrored[m] = reverseBitsInByte(out[m]);
    return mirrored;
  }

  function bytesToCustomB85(data) {
    var padLen = (4 - (data.length % 4)) % 4;
    var padded = new Uint8Array(data.length + padLen);
    for (var i = 0; i < data.length; i++) padded[i] = reverseBitsInByte(data[i]);
    var out = '';
    for (var i = 0; i < padded.length; i += 4) {
      var acc = 0;
      for (var j = 0; j < 4; j++) {
        acc = ((acc << 8) | (padded[i + j] || 0)) >>> 0;
      }
      var chars = [];
      for (var k = 0; k < 5; k++) {
        chars.push(CUSTOM_B85_ALPHABET.charAt(acc % 85));
        acc = Math.floor(acc / 85);
      }
      for (var r = chars.length - 1; r >= 0; r--) out += chars[r];
    }
    if (padLen > 0) {
      var charsToTrim = Math.floor((padLen * 5) / 4);
      out = out.slice(0, out.length - charsToTrim);
    }
    return out;
  }

  // --- Bitstream parser (borderlands4-serials spec) ---
  var TOK_SEP1 = 0;
  var TOK_SEP2 = 1;
  var TOK_VARINT = 2;
  var TOK_VARBIT = 3;
  var TOK_PART = 4;
  var TOK_STRING = 5;

  function BitReader(data) {
    this.data = data;
    this.pos = 0;
  }
  BitReader.prototype.read = function () {
    if (this.pos >= this.data.length * 8) return null;
    var byteIdx = this.pos >> 3;
    var bitIdx = 7 - (this.pos & 7);
    this.pos++;
    return (this.data[byteIdx] >> bitIdx) & 1;
  };
  BitReader.prototype.readN = function (n) {
    var v = 0;
    for (var i = 0; i < n; i++) {
      var b = this.read();
      if (b === null) return null;
      v = (v << 1) | b;
    }
    return v;
  };

  function mirror4(n) {
    return ((n >> 3) & 1) | ((n >> 1) & 2) | ((n << 1) & 4) | ((n << 3) & 8);
  }
  function mirror5(n) {
    var r = 0;
    for (var i = 0; i < 5; i++) r = (r << 1) | ((n >> i) & 1);
    return r;
  }

  function readVarint(br) {
    var output = 0;
    var dataRead = 0;
    for (var block = 0; block < 4; block++) {
      var nibble = br.readN(4);
      if (nibble === null) return null;
      output |= mirror4(nibble & 15) << dataRead;
      dataRead += 4;
      var cont = br.read();
      if (cont === null) return null;
      if (cont === 0) break;
    }
    return output;
  }

  function readVarbit(br) {
    var lenRaw = br.readN(5);
    if (lenRaw === null) return null;
    var length = mirror5(lenRaw & 31);
    if (length === 0) return 0;
    var v = 0;
    for (var i = 0; i < length; i++) {
      var b = br.read();
      if (b === null) return null;
      v |= b << i;
    }
    return v;
  }

  function nextToken(br) {
    var b1 = br.read();
    var b2 = br.read();
    if (b1 === null || b2 === null) return null;
    var tok = (b1 << 1) | b2;
    if (tok === 0) return TOK_SEP1;
    if (tok === 1) return TOK_SEP2;
    var b3 = br.read();
    if (b3 === null) return null;
    tok = (tok << 1) | b3;
    if (tok === 4) return TOK_VARINT;
    if (tok === 6) return TOK_VARBIT;
    if (tok === 5) return TOK_PART;
    if (tok === 7) return TOK_STRING;
    return null;
  }

  function readPart(br) {
    var index = readVarint(br);
    if (index === null) return null;
    var flag1 = br.read();
    if (flag1 === null) return null;
    if (flag1 === 1) {
      var value = readVarint(br);
      if (value === null) return null;
      br.read();
      br.read();
      br.read();
      return { index: index, subtype: 'int', value: value };
    }
    var flag2 = br.readN(2);
    if (flag2 === null) return null;
    if (flag2 === 2) return { index: index, subtype: 'none' };
    if (flag2 === 1) {
      var token = nextToken(br);
      if (token !== TOK_SEP2) return null;
      var values = [];
      while (true) {
        token = nextToken(br);
        if (token === TOK_SEP1) break;
        if (token === TOK_VARINT) {
          var v = readVarint(br);
          if (v === null) return null;
          values.push(v);
        } else if (token === TOK_VARBIT) {
          v = readVarbit(br);
          if (v === null) return null;
          values.push(v);
        } else return null;
      }
      return { index: index, subtype: 'list', values: values };
    }
    return null;
  }

  function readString(br) {
    var len = readVarint(br);
    if (len === null) return null;
    var s = '';
    for (var i = 0; i < len; i++) {
      var ch = 0;
      for (var b = 0; b < 7; b++) {
        var bit = br.read();
        if (bit === null) return null;
        ch |= bit << b;
      }
      s += String.fromCharCode(ch);
    }
    return s;
  }

  function bitstreamToDeserialized(bytes) {
    var br = new BitReader(bytes);
    for (var i = 0; i < 7; i++) br.read();
    var parts = [];
    var current = [];
    var result = [];
    while (true) {
      var token = nextToken(br);
      if (token === null) break;
      if (token === TOK_SEP1) {
        if (current.length) result.push(current.join(', '));
        result.push('|');
        current = [];
        continue;
      }
      if (token === TOK_SEP2) {
        continue;
      }
      if (token === TOK_VARINT) {
        var v = readVarint(br);
        if (v === null) break;
        current.push(String(v));
        continue;
      }
      if (token === TOK_VARBIT) {
        v = readVarbit(br);
        if (v === null) break;
        current.push(String(v));
        continue;
      }
      if (token === TOK_PART) {
        var p = readPart(br);
        if (p === null) break;
        if (p.subtype === 'none') parts.push('{' + p.index + '}');
        else if (p.subtype === 'int') parts.push('{' + p.index + ':' + p.value + '}');
        else parts.push('{' + p.index + ':[' + p.values.join(' ') + ']}');
        continue;
      }
      if (token === TOK_STRING) {
        var str = readString(br);
        if (str === null) break;
        parts.push('"' + str + '"');
        continue;
      }
    }
    var blocks = [];
    for (var r = 0; r < result.length; r++) {
      if (result[r] !== '|') blocks.push(result[r]);
    }
    var out = blocks.filter(Boolean).join('| ');
    var emptyCount = 0;
    for (var e = 0; e < blocks.length; e++) if (blocks[e] === '') emptyCount++;
    for (var j = 0; j < emptyCount; j++) out += '|';
    if (parts.length) out += (out ? ' ' : '') + parts.join(' ');
    out += '|';
    return out.trim();
  }

  function deserializeBase85(b85, headerWords) {
    headerWords = headerWords || 17;
    b85 = stripOuterQuotes(b85);
    if (!b85) return '';
    var bytes;
    try {
      bytes = customBase85Decode(b85);
    } catch (e) {
      console.warn('Failed to base85-decode:', e);
      return b85;
    }
    try {
      return bitstreamToDeserialized(bytes);
    } catch (e) {
      console.warn('Failed to parse bitstream:', e);
      return b85;
    }
  }

  function serializeToBase85(deser, headerWords) {
    headerWords = headerWords || 17;
    deser = stripOuterQuotes(deser);
    if (!deser) return '';
    try {
      var bits = deserializedToBitstream(deser);
      var bytes = bitsToBytes(bits);
      var mirrored = new Uint8Array(bytes.length);
      for (var i = 0; i < bytes.length; i++) mirrored[i] = reverseBitsInByte(bytes[i]);
      var b85 = bytesToCustomB85(mirrored);
      // Game serials use the @U prefix; decode path strips it in customBase85Decode().
      return b85 ? ('@U' + b85) : '';
    } catch (e) {
      console.warn('Failed to serialize to base85:', e);
      return '';
    }
  }

  function bitsToBytes(bits) {
    while (bits.length % 8) bits += '0';
    var bytes = [];
    for (var i = 0; i < bits.length; i += 8) {
      bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }
    return new Uint8Array(bytes);
  }

  function writeVarint(bits, value) {
    var v = value >>> 0;
    var nibbles = [];
    do {
      nibbles.push(v & 15);
      v >>>= 4;
    } while (v > 0);
    if (nibbles.length === 0) nibbles = [0];
    for (var i = 0; i < nibbles.length; i++) {
      var n = mirror4(nibbles[i] & 15);
      for (var b = 3; b >= 0; b--) bits += String((n >> b) & 1);
      bits += i < nibbles.length - 1 ? '1' : '0';
    }
    return bits;
  }

  function writeVarbit(bits, value) {
    var v = value >>> 0;
    var len = 0;
    var t = v;
    while (t) { len++; t >>= 1; }
    if (len === 0) len = 1;
    var len5 = mirror5(len);
    for (var i = 4; i >= 0; i--) bits += String((len5 >> i) & 1);
    for (var i = 0; i < len; i++) bits += String((v >> i) & 1);
    return bits;
  }

  function deserializedToBitstream(deser) {
    var MAGIC = '0010000';
    var bits = MAGIC;
    var segs = deser.replace(/\|\s*$/, '').split(/\|/);
    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i].trim();
      var partTokens = seg.match(/\{[^}]+\}/g);
      var hasBraces = seg.indexOf('{') >= 0;
      var nums = hasBraces ? null : (seg.match(/\d+/g) || []);
      if (partTokens && partTokens.length > 0) {
        for (var t = 0; t < partTokens.length; t++) {
          var tok = partTokens[t];
          var m = tok.slice(1, -1).match(/^(\d+)(?::(\d+))?(?::\[([^\]]*)\])?$/);
          if (!m) continue;
          bits += '101';
          bits = writeVarint(bits, parseInt(m[1], 10));
          if (m[2] != null) {
            bits += '1';
            bits = writeVarint(bits, parseInt(m[2], 10));
            bits += '000';
          } else if (m[3] != null) {
            bits += '001';
            bits += '01';
            var vals = (m[3] || '').match(/\d+/g) || [];
            for (var v = 0; v < vals.length; v++) {
              bits += '100';
              bits = writeVarint(bits, parseInt(vals[v], 10));
            }
            bits += '00';
          } else {
            bits += '010';
          }
        }
      } else if (nums && nums.length > 0) {
        for (var n = 0; n < nums.length; n++) {
          bits += '100';
          bits = writeVarint(bits, parseInt(nums[n], 10));
          if (n < nums.length - 1) bits += '01';
        }
      }
      bits += '00';
    }
    return bits;
  }

  var LEVEL_PREFIX = '0110000000011001000001100';
  var MISSING_LEVEL_PATTERN = '0110000000011000100001';

  function parseVarintChunks(binaryStr) {
    var idx = binaryStr.indexOf(LEVEL_PREFIX);
    if (idx === -1) throw new Error('LEVEL_PREFIX not found in binary string');
    var pos = idx + LEVEL_PREFIX.length;
    var valueBits = '';
    while (true) {
      var chunk = binaryStr.slice(pos, pos + 5);
      if (chunk.length < 5) throw new Error('Unexpected end of binary string while parsing varint');
      var dataBits = chunk.slice(0, 4);
      var cont = chunk[4] === '1';
      valueBits += dataBits;
      pos += 5;
      if (!cont) break;
    }
    var value = parseInt(valueBits.split('').reverse().join(''), 2);
    return { value: value, start: idx + LEVEL_PREFIX.length, end: pos };
  }

  function encodeVarintChunks(value) {
    var bits = value.toString(2).padStart(8, '0').split('').reverse().join('');
    bits = bits.replace(/0+$/, '');
    if (bits.length < 4) bits = bits.padEnd(4, '0');
    var chunks = [];
    for (var i = 0; i < bits.length; i += 4) chunks.push(bits.slice(i, i + 4));
    var out = '';
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i].padEnd(4, '0');
      var cont = i < chunks.length - 1 ? '1' : '0';
      out += chunk + cont;
    }
    return out;
  }

  function updateSerialLevel(serial, newLevel) {
    if (!serial || typeof serial !== 'string') return serial;
    var decoded;
    try {
      decoded = customBase85Decode(serial);
    } catch (e) {
      console.warn('updateSerialLevel: decode failed', e);
      return serial;
    }
    var reversedBytes = new Uint8Array(decoded.length);
    for (var r = 0; r < decoded.length; r++) reversedBytes[r] = reverseBitsInByte(decoded[r]);
    var binaryStr = Array.from(reversedBytes).map(function (b) { return b.toString(2).padStart(8, '0'); }).join('');
    var oldLevel, start, end;
    var newBinaryStr = null;
    var maxDifferenceBytes = 3;
    try {
      var parsed = parseVarintChunks(binaryStr);
      oldLevel = parsed.value;
      start = parsed.start;
      end = parsed.end;
      newBinaryStr = binaryStr.slice(0, start) + encodeVarintChunks(newLevel) + binaryStr.slice(end);
    } catch (err) {
      var missIdx = binaryStr.indexOf(MISSING_LEVEL_PATTERN);
      if (missIdx !== -1) {
        var insertPos = missIdx + 12;
        var insertBits = '1001000001100' + encodeVarintChunks(newLevel) + '00';
        newBinaryStr = binaryStr.slice(0, insertPos) + insertBits + binaryStr.slice(insertPos);
        maxDifferenceBytes += 4;
      } else {
        console.error('parseVarintChunks error for serial:', err.message);
        return serial;
      }
    }
    if (newBinaryStr === null) return serial;
    var newBytes = bitsToBytes(newBinaryStr);
    var restoredBytes = new Uint8Array(newBytes.length);
    for (var i = 0; i < newBytes.length; i++) restoredBytes[i] = reverseBitsInByte(newBytes[i]);
    var b85Str = bytesToCustomB85(restoredBytes).replace(/\|/g, '/');
    var newSerial = '@U' + b85Str;
    if (Math.abs(newSerial.length - serial.length) > maxDifferenceBytes) {
      console.warn('Serial length differs by more than ' + maxDifferenceBytes + ' byte(s), keeping old value');
      return serial;
    }
    return newSerial;
  }

  function processSlot(slot, level) {
    if (Array.isArray(slot)) {
      for (var i = 0; i < slot.length; i++) {
        var item = slot[i];
        if (item && typeof item === 'object' && item.serial) {
          item.serial = updateSerialLevel(item.serial, level);
        }
      }
    } else if (slot && typeof slot === 'object' && slot.serial) {
      slot.serial = updateSerialLevel(slot.serial, level);
    }
  }

  window.customBase85Decode = customBase85Decode;
  window.bytesToCustomB85 = bytesToCustomB85;
  window.deserializeBase85 = deserializeBase85;
  window.serializeToBase85 = serializeToBase85;
  window.updateSerialLevel = updateSerialLevel;
  window.processSlot = processSlot;
})();
