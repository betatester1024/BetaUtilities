"use strict";
let reply = `{"type":"send", "data":{"content":"` + r + `","parent":"` + data["data"]["id"] + `"}}`;
sockets[i].send(reply);
//# sourceMappingURL=replytemplate.js.map
