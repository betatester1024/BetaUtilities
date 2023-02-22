
// import {hashSync} from "bcrypt-ts";
var bcrypt = require("bcrypt");
import { WS } from "./wsHandler";
export function updateuser() {
  WS.db.set("betatester1024", bcrypt.hashSync(process.env['betatester1024'] as string, 8));
  WS.db.set("betatester1024^PERM", "3");
  WS.db.set("user", bcrypt.hashSync("pass", 8));
  WS.db.set("user^PERM", "1");
}