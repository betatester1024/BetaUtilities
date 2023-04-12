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
  let match = inp.value.match("^!alias @(.+)");
  if (match) {
    source.close();
    
    document.getElementById("userList").innerHTML = ``;
    send(JSON.stringify({action:"realias", data:{alias:match[1]}}), (res)=>{
      if (res.status != "SUCCESS") alertDialog("ERROR: "+res.data.error, ()=>{});
      else alertDialog("Updated alias!", ()=>{
        document.getElementById("msgArea").innerHTML = `<h2 id="placeholder">
        <span class="material-symbols-outlined">update</span> 
        Reloading your messages, a moment please...</h2>`;
        initClient();
      });
    });
  }
  else send(JSON.stringify({action:"sendMsg", data:{msg:inp.value, room:ROOMNAME}}), ()=>{});
  inp.value="";
}
let LOADEDQ2 = false;
const rmvReg = /(>|^)\-(.+)\([0-9]\)>/gm;
const addReg = /(>|^)\+(.+)\([0-9]\)>/gm;
const classStr = ["error", "user", "admin", "superadmin"]
let source = null;
async function initClient()
{
  
  try {
  console.log("Starting client.")
  source = new EventSource('/stream?room='+
                                 document.URL.match("\\?room=([0-9a-zA-Z\\-_]{1,20})$")[1]);
  source.addEventListener('message', message => {
    console.log('Got', message);
    ele = document.getElementById("userList");
    let modif = message.data;
    

    let removed = rmvReg.exec(modif);
    let added = addReg.exec(modif)
    while (removed || added) {
      if (removed) {
        ele.innerHTML= ele.innerHTML.replace(removed[2]+"<br>", "");
      }
      if (added) {
        ele.innerHTML+= added[2]+"<br>";
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
      let msg = " "+matches[3].replaceAll("&gt;", ";gt;");
      for (let i=0; i<replacements.length; i++) {
        msg = msg.replaceAll(`:${replacements[i].from}:`, ">EMOJI"+replacements[i].to+">");
      }
      let slashMe = false;
      msg = msg.replaceAll(/(&[a-zA-Z0-9]{1,20}[^;])/gm,">ROOM$1>")
      msg = msg.replaceAll(/(#[a-zA-Z0-9_\-]{1,20}[^;])/gm,">SUPPORT$1>")
      msg = msg.replaceAll(/((http|ftp|https):\/\/)?(?<test>([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-]))/gmiu,">LINK$<test>>")
      msg = msg.replaceAll(/(`.*`)/gm,">CODE$1>")
      if (msg.match("/me.*")) {
        msg = msg.slice(4);
        slashMe = true;
      }
      
      let split = msg.split(">");
      // console.log("message fragments:", split.length, split);
      let out= "";
      for (let i=0; i<split.length; i++) {
        if (i%2 == 0) {
          let fragment = document.createElement("p");
          fragment.className = classStr[matches[2]] + (slashMe?" slashMe ":"");
          fragment.innerText = split[i].replaceAll(";gt;", ">");
          ele.appendChild(fragment);
        }
        else {
          let pref = split[i].match("^(EMOJI|LINK|ROOM|SUPPORT|CODE)")[1];
          let post = split[i].match("^(EMOJI|LINK|ROOM|SUPPORT|CODE)(.+)")[2];
          if (pref == "EMOJI") {
            let replaced = document.createElement("span");
            replaced.title = ":"+findReplacement(post)+":";
            replaced.className="material-symbols-outlined supportMsg "+classStr[matches[2]] + (slashMe?" slashMe ":"");
            replaced.innerText = post;
            ele.appendChild(replaced);
          }
          else if (pref == "LINK") {
            let replaced = document.createElement("a");
            replaced.className="supportMsg "+classStr[matches[2]] + (slashMe?" slashMe ":"");
            replaced.href = "https://"+post;
            replaced.innerText = post;
            ele.appendChild(replaced);
          }
          else if (pref == "ROOM") {
            let replaced = document.createElement("a");
            replaced.className="supportMsg "+classStr[matches[2]] + (slashMe?" slashMe ":"");
            replaced.href = "https://euphoria.io/room/"+post.slice(1);
            replaced.innerText = post;
            ele.appendChild(replaced);
          }
          else if (pref == "SUPPORT") {
            let replaced = document.createElement("a");
            replaced.className="supportMsg "+classStr[matches[2]] + (slashMe?" slashMe ":"");
            replaced.href = "/support?room="+post.slice(1);
            replaced.innerText = post;
            ele.appendChild(replaced);
          }
          else if (pref == "CODE") {
            let replaced = document.createElement("kbd");
            replaced.className="supportMsg "+classStr[matches[2]] + (slashMe?" slashMe ":"");
            // replaced.href = "https://euphoria.io/room/"+post.slice(1);
            replaced.innerText = post;
            ele.appendChild(replaced);
          }
        }
      }
      // let arr2 = msg.split(":");
      // let arr3 = [];
      // let prevColon = false;
      // for (let j=0; j<arr2.length; j++) {
      //   let idx;
      //   arr3.push(false)
      //   for (idx=0; idx<replacements.length && replacements[idx].from!=arr2[j]; idx++);
      //   if (idx<replacements.length && i>0 && !arr3[j-1]) {
      //     arr3[j] = true;
      //     let replaced = document.createElement("span");
      //     replaced.className="material-symbols-outlined supportMsg "+classStr[matches[2]];
      //     replaced.innerText = replacements[idx].to;
      //     ele.appendChild(replaced);
      //   }
      //   else {
      //     msg = (!arr3[j-1]&&i>0?":":"")+arr2[j];
      //     console.log(msg);
      //     regex = new RegExp("(#[0-9a-zA-Z_\\-]{1,20})", "gmiu");
      //     while ((arr=regex.exec(msg))!== null) {
      //       console.log(`Found ${arr[0]}. `, arr.index);
      //       let fragment = document.createElement("span");
      //       fragment.className = classStr[matches[2]];
      //       fragment.innerText = msg.slice(0, arr.index);
      //       ele.appendChild(fragment);
      //       let replaced = document.createElement("a");
      //       replaced.className=classStr[matches[2]];
      //       replaced.href="/support?room="+arr[1].slice(1);
      //       replaced.innerText = arr[1];
      //       console.log(msg);
      //       ele.appendChild(replaced);
      //       msg = msg.slice(arr.index+arr[1].length);
      //     } // link detection
      //     let fragment = document.createElement("span");
      //     fragment.className = classStr[matches[2]];
      //     fragment.innerText = msg;
      //     ele.appendChild(fragment);
      //   }
      // }
      
      // do this sometime soon. 
      // msg = msg.replaceAll("&gt;", ">");
      // start replacing emojis
      // replaceAll(msg, ele, matches);
      // newMsgBody.innerText = msg; // but of course.
      
      // if (split.length <= 2) ele.appendChild(newMsgBody);
      ele.appendChild(document.createElement("br"));
      document.getElementById("placeholder").style.display="none";
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
  {from: "one", to: "counter_1"},
  {from: "two", to: "counter_2"},
  {from: "three", to: "counter_3"},
  {from: "four", to: "counter_4"},
  {from: "five", to: "counter_5"},
  {from: "six", to: "counter_6"},
  {from: "seven", to: "counter_7"},
  {from: "eight", to: "counter_8"},
  {from: "nine", to: "counter_9"},
  {from: "zero", to: "counter_0"},
  {from: "white_check_mark", to: "check_circle"},
  {from: "active", to: "check_circle"},
  {from: "info", to: "info"},
  {from: "confirm", to:"check"},
  {from: "warn", to: "warning"},
  {from: "error", to:"error"},
  {from: "egg", to:"egg_alt"}
]

// function replaceAll(msg, ele, matches) {
//   console.log(msg, ele, matches);
//   for (let j=0; j<replacements.length; j++) {
//     let regex = new RegExp(replacements[j].from, "gmiu");
//     while ((arr = regex.exec(msg)) !== null) {
//       console.log(`Found ${arr[0]}. `, arr.index);
//       let fragment = document.createElement("span");
//       fragment.className = classStr[matches[2]];
//       console.log(msg.slice(0, arr.index));
//       if (msg.slice(0, arr.index)) replaceAll(msg.slice(0, arr.index), ele, matches);
//       let replaced = document.createElement("span");
//       replaced.className="material-symbols-outlined supportMsg "+classStr[matches[2]];
//       replaced.innerText = replacements[j].to;
//       console.log(replaced);
//       ele.appendChild(replaced);
//       msg = msg.slice(arr.index+replacements[j].from.length);
//       console.log(msg);
//     }
//   } // for replacements
// }

function findReplacement(thing) {
  for (let i=0; i<replacements.length; i++) {
    if (replacements[i].to == thing) return replacements[i].from;
  }
}