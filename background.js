chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (typeof window[request.command] == "function") {
    window[request.command](request.data);
  }
});

//commands
function run() {
  queryActiveTab(function(tab){
    currentTabId = tab.id;
    running = true;
  });
}
function pause(){
  running = false;
}
function reset(){
  running = false;
  cateIndex = 0;
  userIndex = -1;
  currentListMembers = [];
}
function setVar(data) {
  window[data.name] = data.value;
}
function extractPage(html){
  info = extract($(html));
  submitToPE(info);
  userIndex++;
  if (userIndex >= currentListMembers.length) {
    userIndex = -1;
    cateIndex++;
    if (cateIndex >= CATEGORIES.length)
      cateIndex = 0;
  }
  timer.resume();
}

//Main Loop/Timer
running = false;
cateIndex = 0;
userIndex = -1; //-1 means the list members need to be fetched
currentListMembers = [];
function main(){
  if (!running)
    return;
  var cate = CATEGORIES[cateIndex];
  if (userIndex == -1) { //Start of a new List, so fetch members
    timer.pause();
    fetchListMembers(cate, function(res){
      if (res && res.users) {
        currentListMembers = _.map(res.users, function(o){return o.screen_name;});
        userIndex = 0;
      }
      timer.resume();
    });
  }else{
    timer.pause();
    var username = currentListMembers[userIndex];
    var url = TWITTER_URL + username;
    loadUrl(url, function(){
      queryActiveTab(function(tab){
        chrome.tabs.executeScript(tab.id, { file: "jquery.js" }, function() {
          expandAllTweets(function(){
            setTimeout(function(){
              chrome.tabs.executeScript(tab.id, {
                code: "chrome.extension.sendRequest({command: 'extractPage', data: document.body.innerHTML});"
              });
            }, 3000);
          });
        });
      });
    });
  }
}

timer = new RecurringTimer(main, 1000);

//Making sure the timer doesn't get paused for too long
_downtime = -1;
setInterval(function(){
  var maxTimeLimit = 8000; //in miliseconds
  var currentTime = (new Date()).getTime();
  if (timer.playing){
    _downtime = -1;
  }else if (_downtime == -1 && !timer.playing) {
    _downtime = currentTime;
  }else if (_downtime > 0 && !timer.playing && currentTime - _downtime > maxTimeLimit) {
    timer.resume();
  }
}, 1000);

//Helpers
function RecurringTimer(callback, delay) {
    var timerId, start, remaining = delay;

    this.playing = false;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
        this.playing = false;
    };

    var resume = function() {
        start = new Date();
        timerId = window.setTimeout(function() {
            remaining = delay;
            resume();
            callback();
        }, remaining);
        this.playing = true;
    };
    
    this.resume = resume;

    this.resume();
}