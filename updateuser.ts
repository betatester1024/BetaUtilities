import { WS } from "./wsHandler";
export function updateuser() {
  WS.db.set("betatester1024", "ADMIN");
  WS.db.set("betatester1024^PERM", "2");
  WS.db.set("user", "pass");
  WS.db.set("user^PERM", "1");
}