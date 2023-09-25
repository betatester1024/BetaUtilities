/// THIS IS NOT BetaOS CODE ///
// but i moved some stuff around
// maybe copyright? leet.nu

const {subtle} =  require('node:crypto').webcrypto;
// console.log(subtle);
const getRandomValues = require("get-random-values");
// this is the one you want
export function processHeimMessage(cnt, callback) {
  // var cnt = msg.get('content');
  if (! maybeGold(cnt)) return;
  descramble(cnt, function(result) {
    if (! result) return;
    callback(result);
  });
}

// Tuck all variables away.
// Where to get additional resources from.
// var ORIGIN = 'https://euphoria.leet.nu/gold';
// Ancillary data for encoding.
var CHARS = {
  header: '\u2029\u2028\u2029', footer: '\u2029', sep: '\u2028',
   0: '\u0020',  1: '\u00a0',  2: '\u2000',  3: '\u2001',
   4: '\u2002',  5: '\u2003',  6: '\u2004',  7: '\u2005',
   8: '\u2006',  9: '\u2007', 10: '\u2008', 11: '\u2009',
  12: '\u200a', 13: '\u202f', 14: '\u205f', 15: '\u3000'
};
var BICHARS = [], REVCHARS = {}, REVBICHARS = {};
for (var i = 0; i < 16; i++) {
  REVCHARS[CHARS[i]] = i;
}
for (var i = 0; i < 256; i++) {
  BICHARS.push(CHARS[i / 16 | 0] + CHARS[i % 16]);
  REVBICHARS[BICHARS[i]] = i;
}
// Cryptographic keys.
var KEYS = [
  'g/y/LGqUpu/gBg01wjPPWh2fUc3uRdeJJoPEeq418In6gjFffK/f8Pl9BCBlHUzI',
  'yubJD1jCulqbRE4SHyxV9qSYJ+5dyJKqeZEC2Dh4dsKVQ6k7Isgnn1Pb5ciFCEJ2',
  'q7iCW1SvGRiJapQKGuy8AF9X+ZgsIrDfX4hFas1JJSPpQ/tHtq8xjz3lgaftP1+b'
];
var CURKEY = KEYS.length - 1;


