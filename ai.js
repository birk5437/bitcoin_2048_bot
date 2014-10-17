function AI() {
  this.best_operation = 0;
  this.grid = Array(16);
  this.node = 0;
  this.max_depth = 3;
}

AI.prototype.MoveLeft = function(s) {
  var k = 0;
  var base = 0;
  var score = 0;
  var result = new Array(16);
  for (var i = 4; i <= 16; i += 4) {
    while (k < i) {
      if (s[k] == 0) {
        ++k;
        continue;
      }        
      if (k + 1 < i && s[k] == s[k + 1]) {
        result[base++] = s[k] * 2;
        score += s[k] * 2;
        k += 2;
      } else {
        result[base++] = s[k++];
      }
    }
    while (base < i) {
      result[base++] = 0;
    }
  }
  return [result, score];
};
  
AI.prototype.Rotate = function(s) {
  return new Array(s[12], s[8], s[4], s[0],
                   s[13], s[9], s[5], s[1],
                   s[14], s[10], s[6], s[2],
                   s[15], s[11], s[7], s[3]);    
};

AI.prototype.Estimate = function(s) {
  var diff = 0;
  var sum = 0;
  for (var i = 0; i < 16; ++i) {
    sum += s[i];
    if (i % 4 != 3) {
      diff += Math.abs(s[i] - s[i + 1]);
    }
    if (i < 12) {
      diff += Math.abs(s[i] - s[i + 4]);
    }
  }
  return (sum * 4 - diff) * 2;
};

AI.prototype.Search = function(s, depth) {
  this.node++;
  if (depth >= this.max_depth) return this.Estimate(s);
  var best = -1e+30;
  for (var i = 0; i < 4; ++i) {
    var results = this.MoveLeft(s);
    var t = results[0];
    var same = true;
    for (var j = 0; j < 16; ++j) {
      if (t[j] != s[j]) {
        same = false;
        break;
      }
    }
    if (!same) {
      var temp = 0;
      var empty_slots = 0;
      for (var j = 0; j < 16; ++j) {
      	if (t[j] == 0) {
      	  t[j] = 2;
                ++empty_slots;
      	  temp += this.Search(t, depth + 1) * 0.9;	  
      	  t[j] = 4;
      	  temp += this.Search(t, depth + 1) * 0.1;
      	  t[j] = 0;
      	}
      }
      if (empty_slots != 0) {
      	temp /= empty_slots;
      } else {
        temp = -1e+10;
      }

      if (results[1] + temp > best) {
        best = results[1] + temp;
        if (depth == 0) {
          this.best_operation = i;
        }
      }
    }
    if (i != 3) {
      s = this.Rotate(s);
    }
  }    
  return best;
};

AI.prototype.SetTile = function(x, y, v) {
  this.grid[x + y * 4] = v;
};

AI.prototype.StartSearch = function() {
  this.node = 0;
  this.max_depth = 3;
  while (true) {
    this.node = 0;
    this.Search(this.grid, 0);
    if (this.node >= 10000 || this.max_depth >= 8) break;
    this.max_depth += 1;
  }
};
var global_game = null;
var old_requestAnimationFrame = window.requestAnimationFrame;
window.requestAnimationFrame = function(e) {
  window.requestAnimationFrame = old_requestAnimationFrame;
  global_game = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
}

function RunOneStep() {
  if (!global_game || global_game.isGameTerminated()) return;
  var ai = new AI();
  for (var i = 0; i < 4; ++i) {
    for (var j = 0; j < 4; ++j) {
      var t = global_game.grid.cells[i][j];
      if (t) {
        ai.SetTile(i, j, t.value);
      } else {
        ai.SetTile(i, j, 0);
      }
    }
  }
  var dir = [3, 2, 1, 0]
  ai.StartSearch();
  global_game.move(dir[ai.best_operation]);
}

var interval = 300;
var old_interval = 300;
var timer = null;
var page_reload_timer = null;
var interval_reset = null;
var currentScore = null;
var previousScore = null;

function Run() {
  RunOneStep();
  timer = setTimeout("Run()", interval);
}

function OnKeyPress(event) {
  var code = event.keyCode;

  cancel_interval_reset();


  if (code == 48) { //0
    interval = null
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
  } else if (code == 49) { //1
    interval = 300;
    if (!timer) {
      Run();
    }
  } else if (code == 50) { //2
    interval = 0;
    if (!timer) {
      Run();
    }
  } else if (code == 51) { //3
    RunOneStep();
  } else if (code == 52) { //4
    interval = 250;
    if (!timer) {
      Run();
    }
  } else if (code == 53) { //5
    interval = 150;
    if (!timer) {
      Run();
    }
  }
}

document.addEventListener("keypress", OnKeyPress);

setTimeout("autoStart()", 5000);




function autoStart(){
  console.log("autoStart");
  currentScore = $("#userCurrentBalance").html();

  $(document).ajaxSend(function(e, jqxhr, settings){
  // $(document).ajaxStart(function(){
    // if (settings.url === "/calculateBalance" || settings.url === "/updateScore"){
      console.log("ajaxStart");
      cancel_run_timer();
      cancel_page_reload_timer();

      if (interval_reset && interval !== null) {
        interval = old_interval;
        console.log("set interval to " + interval + " on ajax start");
      }
      cancel_interval_reset();
    // }
  });
  $(document).ajaxComplete(function(e, jqxhr, settings){
  // $(document).ajaxStop(function(){

    // if (settings.url === "/updateScore") {
      currentScore = $("#userCurrentBalance").html();
      console.log("ajaxStop");
      console.log(previousScore);
      console.log(currentScore);
      if ($(".tile-2048").length > 0){
        cancel_run_timer();
        cancel_interval_reset();
        cancel_page_reload_timer();
        console.log("page reload in 5 seconds");
        page_reload_timer = setTimeout("location.reload(true);", 5000);

      }else if (interval !== null && !timer) {
        console.log("1");
        console.log(settings.url);
        console.log(settings.url === "/updateScore");
        console.log(settings.url == "/updateScore");

        timer = setTimeout("Run()", 3500);
        if (!interval_reset) {
          old_interval = interval;
          interval = 500;
          console.log("set interval to:" + interval);
          interval_reset = setTimeout("interval = old_interval; interval_reset = null; console.log('resetting interval to: ' + interval);", 5000);
        }
      }
    // }

  });

  interval = 50;
  if (!timer) {
    Run();
  }
}

function cancel_interval_reset() {
  if (interval_reset){
    window.clearTimeout(interval_reset);
    interval_reset = null;
    console.log("clearing interval_reset");
  }
}

function cancel_run_timer(){
  if (timer) {
    window.clearTimeout(timer);
    timer = null;
    console.log("clearing timer");
  }
}

function cancel_page_reload_timer(){
  if (page_reload_timer) {
    console.log("clearing page_reload_timer");
    window.clearTimeout(page_reload_timer);
    page_reload_timer = null;
  }
}

// window.alert("Now you can use 2048 AI to complete the game.\n\n" +
//              "Press '1' to go automatically.\n" +
//              "Press '2' to get faster.\n" +
//              "Press '3' to go one step.\n" +
//              "Press '0' to stop.");
