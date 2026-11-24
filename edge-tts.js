/* Edge TTS (Microsoft) — giọng nam/nữ tiếng Việt, không cần API key.
 * Port từ rany2/edge-tts (drm.py, Sec-MS-GEC v2) và nakamuraia/dsh-plugin-speech
 * (src/providers/edge/gec.ts). Thuật toán token v2: modified-SHA-256 + checksum 64-bit,
 * định dạng <16 hex>-<64 hex>, hiệu lực 5 phút. Mọi phép toán 32-bit có chủ đích.
 * Dùng được cả trên trình duyệt (WebSocket) và Node 22+ (WebSocket toàn cục).
 */
(function (root) {
  "use strict";
  var TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
  var SYNTHESIS_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
  var SEC_MS_GEC_VERSION = "2-143.0.3650.75";
  var WINDOWS_EPOCH_SECONDS = 11644473600;

  function u32(v) { return v >>> 0; }
  var SHA256_INITIAL = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  var SHA256_PREFIX_STATE = [0xfd9fbea2, 0x91243ce7, 0xbe499094, 0xcd2e1e0a, 0x6c006f49, 0x04bd35ab, 0xfeb0a7e4, 0x03effbd2];
  var SHA256_PREFIX_SCHEDULE = [0xeb24bf9e, 0x1558691f, 0xa0c09ee2, 0x0cfa32ba, 0xa622ee8c, 0xd1dd9491, 0xc0dd25a0, 0xf9e70ab6, 0xf0c31573, 0x7058ce4e, 0x7188e606, 0x00e5ab33, 0xd258b060, 0x72766564];
  var SHA256_ROUND_CONSTANTS = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  var SHA256_PREFIX_ADJUSTMENT = 0xc9dc06a7;
  var SHA256_PREFIX_CONSTANTS = SHA256_ROUND_CONSTANTS.slice(0, 14).concat([SHA256_PREFIX_ADJUSTMENT], SHA256_ROUND_CONSTANTS.slice(15));
  var SHA256_SIGMA0_ADJUSTMENT = 0x059c0b80;
  var SHA256_SIGMA1_ADJUSTMENT = 0x000b92c0;
  var CS64_COEFFICIENTS = [
    [0xe82e91b1, 0xb32700d0], [0x44de24c6, 0x88dff51d], [0x3beb65bc, 0x29514038],
    [0xc89c5933, 0xb328cbdf], [0x8d1ec211, 0xd405b4d5], [0x314ef5d5, 0x26e55f3c],
    [0xe92491b1, 0x607801c6], [0xf0a5b9d5, 0x82b2c1fb], [0x06064cf3, 0xfa51a3da],
    [0xda79fa60, 0x207cc464], [0xbed20560, 0x3c3c74f3], [0x89f9c9f8, 0xd2d14b61],
    [0x35fa38c6, 0xbb04a2c1], [0xcb49e3c6, 0xc5626167]];
  var CS64_FACTOR = 0x82893933;
  var CS64_ADJUSTMENT0 = 0xf2f90b1a;
  var CS64_ADJUSTMENT1 = 0x0b1a0000;

  function rotateLeft16(v) { v = u32(v); return u32((v << 16) | (v >>> 16)); }
  function rotateRight(v, bits) { v = u32(v); return u32((v >>> bits) | (v << (32 - bits))); }
  function bigSigma0(v) { return u32(rotateRight(v, 2) ^ rotateRight(v, 13) ^ rotateRight(v, 22)); }
  function bigSigma1(v) { return u32(rotateRight(v, 6) ^ rotateRight(v, 11) ^ rotateRight(v, 25)); }
  function smallSigma0(v) { var w = u32(v); return u32((w >>> 7) ^ (w << 25) ^ (w >>> 18) ^ (w << 14) ^ (w >>> 3)); }
  function smallSigma1(v) { var w = u32(v); return u32((w >>> 17) ^ (w << 15) ^ (w >>> 19) ^ (w << 13) ^ (w >>> 10)); }
  function choose(e, f, g) { return u32(g ^ (e & (f ^ g))); }
  function majority(a, b, c) { return u32((a & b) | (c & (a | b))); }

  function expandSchedule(words, first) {
    for (var i = first; i < 64; i++) {
      words.push(u32(smallSigma1(words[i - 2]) + words[i - 7] + smallSigma0(words[i - 15]) + words[i - 16]));
    }
  }
  function rounds(state, words, constants, first) {
    first = first || 0;
    var a = state[0], b = state[1], c = state[2], d = state[3], e = state[4], f = state[5], g = state[6], h = state[7];
    for (var i = first; i < 64; i++) {
      var t1 = u32(h + bigSigma1(e) + choose(e, f, g) + constants[i] + words[i]);
      var t2 = u32(bigSigma0(a) + majority(a, b, c));
      h = g; g = f; f = e; e = u32(d + t1); d = c; c = b; b = a; a = u32(t1 + t2);
    }
    return [a, b, c, d, e, f, g, h];
  }
  function prefixState(prefix) {
    var words = new Array(14).fill(0);
    words.push(u32((prefix[0] << 16) | (prefix[1] << 8) | prefix[2]));
    words.push(u32((prefix[3] << 24) | (prefix[4] << 16) | (prefix[5] << 8) | prefix[6]));
    for (var index = 16; index < 30; index++) {
      var value = SHA256_PREFIX_SCHEDULE[index - 16];
      if (index - 2 >= 14) {
        var sigma = smallSigma1(words[index - 2]);
        value += index === 16 ? u32(sigma ^ SHA256_SIGMA1_ADJUSTMENT) : sigma;
      }
      if (index - 7 >= 14) value += words[index - 7];
      if (index - 15 >= 14) {
        var sigma0 = smallSigma0(words[index - 15]);
        value += index === 29 ? u32(sigma0 ^ SHA256_SIGMA0_ADJUSTMENT) : sigma0;
      }
      words.push(u32(value));
    }
    words.push(u32(smallSigma1(words[28]) + words[23] + smallSigma0(words[15]) + words[14] + SHA256_PREFIX_ADJUSTMENT - SHA256_ROUND_CONSTANTS[14]));
    expandSchedule(words, 31);
    var working = rounds(SHA256_PREFIX_STATE, words, SHA256_PREFIX_CONSTANTS, 14);
    return SHA256_INITIAL.map(function (initial, idx) { return u32(initial + working[idx]); });
  }
  function concatBytes(parts) {
    var len = 0, i, j;
    for (i = 0; i < parts.length; i++) len += parts[i].length;
    var out = new Uint8Array(len), off = 0;
    for (i = 0; i < parts.length; i++) { out.set(parts[i], off); off += parts[i].length; }
    return out;
  }
  function hexUpper(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) { var h = bytes[i].toString(16); s += (h.length < 2 ? "0" + h : h); }
    return s.toUpperCase();
  }
  function readU32BE(buf, off) { return new DataView(buf.buffer, buf.byteOffset, buf.byteLength).getUint32(off, false); }
  function readU32LE(buf, off) { return new DataView(buf.buffer, buf.byteOffset, buf.byteLength).getUint32(off, true); }

  function tokenDigest(data) {
    var length = 57 + data.length;
    var zeros = new Uint8Array(((((55 - length) % 64) + 64) % 64));
    var tail = concatBytes([data.subarray(7), new Uint8Array([0x80]), zeros]);
    var size = new Uint8Array(8);
    new DataView(size.buffer).setBigUint64(0, BigInt(length) * 8n, false);
    var padded = concatBytes([tail, size]);
    var state = prefixState(data.subarray(0, 7));
    for (var offset = 0; offset < padded.length; offset += 64) {
      var words = [];
      for (var i = 0; i < 16; i++) words.push(readU32BE(padded, offset + i * 4));
      expandSchedule(words, 16);
      var working = rounds(state, words, SHA256_ROUND_CONSTANTS);
      state = state.map(function (v, idx) { return u32(v + working[idx]); });
    }
    var digest = new Uint8Array(32);
    var dv = new DataView(digest.buffer);
    state.forEach(function (w, idx) { dv.setUint32(idx * 4, w, false); });
    return digest;
  }
  function checksum64(data, digest) {
    var keys = [u32(readU32LE(digest, 0) | 1), u32(readU32LE(digest, 4) | 1)];
    var factors = [u32(Math.imul(keys[0], CS64_FACTOR)), u32(Math.imul(keys[1], CS64_FACTOR))];
    var terms = CS64_COEFFICIENTS.map(function (pair, idx) { return u32(Math.imul(pair[0], factors[idx % 2])); });
    var offsets = CS64_COEFFICIENTS.map(function (pair) { return pair[1]; });
    var prefixed = concatBytes([new Uint8Array(1), data]);
    var sized = concatBytes([prefixed, new Uint8Array((4 - (prefixed.length % 4)) % 4)]);
    var words = [];
    for (var off = 0; off < sized.length; off += 4) words.push(readU32LE(sized, off));
    if (words.length % 2 === 1) words.push(0);
    words.forEach(function (word, index) {
      var term = u32(Math.imul(word, keys[index % 2]));
      var offset = u32(Math.imul(rotateLeft16(word), index % 2 === 0 ? 0xef0569fb : 0xc31713db));
      if (index === 0) {
        term = u32(term + Math.imul(CS64_ADJUSTMENT0, factors[0]));
        offset = u32(offset + CS64_ADJUSTMENT1);
      }
      terms.push(term); offsets.push(offset);
    });
    var swappedAccumulator = 0, swappedLast = 0, state = 0, accumulator = 0;
    for (var i = 0; i < terms.length; i += 2) {
      var x = terms[i], y = terms[i + 1];
      var lane = rotateLeft16(u32(offsets[i] + x));
      var product = u32(Math.imul(lane, 0x76f50f34));
      swappedAccumulator = u32(swappedAccumulator + u32(Math.imul(rotateLeft16(product), 0xc3efea97) + product));
      lane = rotateLeft16(u32(offsets[i + 1] + y));
      product = u32(Math.imul(lane, 0x1881ce3c));
      swappedLast = u32(Math.imul(rotateLeft16(product), 0x35bd1ec9) + product);
      swappedAccumulator = u32(swappedAccumulator + swappedLast);
      state = u32(Math.imul(state, keys[0]) + x);
      state = u32(Math.imul(rotateLeft16(state), 0xcf98b111));
      state = u32(Math.imul(rotateLeft16(state), 0x87085b9f));
      state = u32(Math.imul(rotateLeft16(state), 0x12ceb96d));
      state = u32(Math.imul(rotateLeft16(state), 0x257e1d83));
      accumulator = u32(accumulator + state);
      lane = u32(Math.imul(state, keys[1]) + y);
      lane = u32(Math.imul(rotateLeft16(lane), 0xa27416f5));
      lane = u32(Math.imul(rotateLeft16(lane), 0xd38396ff));
      state = u32(Math.imul(rotateLeft16(u32(Math.imul(rotateLeft16(lane), 0x7c932b89))), 0xbfa49f69));
      accumulator = u32(accumulator + state);
    }
    return [u32(swappedLast ^ state), u32(swappedAccumulator ^ accumulator)];
  }
  function tokenInput(nowMs) {
    var ticks = Math.floor(nowMs / 1000) + WINDOWS_EPOCH_SECONDS;
    ticks -= ticks % 300;
    var str = (BigInt(ticks) * 10000000n).toString() + TRUSTED_CLIENT_TOKEN;
    return new TextEncoder().encode(str);
  }
  function secMsGec(nowMs) {
    var data = tokenInput(nowMs);
    var digest = tokenDigest(data);
    var pair = checksum64(data, digest);
    var checksum = new Uint8Array(8);
    var dv = new DataView(checksum.buffer);
    dv.setUint32(0, pair[0] >>> 0, true);
    dv.setUint32(4, pair[1] >>> 0, true);
    return hexUpper(checksum) + "-" + hexUpper(digest);
  }
  function synthUrl(nowMs) {
    nowMs = nowMs || Date.now();
    var connectionId = (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16); })).replace(/-/g, "");
    var q = new URLSearchParams({ TrustedClientToken: TRUSTED_CLIENT_TOKEN, "Sec-MS-GEC": secMsGec(nowMs), "Sec-MS-GEC-Version": SEC_MS_GEC_VERSION, ConnectionId: connectionId });
    return SYNTHESIS_URL + "?" + q.toString();
  }
  function dateStr() {
    var d = new Date(), days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return days[d.getUTCDay()] + " " + months[d.getUTCMonth()] + " " + p(d.getUTCDate()) + " " + d.getUTCFullYear() + " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) + " GMT+0000 (Coordinated Universal Time)";
  }
  function escXml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16); });
  }

  /* Đọc một đoạn văn bản bằng giọng Edge, trả về Promise<Uint8Array> chứa file MP3.
   * voice: 'vi-VN-NamMinhNeural' (nam) hoặc 'vi-VN-HoaiMyNeural' (nữ).
   * rate: 1.0 = bình thường; 0.9 chậm hơn, 1.15 nhanh hơn.
   */
  function edgeSynth(text, voice, rate) {
    voice = voice || "vi-VN-NamMinhNeural";
    var ratePct = Math.round(((rate || 1) - 1) * 100);
    var rateStr = (ratePct >= 0 ? "+" : "") + ratePct + "%";
    var ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='" + voice + "'><prosody pitch='+0Hz' rate='" + rateStr + "' volume='+0%'>" + escXml(text) + "</prosody></voice></speak>";
    var reqId = uuid();
    return new Promise(function (resolve, reject) {
      var chunks = [], done = false, ws, timer;
      function fail(msg) { if (done) return; done = true; try { ws && ws.close(); } catch (e) {} clearTimeout(timer); reject(new Error(msg)); }
      function ok() { if (done) return; done = true; clearTimeout(timer); try { ws.close(); } catch (e) {} var total = 0, i; for (i = 0; i < chunks.length; i++) total += chunks[i].length; var out = new Uint8Array(total), off = 0; for (i = 0; i < chunks.length; i++) { out.set(chunks[i], off); off += chunks[i].length; } resolve(out); }
      timer = setTimeout(function () { fail("Edge TTS: hết 20 giây vẫn chưa có tiếng trả về"); }, 20000);
      try { ws = new WebSocket(synthUrl()); } catch (e) { fail("Edge TTS: không mở được kết nối (" + e.message + ")"); return; }
      ws.binaryType = "arraybuffer";
      ws.onopen = function () {
        try {
          ws.send("X-Timestamp:" + dateStr() + "\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":{\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"false\"},\"outputFormat\":\"audio-24khz-48kbitrate-mono-mp3\"}}}}\r\n");
          ws.send("X-RequestId:" + reqId + "\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:" + dateStr() + "Z\r\nPath:ssml\r\n\r\n" + ssml);
        } catch (e) { fail("Edge TTS: không gửi được yêu cầu (" + e.message + ")"); }
      };
      ws.onmessage = function (ev) {
        try {
          if (typeof ev.data === "string") {
            if (ev.data.indexOf("Path:turn.end") !== -1) { if (chunks.length) ok(); else fail("Edge TTS: máy chủ trả về nhưng không có tiếng"); }
            return;
          }
          var buf = new Uint8Array(ev.data);
          if (buf.length < 2) return;
          var hl = (buf[0] << 8) | buf[1];
          if (hl + 2 > buf.length) return;
          var head = "";
          for (var i = 2; i < 2 + hl; i++) head += String.fromCharCode(buf[i]);
          if (head.indexOf("Path:audio") === -1) return;
          var audio = buf.slice(2 + hl);
          if (audio.length) chunks.push(audio);
        } catch (e) { fail("Edge TTS: lỗi xử lý tiếng trả về (" + e.message + ")"); }
      };
      ws.onerror = function () { fail("Edge TTS: kết nối bị từ chối (máy chủ không chấp nhận giọng này lúc này)"); };
      ws.onclose = function () { if (!done) { if (chunks.length) ok(); else fail("Edge TTS: kết nối đóng mà chưa có tiếng"); } };
    });
  }

  var api = { edgeSynth: edgeSynth, secMsGec: secMsGec, synthUrl: synthUrl, VI_MALE: "vi-VN-NamMinhNeural", VI_FEMALE: "vi-VN-HoaiMyNeural" };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EdgeTTS = api;
})(typeof window !== "undefined" ? window : globalThis);
