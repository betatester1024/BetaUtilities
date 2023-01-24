export function  replyMessage(content, sender, data, i) {
  content = content.toLowerCase();
  if (content.match ("@"+SYSTEMNICK.toLowerCase())) {
    db.get("PINGCOUNT").then((value) => { db.set("PINGCOUNT", value + 1) });
  }
  console.log(content);
  if (content == "!conjure @" + SYSTEMNICK.toLowerCase()) {
    setTimeout(()=>{sockets[i].close()}, 120);
    return "/me rölls bÿ and spontaneously combusts";
  }
  if (content == "!reboot @" + SYSTEMNICK.toLowerCase()) {
    setTimeout(()=>{sockets[i].close()}, 120);
    return "/me is rebooting";
  }
  if (content.match(/^!testfeature$/gimu)) return "@" + sender;
  if (content.match("^!uptime @" + SYSTEMNICK.toLowerCase() + "$", "gmiu")) {
    let timeElapsed = Date.now() - STARTTIME[i];
    let date = new Date(Date.now());
    return (
      "/me has been up since " +
      date.getFullYear() +
      "-" +
      format(date.getMonth() + 1) +
      "-" +
      format(date.getDate()) +
      " (It's been " +
      formatTime(timeElapsed) +
      ")"
    );
  }
  if (content.match("!version[ ]+@"+SYSTEMNICK.toLowerCase())) {
    console.log("AAAAA")
    return VERSION;
  }
  if (content.match("(!help[ ]+@" + SYSTEMNICK.toLowerCase() + "$|^[ ]+!help[ ]+$)|!contact", "gmiu") != null) {
    if (CALLSTATUS[i] == 6) return "You're currently on hold! A moment, please."
    CALLSTATUS[i] = 0;
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    return "Welcome to BetaOS support! Press :one: to connect! Press :zero: to end call at any time.";
  }
  if (CALLSTATUS[i] == 0 && (content == "2" || content == ":two:" || content == "two")) {
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    CALLSTATUS[i] = 3;
    return "Are you sure you would like to proceed? Press :two: to continue.";
  }
  if (CALLSTATUS[i] == 3 && (content == "2" || content == ":two" || content == "two")) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = -1;
    const encr = process.env['SystemEncrypted'];
    console.log(encr);
    return encr;
  }
  if (content.match("^!runstats [ ]*@" + SYSTEMNICK.toLowerCase(), "gimu")) {
    console.log("match")
    db.get("RUNCOUNT").then((value) => {
      RUNCOUNT = value;
      db.get("PINGCOUNT").then((value2) => {
        PINGCOUNT = value2;
        let reply =
          `{"type":"send", "data":
          {"content":
            "`+ "Run count: " + RUNCOUNT + "\\nPing count: " + PINGCOUNT + `"
          ,"parent":"` +
          data["data"]["id"] +
          `"}}`;
        sockets[i].send(reply);
      })
    });
    return "Loading..."
  }
  if (content.match(/^!potato$/)) return "potato.io";

  if (content.match("^!src @" + SYSTEMNICK.toLowerCase() + "$", "guim"))
    return (
      "!tell @betatester1024 user @" +
      data["data"]["sender"]["name"] +
      " requests source-code access."
    );
  let exp = /^((?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?)$/
  let exp2 = /^!unblock [ ]+((?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?)$/
  let match = CALLSTATUS[i] == 2 ? content.match(exp, "i") : content.match(exp2, "i");
  if (match) {
    CALLSTATUS[i] = -1;
    clearTimeout(CALLRESET[i]);
    if (match[1].substring(0, 4) == "https://")
      return "https://womginx.betatester1024.repl.co/main/" + match[1] +
        "\\n[NEW] The FIREFOX-ON-REPLIT may provide more reliable unblocking! > https://replit.com/@betatester1024/firefox#main.py";
    else
      return "https://womginx.betatester1024.repl.co/main/https://" + match[1] +
        "\\n[NEW] The FIREFOX-ON-REPLIT may provide more reliable unblocking! > https://replit.com/@betatester1024/firefox#main.py";

  }
  if (content == "!rating @" + SYSTEMNICK.toLowerCase()) {
    db.get("SUM").then((value) => {
      db.get("CT").then((value2) => {
        let r = "Current @" + SYSTEMNICK + " rating - " + (value / value2).toFixed(2);
        let reply =
          `{"type":"send", "data":{"content":"` + r + `",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        console.log(reply);
        sockets[i].send(reply);
      })
    }); return "";
  }
  if (content.match("^!die$", "gmiu")) {
    setTimeout(()=>{sockets[i].close()}, 120);
    return "aaaaghhh! death! blood! i'm dying!";
  }
  if (content == "!activerooms @"+SYSTEMNICK.toLowerCase()) {
    let str = "/me is in: ";
    for (let j = 0; j < sockets.length - 1; j++) { str += "&" + rooms[j] + ", "; }
    str += "and &" + rooms[sockets.length - 1] + "!";
    return str;
  }
  if (content == "!pong"||content=="!pong @"+SYSTEMNICK.toLowerCase()) {
    let reply =
      `{"type":"send", "data":{"content":"` +
      "FUCK" +
      `",
    "parent":"` +
      data["data"]["id"] +
      `"}}`;
    setTimeout(()=>{sockets[i].send(reply)}, 1000);
    return "pang!";
  }
  if (
    CALLSTATUS[i] == 0 &&
    (content == ":one:" || content == "one" || content == "1")
  ) {
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    CALLSTATUS[i] = 1;
    return "Welcome to the BetaOS Call services! Enter :one: to inquire about our services. " +
      "Enter :two: to speak to a manager. " +
      "Composez le :three: pour service en français. " +
      "Press :four: for direct access to the code. " +
      "Press :five: to unblock a link manually. " +
      "Press :six: for more information about the creator. " +
      "Press :seven: to enter your access code. " +
      "Press :eight: to provide feedback on our calling services! " +
      "Press :nine: for more options. \\n" +
      "Press :zero: to end call at any time.";
  }
  if (
    CALLSTATUS[i] == 1 &&
    (content == ":one:" || content == "one" || content == "1")
  ) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = -1;
    return (
      "Important commands: !ping, !help, !pause, !restore, !kill, !pong, !uptime, !uuid. \\n " +
      "Bot-specific commands: !unblock <LINK>; !potato, !src @" +
      SYSTEMNICK.toLowerCase() +
      "; !runStats !testfeature, !creatorinfo, !version, !activeRooms, !die "
    );
  }
  if (
    CALLSTATUS[i] == 1 &&
    (content == ":two:" || content == "two" || content == "2")
  ) {
    // calling the manager doesn't work.
    clearTimeout(CALLRESET[i]);
    setTimeout(() => {
      let reply =
        `{"type":"send", "data":{"content":"/me crashes",
      "parent":"` +
        data["data"]["id"] +
        `"}}`;
      sockets[i].send(reply);
      db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
      socketclose(i);
    }, 3000);
    CALLSTATUS[i] = 99;
    return "Connecting you to a human now.";
  }
  if (
    CALLSTATUS[i] == 1 &&
    (content == ":three:" || content == "three" || content == "3")
  ) {
    clearTimeout(CALLRESET[i]);
    setTimeout(() => {
      let reply =
        `{"type":"send", "data":{"content":"/me est en panne D:",
      "parent":"` +
        data["data"]["id"] +
        `"}}`;
      sockets[i].send(reply);
      db.get("RUNCOUNT").then((value) => { db.set("RUNCOUNT", value + 1) });
      socketclose(i);
    }, 500);
    CALLSTATUS[i] = 99;
    return "Bienvenue aux systèmes BétaOS. Téléchargement en cours des commandes disponibles, un moment SVP.";
  }
  if (
    CALLSTATUS[i] == 1 &&
    (content == ":four:" || content == "four" || content == "4")
  ) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = -1;
    return "> Source code: https://replit.com/@betatester1024/BetaUtilities#index.js"
  }
  if (CALLSTATUS[i] == 1 && (content == ":five:" || content == "five" || content == "5")) {
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    CALLSTATUS[i] = 2;
    return "We're listening."
  }
  if (content == "!creatorinfo" || CALLSTATUS[i] == 1 && (content == ":six:" || content == "six" || content == "6")) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = -1;
    return "BetaUtilities, created by @betatester1024.\\nVersion: " + VERSION + "\\n" +
      "Hosted on repl.it free hosting; Only online when the creator is. \\n" +
      "Unblockers forked by @betatester1024 and should be able to automatically come online.\\n" +
      ":white_check_mark: BetaOS services ONLINE";
  }
  if (CALLSTATUS[i] == 1 && (content == ":seven:" || content == "seven" || content == "7")) {
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    CALLSTATUS[i] = 7;
    return "We're listening."
  }
  if (CALLSTATUS[i] == 7) {
    CALLSTATUS[i] = -1;
    if (content == serviceKey) return serviceResponse;
    else return "AccessRequest Failed"
  }
  if (CALLSTATUS[i] == 1 && (content == ":nine:" || content == "nine" || content == "9")) {
    CALLSTATUS[i] = 6;
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      let r = "/me We are currently experiencing high call volumes. Response times may be higher than average."
      let reply =
        `{"type":"send", "data":{"content":"` + r + `",
      "parent":"` +
        data["data"]["id"] +
        `"}}`;
      sockets[i].send(reply);
      CALLRESET[i] = setTimeout(() => {
        let r = `Press :one: to reboot services. Press :two: to play wordle!`;
        let reply =
          `{"type":"send", "data":{"content":"` + r + `",
        "parent":"` +
          data["data"]["id"] +
          `"}}`;
        console.log(reply);
        sockets[i].send(reply);
        CALLSTATUS[i] = 5;
      }, Math.random() * 5000 + 2000);
    }, Math.random() * 15000 + 5000);
    return "You've been put on hold. Press :zero: to exit support at any time.";
  }
  if (CALLSTATUS[i] == 1 && (content == ":eight:" || content == "eight" || content == "8")) {
    CALLSTATUS[i] = 4;
    clearTimeout(CALLRESET[i]);
    CALLRESET[i] = setTimeout(() => {
      resetCall(data, i);
    }, CALLTIMEOUT);
    return "Please rate our services from one to five.";
  }
  if (CALLSTATUS[i] == 4) {
    let dv = 0;
    if (content == ":one:" || content == "one" || content == "1") dv = 1;
    if (content == ":two:" || content == "two" || content == "2") dv = 2;
    if (content == ":three:" || content == "three" || content == "3") dv = 3;
    if (content == ":four:" || content == "four" || content == "4") dv = 4;
    if (content == ":five:" || content == "five" || content == "5") dv = 5;

    db.get("SUM").then((value) => {
      db.get("CT").then((value2) => {
        db.set("SUM", value + dv);
        db.set("CT", value2 + 1);
      })
    });
    CALLSTATUS[i] = -1;
    return "Thank you for providing a rating! ";
  }
  if (CALLSTATUS[i] == 5 && (content == "one" || content == "1" || content == ":one:")) {
    clearTimeout(CALLRESET[i]);
    setTimeout(()=>{sockets[i].close()}, 120);
    return "/me reboots";
  }
  if (content == "!wordle"||CALLSTATUS[i] == 5 && (content == "two" || content == "2" || content == ":two:")) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = 8;
    return "Enter any 5-letter word. Press :zero: to exit.";
  }
  if (CALLSTATUS[i] == 8 && content.match("^[a-z]{5}$")) {
    if (allWords.indexOf(content)>=0) {
      let correctWord = validWords[todayWordID].split("");
      let out = "";
      if (content == validWords[todayWordID]) return "Correct word!"
      for (let i=0; i<5; i++) {
        if (content.charAt(i) == correctWord[i]) out += "🟩";
        else if (correctWord.indexOf(content.charAt(i))>=0) out += "🟨";
        else out += "🟥"
      }
      return out;
    }
    else return "That's not a word!";
  }
  if (CALLSTATUS[i] != -1 && (content == "zero" || content == "0" || content == ":zero:")) {
    clearTimeout(CALLRESET[i]);
    CALLSTATUS[i] = -1;
    return "[CALLEND] Thank you for calling BetaOS services!"
  }
  if (content.match("@" + SYSTEMNICK.toLowerCase() + "$", "gmiu")) {
    return "Yes?";
  }

  else return "";
}