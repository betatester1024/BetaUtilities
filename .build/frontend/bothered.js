"use strict";
let motiv = 0;
let motivProb = 0.5;
let tickspeed = 1e3;
let consumed = 2;
let coins = 0;
let bought = {
  food: 1
};
let multi = 1;
let loc = "inside";
function updateMotivation() {
  if (Math.random() < motivProb) {
    if (motiv < 100) {
      motiv += multi;
      motivProb += 2e-3 * motiv;
      motivProb = Math.min(0.8, motivProb);
      if (motivProb == 0.8)
        motivProb = 0.25;
    }
    setTimeout(updateMotivation, 100);
  } else
    setTimeout(updateMotivation, tickspeed);
  if (Math.random < 0.5)
    motivProb -= motivProb * 0.02;
  motiv -= motiv * 0.01;
  if (motivProb < 0.1)
    motivProb = 0.1;
  consumed -= 0.02;
  refreshIndicators();
  if (motiv < 5 && loc != "inside")
    inside();
  console.log(motivProb);
}
function refreshIndicators() {
  let ele = document.getElementById("motivation");
  ele.innerHTML = "Current motivation: " + motiv.toFixed(2);
  ele = document.getElementById("hunger");
  ele.innerHTML = "You are " + (consumed < 30 ? "hungry." : consumed < 80 ? "peckish." : "full.");
}
function onLoad() {
  updateMotivation();
  log("Motivation often comes in chunks. Ride the wave, they say.");
}
function consume() {
  if (motiv > 20 && consumed < 100 && bought.food > 0) {
    motiv -= 20;
    motiv += Math.random() * 30 + 5;
    motiv = Math.min(motiv, 100);
    consumed += 25;
    bought.food--;
    log("You had something to eat. It was mediocre, as usual.");
    refreshIndicators();
  } else if (bought.food <= 0)
    log("Oh, right. Fridge's empty.");
  else if (consumed >= 100)
    log("You're already full.");
  else
    log("You can't be bothered to get up and have something to eat.");
}
function work() {
  if (motiv > 20 && consumed > 30) {
    motiv -= Math.random() * 15 + 5;
    motiv = Math.max(motiv, 0);
    consumed -= 10;
    log("Typing away at that irritating desk that squeaks.");
    if (Math.random() > 0.7) {
      coins += Math.random() * 5 + 2;
      log("You were paid, it seems.");
    } else
      log("After an hour, nothing happens. Guess the coin dispenser broke again.");
    refreshIndicators();
  } else if (consumed <= 30)
    log("You're hungry and don't want to work.");
  else
    log("You can't be bothered to get up.");
}
function outside() {
  if (motiv > 20) {
    document.getElementById("inside").hidden = true;
    document.getElementById("outside").hidden = false;
    multi = -0.1;
    motiv -= 20;
    motivProb = 0.5;
    loc = "outside";
    refreshIndicators();
    log("You open the door. It is cold. The outside is bleak. Why are you out here?");
  } else
    log("It's cold outside. You don't want to go outside.");
}
function inside() {
  document.getElementById("inside").hidden = false;
  document.getElementById("outside").hidden = true;
  multi = 1;
  motivProb = 0.5;
  loc = "inside";
  log("You return to the relative comfort of your home.");
}
function yank() {
  if (motiv > 10) {
    motiv -= 10;
    refreshIndicators();
    if (Math.random() > 0.6) {
      bought.food++;
      log("You acquired... ");
    }
  }
}
function log(thing) {
  let ele = document.getElementById("log");
  ele.innerHTML = thing + "<br>" + ele.innerHTML;
}
//# sourceMappingURL=bothered.js.map
