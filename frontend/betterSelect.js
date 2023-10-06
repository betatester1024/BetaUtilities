let version="v3";

function clickSelect(whichOne, openQ=0) 
{
  // console.log("which one?", whichOne);
  let ctn = byId(whichOne);
  // console.log(ctn);
  // console.log(openQ);
  if (openQ != 0) ctn.selectOpen = (openQ==1);
  else ctn.selectOpen=!ctn.selectOpen;
  // console.log(ctn.selectOpen);
  
  if (!ctn) {
    console.error("No container found!");
    return;
  }
  // if open then close all others
  // if (ctn.selectOpen)
  // {
    // if (currOpen) clickSelect(currOpen, -1);
    // currOpen = whichOne;
  // }
  let inp = ctn.querySelector(".betterSelect");
  inp.readOnly=!ctn.selectOpen;
  inp.style.cursor = ctn.selectOpen?"text":"pointer";
  ctn.querySelector(".optionMenu").className = "optionMenu "+ (ctn.selectOpen?"open":"");
  // if (!ctn.selectOpen) {
  {
    inp.value = "";
    // check if value is valid
    let children = inp.nextElementSibling.children;
    let valid = ctn.selectOpen; // valid if open
    for (let i=0; i<children.length; i++) {
      if (inp.selectedVal == children[i].innerText) { 
        valid = true;
        inp.bSelValid = true;
      }
      if (ctn.selectOpen) children[i].tabIndex = 0;
      else children[i].tabIndex=-1;
    }
    if (valid) {
      // console.log("valid");
      inp.placeholder = inp.selectedVal?inp.selectedVal:"Make a selection...";
      inp.classList.remove("invalid");
    }
    else if (inp.selectedVal != undefined) {
      inp.selectedVal = "";
      inp.bSelValid = false;
      inp.classList.add("invalid");
      inp.placeholder = "Invalid selection";
    }
  } // true
}

function enterEvent(inp, e) 
{
  if (!e.target.classList.contains("betterSelect"))
    inp.value = e.target.innerText;
  inp.selectedVal = inp.value;
  // console.log('enter');
  clickSelect(inp.parentElement.id);
  inp.focus();
  // console.log(inp.valueMap.get(inp.selectedVal));
  if (inp.bSelOnChangeEvent && inp.bSelValid) inp.bSelOnChangeEvent(inp.selectedVal, inp.valueMap.get(inp.selectedVal));
  e.preventDefault();
}
let registered = [];
function bSelRegister(id, onChange) 
{
  let ctn = byId(id);
  registered.push(id);
  let inp = ctn.querySelector(".betterSelect");
  inp.bSelOnChangeEvent = onChange;
  console.log(onChange);
  inp.valueMap = new Map();
  let children = inp.nextElementSibling.children;
  for (let i=0; i<children.length; i++) {
    inp.valueMap.set(children[i].innerText, children[i].getAttribute("val"));
  }
  inp.placeholder = "Make a selection...";
  inp.addEventListener("click", (e)=>{
    // console.log(e.target);
    clickSelect(e.target.parentElement.id, 1);
    e.preventDefault();
  });
  ctn.addEventListener("click", (e)=>{
    if (e.target.classList.contains("option")) 
    {
      let inp = e.target.parentElement.parentElement.querySelector("input");
      // e.target.focus()
      enterEvent(inp, e);
    }
  })
  inp.bSelValid = false;
}

function bSelInitialise() {
  console.log("Initialising BetterSelects");
  // bSelRegister("selCtn", (value)=>{console.log(value);});
  // <!-- bSelRegister("selCtn2"); -->
  document.addEventListener("click", (e)=>{
    if (e.target.closest(".bSel")) return;
    // console.log("clicked away");
    for (let i=0; i<registered.length; i++) 
      clickSelect(registered[i], -1);
  })
  document.addEventListener("keydown", (e)=>
  {
    if (!e.target.classList.contains("betterSelect") 
     && !e.target.classList.contains("option")) return;
    // console.log(e.key);
    let inp;
    if (!e.target.classList.contains("betterSelect")) 
      inp = e.target.parentElement.parentElement.querySelector("input");
    else inp = e.target;
    switch (e.key) 
    {
      case " ":
        if (e.target.classList.contains("betterSelect"))
          break;
      case "Enter":
        enterEvent(inp, e);
        return;
      case 'Escape':
        clickSelect(inp.parentElement.id, -1);
        inp.value = "";
        e.preventDefault();
        break;
      case 'ArrowDown':
        e.preventDefault();
        clickSelect(inp.parentElement.id, 1);
        if (e.target.classList.contains("option")) 
          if (e.target.nextElementSibling)
            e.target.nextElementSibling.focus();
          else 
            e.target.parentElement.children[0].focus();
        else 
          e.target.nextElementSibling.children[0].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        clickSelect(inp.parentElement.id, 1);
        if (e.target.classList.contains("option")) 
          if (e.target.previousElementSibling)
            e.target.previousElementSibling.focus();
          else 
            e.target.parentElement.lastElementChild.focus();
        else 
          // console.log(e.target.nextElementSibling);
          e.target.nextElementSibling.lastElementChild.focus();
      break;
      default:
        if (e.key.length == 1 && !e.target.classList.contains("betterSelect")) // nothing stupid likee backspace/etc 
        {
          let inp = e.target.parentElement.parentElement.querySelector("input");
          // inp.value = e.key;
          inp.focus();
          
        }
    } // switch (key)
  })
};