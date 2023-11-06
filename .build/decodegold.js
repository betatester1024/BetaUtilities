"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var decodegold_exports = {};
__export(decodegold_exports, {
  maybeGold: () => maybeGold,
  processHeimMessage: () => processHeimMessage,
  scramble: () => scramble
});
module.exports = __toCommonJS(decodegold_exports);
const { subtle } = require("node:crypto").webcrypto;
const getRandomValues = require("get-random-values");
function processHeimMessage(cnt, callback) {
  if (!maybeGold(cnt))
    return;
  descramble(cnt, function(result) {
    if (!result)
      return;
    callback(result);
  });
}
var CHARS = {
  header: "\u2029\u2028\u2029",
  footer: "\u2029",
  sep: "\u2028",
  0: " ",
  1: "\xA0",
  2: "\u2000",
  3: "\u2001",
  4: "\u2002",
  5: "\u2003",
  6: "\u2004",
  7: "\u2005",
  8: "\u2006",
  9: "\u2007",
  10: "\u2008",
  11: "\u2009",
  12: "\u200A",
  13: "\u202F",
  14: "\u205F",
  15: "\u3000"
};
var BICHARS = [], REVCHARS = {}, REVBICHARS = {};
for (var i = 0; i < 16; i++) {
  REVCHARS[CHARS[i]] = i;
}
for (var i = 0; i < 256; i++) {
  BICHARS.push(CHARS[i / 16 | 0] + CHARS[i % 16]);
  REVBICHARS[BICHARS[i]] = i;
}
var KEYS = [
  "g/y/LGqUpu/gBg01wjPPWh2fUc3uRdeJJoPEeq418In6gjFffK/f8Pl9BCBlHUzI",
  "yubJD1jCulqbRE4SHyxV9qSYJ+5dyJKqeZEC2Dh4dsKVQ6k7Isgnn1Pb5ciFCEJ2",
  "q7iCW1SvGRiJapQKGuy8AF9X+ZgsIrDfX4hFas1JJSPpQ/tHtq8xjz3lgaftP1+b"
];
var CURKEY = KEYS.length - 1;
function atob_u8(s) {
  return decodeURIComponent(escape(s));
}
function btoa_u8(s) {
  return unescape(encodeURIComponent(s));
}
function str2arr(s) {
  var cs = btoa_u8(s);
  var ret = new ArrayBuffer(cs.length);
  var view = new Uint8Array(ret);
  for (var i = 0; i < view.length; i++)
    view[i] = cs.charCodeAt(i);
  return ret;
}
function arr2str(a) {
  var cs = "";
  var view = new Uint8Array(a);
  for (var i = 0; i < view.length; i++)
    cs += String.fromCharCode(view[i]);
  return atob_u8(cs);
}
function unpackMessage(s) {
  function unpackInt(s2) {
    if (!s2.length)
      return null;
    var ret = 0;
    for (var i = 0; i < s2.length; i++) {
      var c = REVCHARS[s2[i]];
      if (c == void 0)
        return null;
      ret = (ret << 4) + c;
    }
    return ret;
  }
  function unpackBinary(s2) {
    if (!s2.length || s2.length % 2)
      return null;
    var ret = new ArrayBuffer(s2.length / 2);
    var view = new Uint8Array(ret);
    for (var i = 0; i < view.length; i++) {
      var n = REVBICHARS[s2.substr(i * 2, 2)];
      if (n == void 0)
        return null;
      view[i] = n;
    }
    return ret;
  }
  if (s.substr(0, 3) != CHARS.header)
    return null;
  if (s.substr(-1, 1) != CHARS.footer)
    return null;
  var data = s.substring(3, s.length - 1).split(CHARS.sep);
  if (data.length != 3)
    return null;
  var variant = unpackInt(data[0]), key = unpackBinary(data[1]), payload = unpackBinary(data[2]);
  if (variant == null || key == null || payload == null)
    return null;
  return { variant, key, payload };
}
function packMessage(message) {
  function packInt(n) {
    var ret = "";
    do {
      ret = CHARS[n % 16] + ret;
      n = n / 16 | 0;
    } while (n);
    return ret;
  }
  function packBinary(b) {
    var ret = "", view = new Uint8Array(b);
    for (var i = 0; i < view.length; i++)
      ret += BICHARS[view[i]];
    return ret;
  }
  var packed = [
    packInt(message.variant),
    packBinary(message.key),
    packBinary(message.payload)
  ];
  return CHARS.header + packed.join(CHARS.sep) + CHARS.footer;
}
function cipherParams(message) {
  if (message.variant == void 0)
    message.variant = CURKEY;
  if (!message.key) {
    message.key = new ArrayBuffer(48);
    getRandomValues(new Uint8Array(message.key));
  }
  var key = KEYS[message.variant];
  if (typeof key == "string") {
    var deckey = atob(key);
    key = new ArrayBuffer(deckey.length);
    for (var i = 0; i < key.length; i++)
      key[i] = deckey.charCodeAt(i);
    KEYS[message.variant] = key;
  }
  return subtle.importKey(
    "raw",
    KEYS[message.variant],
    { name: "HMAC", hash: { name: "SHA-384" } },
    false,
    ["sign"]
  ).then(function(skey) {
    return subtle.sign({ name: "HMAC" }, skey, message.key);
  }).then(function(array) {
    return subtle.importKey(
      "raw",
      array.slice(0, 32),
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    ).then(function(key2) {
      let iv = array.slice(32, 48);
      return { k: key2, i: iv };
    });
  });
}
function descrambleMessage(msg) {
  return cipherParams(msg).then(function(params) {
    return subtle.decrypt(
      { name: "AES-GCM", iv: params.i },
      params.k,
      msg.payload
    ).then(function(res) {
      return arr2str(res);
    });
  });
}
function scrambleMessage(msg) {
  return cipherParams(msg).then(function(params) {
    return subtle.encrypt(
      { name: "AES-GCM", iv: params.i },
      params.k,
      str2arr(msg.text)
    );
  });
}
function descramble(data, callback) {
  var msg = unpackMessage(data);
  if (!msg) {
    if (callback)
      callback(null);
    return Promise.reject(new Error("Bad message"));
  }
  return descrambleMessage(msg).then(function(data2) {
    if (callback)
      callback(data2);
    return data2;
  }).catch(function(reason) {
    if (callback)
      callback(null);
    console.log(reason);
    return reason;
  });
}
function scramble(text, callback) {
  var msg = { text };
  return scrambleMessage(msg).then(function(res) {
    msg.payload = res;
    var fin = packMessage(msg);
    if (callback)
      callback(fin);
    return fin;
  });
}
function maybeGold(text) {
  return text && text.substr(0, 3) == CHARS.header && text.substr(-1, 1) == CHARS.footer;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  maybeGold,
  processHeimMessage,
  scramble
});
//# sourceMappingURL=decodegold.js.map