// Utilities:
// Decode UTF-8 to "binary" (Unicode).
function atob_u8(s) {
  return decodeURIComponent(escape(s));
}
// Encode "binary" (Unicode) to UTF-8.
function btoa_u8(s) {
  return unescape(encodeURIComponent(s));
}
// Convert a string to a UTF-8 ArrayBuffer.
function str2arr(s) {
  var cs = btoa_u8(s);
  var ret = new ArrayBuffer(cs.length);
  var view = new Uint8Array(ret);
  for (var i = 0; i < view.length; i++)
    view[i] = cs.charCodeAt(i);
  return ret;
}
// Convert a UTF-8 ArrayBuffer to a string.
function arr2str(a) {
  var cs = '';
  var view = new Uint8Array(a);
  for (var i = 0; i < view.length; i++)
    cs += String.fromCharCode(view[i]);
  return atob_u8(cs);
}
// Unpack a message (without decrypting).
function unpackMessage(s) {
  // Unpack an integer.
  function unpackInt(s) {
    if (! s.length) return null;
    var ret = 0;
    for (var i = 0; i < s.length; i++) {
      var c = REVCHARS[s[i]];
      if (c == undefined) return null;
      ret = (ret << 4) + c;
    }
    return ret;
  }
  // Unpack a binary blob into a buffer.
  function unpackBinary(s) {
    if (! s.length || s.length % 2) return null;
    var ret = new ArrayBuffer(s.length / 2);
    var view = new Uint8Array(ret);
    for (var i = 0; i < view.length; i++) {
      var n = REVBICHARS[s.substr(i * 2, 2)];
      if (n == undefined) return null;
      view[i] = n;
    }
    return ret;
  }
  // Check headers/footers; extract payload.
  if (s.substr(0, 3) != CHARS.header) return null;
  if (s.substr(-1, 1) != CHARS.footer) return null;
  var data = s.substring(3, s.length - 1).split(CHARS.sep);
  // Layout: Variant (number) | Key (48B) | Payload (n * 16B)
  if (data.length != 3) return null;
  var variant = unpackInt(data[0]), key = unpackBinary(data[1]),
      payload = unpackBinary(data[2]);
  if (variant == null || key == null || payload == null) return null;
  return {variant: variant, key: key, payload: payload};
}
// Pack a message
function packMessage(message) {
  // Pack an integer.
  function packInt(n) {
    var ret = '';
    do {
      ret = CHARS[n % 16] + ret;
      n = n / 16 | 0;
    } while (n);
    return ret;
  }
  // Pack a binary blob.
  function packBinary(b) {
    var ret = '', view = new Uint8Array(b);
    for (var i = 0; i < view.length; i++)
      ret += BICHARS[view[i]];
    return ret;
  }
  var packed = [packInt(message.variant), packBinary(message.key),
                packBinary(message.payload)];
  return CHARS.header + packed.join(CHARS.sep) + CHARS.footer;
}
// Return a Promise of a key and IV derived from (or generated in-place for)
// the given message.
function cipherParams(message) {
  // Assign a version if necessary.
  if (message.variant == undefined)
    message.variant = CURKEY;
  // Create fresh key if necessary.
  if (! message.key) {
    message.key = new ArrayBuffer(48);
    getRandomValues(new Uint8Array(message.key));
  }
  // Convert master key if necessary.
  var key = KEYS[message.variant];
  if (typeof key == 'string') {
    var deckey = atob(key);
    key = new ArrayBuffer(deckey.length);
    for (var i = 0; i < key.length; i++) key[i] = deckey.charCodeAt(i);
    KEYS[message.variant] = key;
  }
  // Compute the HMAC-SHA384 of the message's key with the given secret key
  // and generate a AES-256-GCM key along with an IV from that, and return
  // a Promise wrapping the result.
  return subtle.importKey('raw', KEYS[message.variant],
    {name: 'HMAC', hash: {name: 'SHA-384'}}, false, ['sign']
  ).then(function(skey) {
    return subtle.sign({name: 'HMAC'}, skey, message.key);
  }).then(function(array) {
    return subtle.importKey('raw', array.slice(0, 32),
      {name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']
    ).then(function(key) {
      let iv = array.slice(32, 48);
      return {k: key, i: iv};
    });
  });
}
// Return a Promise of descrambling the given message.
function descrambleMessage(msg) {
  return cipherParams(msg).then(function(params) {
    return subtle.decrypt({name: 'AES-GCM', iv: params.i},
        params.k, msg.payload).then(function(res) {
      return arr2str(res);
    });
  });
}
// Insert parameters into the given message as needed and return a Promise
// of scrambling it.
function scrambleMessage(msg) {
  return cipherParams(msg).then(function(params) {
    return subtle.encrypt({name: 'AES-GCM', iv: params.i},
      params.k, str2arr(msg.text));
  });
}
// High-level functions:
// Decrypt the message.
function descramble(data, callback) {
  // console.log(data);
  var msg = unpackMessage(data);
  // console.log(msg);
  if (! msg) {
    if (callback) callback(null);
    return Promise.reject(new Error('Bad message'));
  }
  return descrambleMessage(msg).then(function(data) {
    if (callback) callback(data);
    return data;
  }).catch(function(reason) {
    if (callback) callback(null);
    console.log(reason);
    return reason;
  });
}
// Encrypt the message.
export function scramble(text, callback) {
  var msg = {text: text};
  return scrambleMessage(msg).then(function(res) {
    msg.payload = res;
    var fin = packMessage(msg);
    if (callback) callback(fin);
    return fin;
  });
}
// Check if a message might be a Gold one.
export function maybeGold(text) {
  return (text && text.substr(0, 3) == CHARS.header &&
          text.substr(-1, 1) == CHARS.footer);
}
