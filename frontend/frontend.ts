let TIMEOUT:NodeJS.Timeout;
function reset() {
  clearTimeout(TIMEOUT);
}
function restart() {
  onLoad()
}
async function loadFile(filePath:string) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status==200) {
    result = xmlhttp.responseText;
  }
  return result;
} // loadFile
function onLoad(e:any) {
  loadFile("/status/status_raw.html").then((data)=>{
    let statusele = document.getElementById("statStr") as HTMLParagraphElement;
    if (data) statusele.innerHTML = data;
    // console.log(data);
    if (!data || data && data.match("Rooms failed")) 
    {
      // statusele.innerHTML="ServiceFAIL<br>";
      statusele.style.color="#ee0000";
      statusele.className+="ERROR";
      let thing = document.getElementById("h_one") as HTMLHeadingElement;
      thing.innerHTML = "ERROR";
      thing.style.color="#ee0000";
      thing = document.getElementById("statush1") as HTMLHeadingElement;
      // thing.innerHTML = "ERROR";
      thing.style.color="#ee0000";
      let mainD = document.getElementById("before") as HTMLDivElement;
      mainD.className="modified";
    }
    else {
      let thing = document.getElementById("h_one") as HTMLHeadingElement;
      thing.innerHTML = "ONLINE";
      thing.style.color="#00c300";
    }
  });
  
  let match = document.URL.match("\\?REFRESH(=)?([0-9]+)");
  if (match) {
    TIMEOUT = setTimeout(()=>{location.reload()}, Number(match[2])?Number(match[2]):10000);
    let ele = document.getElementById("disableDiv") as HTMLDivElement;
    ele.hidden=false;
    ele.style.display="inline-block";
  }
  else {
    let ele = document.getElementById("enableDiv") as HTMLDivElement;
    ele.hidden = false;
    ele.style.display = "inline-block";
  }
  let nsc = document.getElementById("noscript") as HTMLDivElement;
  nsc.hidden = true;
} // onLoad()
let t:NodeJS.Timeout|null=null;

function toggleHidden() {
  let ele = document.getElementById('c1') as HTMLDivElement; 
  // clearTimeout(t);
  if (t) clearTimeout(t);
  if (!ele.hidden) {t=setTimeout(()=>{if (!ele.hidden && ele.style.height=='1vh') ele.hidden = true;}, 500);}
  else ele.hidden = false;
  ele.style.height = ele.style.height=='50vh'?'1vh':'50vh'; 
}
