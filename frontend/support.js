function onLoad() {
  // send(JSON.stringify({action:"refresh"}), (res)=>{
  // });
  // send(JSON.stringify({action:"refresh_users"}), (res)=>{
  // });
  document.getElementById("header").innerHTML = "Support: #"+
    document.URL.match("\\?room=(.*)")[1];
  ROOMNAME = document.URL.match("\\?room=(.*)")[1];
}
// system refresh auto!
function sendMsg() {
  let inp = document.getElementById("msgInp");
  send(JSON.stringify({action:"sendMsg", data:{msg:inp.value, room:ROOMNAME}}), ()=>{});
  inp.value="";
}
let LOADEDQ2 = false;
const rmvReg = /(>|^)\-(.+)\([0-9]\)>/gm;
const addReg = /(>|^)\+(.+)\([0-9]\)>/gm;
const classStr = ["error", "user", "admin", "superadmin"]
async function initClient()
{
  
  try {
  console.log("Starting client.")
  const source = new EventSource('/stream?room='+
                                 document.URL.match("\\?room=([0-9a-zA-Z\\-_]{1,20})$")[1]);
  source.addEventListener('message', message => {
    console.log('Got', message);
    ele = document.getElementById("userList");
    let modif = message.data;
    document.getElementById("placeholder").style.display="none";

    let removed = rmvReg.exec(modif);
    let added = addReg.exec(modif)
    while (removed || added) {
      if (removed) {
        ele.innerText= ele.innerText.replace(removed[2]+"\n", "");
      }
      if (added) {
        ele.innerText+= added[2]+"\n";
      }
      modif = modif.replaceAll(rmvReg, "");
      modif = modif.replaceAll(addReg, "");
      removed = modif.match(rmvReg);
      added = modif.match(addReg);
    }
    ele = document.getElementById("msgArea");
    let scrDistOKQ =  (ele.scrollTop) >= (ele.scrollHeight-ele.offsetHeight - 100)
    let msgs = modif.split(">");
    for (let i=0; i<msgs.length; i++) {
      let matches = msgs[i].match(/\[(.+)\]\(([0-9])\)(.*)/)
      if (!matches) continue;
      let newMsgBody = document.createElement("p");
      let newMsgSender = document.createElement("b");
      // parse things
      newMsgSender.innerText = matches[1];
      newMsgSender.className = classStr[matches[2]];
      ele.appendChild(newMsgSender);
      newMsgBody.className = classStr[matches[2]];
      let msg = matches[3].replaceAll("&gt;", ">");
      // start replacing emojis
      for (let j=0; j<replacements.length; j++) {
        let regex = new RegExp(replacements[j].from, "gmiu");
        while ((arr = regex.exec(msg)) !== null) {
          console.log(`Found ${arr[0]}. `, arr.index);
          let fragment = document.createElement("span");
          fragment.className = classStr[matches[2]];
          fragment.innerText = msg.slice(0, arr.index);
          ele.appendChild(fragment);
          let replaced = document.createElement("span");
          replaced.className="material-symbols-outlined supportMsg "+classStr[matches[2]];
          replaced.innerText = replacements[j].to;
          console.log(replaced);
          ele.appendChild(replaced);
          msg = msg.slice(arr.index+replacements[j].from.length);
        }
      } // for replacements
      regex = new RegExp("(#[0-9a-zA-Z_\\-]{1,20})", "gmiu");
      while ((arr=regex.exec(msg))!== null) {
        console.log(`Found ${arr[0]}. `, arr.index);
        let fragment = document.createElement("span");
        fragment.className = classStr[matches[2]];
        fragment.innerText = msg.slice(0, arr.index);
        ele.appendChild(fragment);
        let replaced = document.createElement("a");
        replaced.className=classStr[matches[2]];
        replaced.href="/support?room="+arr[1].slice(1);
        replaced.innerText = arr[1];
        ele.appendChild(replaced);
        msg = msg.slice(arr.index+arr[1].length);
      } // link detection
      newMsgBody.innerText = msg;
      
      ele.appendChild(newMsgBody);
      ele.appendChild(document.createElement("br"));
    } // 
    
    if (!LOADEDQ2 || scrDistOKQ)
    {
      ele.scrollTop = ele.scrollHeight;
      // console.log("Scrolling to bottom.")
      LOADEDQ2 = true;
    }

    
  });
  } catch (e) {
    console.log("Restartng client ("+e+")")
    setTimeout(initClient, 0);
  }
} // initClient();


const replacements = [
  {from:":one:", to:"looks_one"},
  {from:":two:", to:"looks_two"},
]