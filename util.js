function submitToPE(obj){
  log("Submitting:");
  log(obj);
  var url = PRIMOEDEN_URL + "proxy/";
  $.post(url, { type: "insert", key: "0724", data: obj }, function(res){
    log(res);
    log("--------------------------");
  });
}

function extract(dom) {
  var info = {};
  info.fullname = dom.find(".fullname .profile-field").text();
  info.username = dom.find(".username .screen-name").text().slice(1);
  info.category = CATEGORIES[cateIndex];
  info.tweets = [];

  dom.find("#stream-items-id > li .original-tweet").each(function(){
    $this = $(this);
    var cardType = $this.attr("data-card-type");
    var tweet = { card: "", cardType: "" };
    tweet.tweetId = $this.attr("data-tweet-id");
    tweet.retweets = parseInt($this.find(".request-retweeted-popup > strong").text().replace(/,/gi, ""));
    tweet.favorites = parseInt($this.find(".request-favorited-popup > strong").text().replace(/,/gi, ""));
    tweet.text = $this.find(".js-tweet-text").html().trim();
    tweet.fullname = $this.find(".fullname").first().text().trim();
    tweet.username = $this.find(".username b").first().text().trim();
    tweet.iconUrl = $this.find(".avatar").attr("src").trim();
    if (cardType == "summary" || cardType == "photo" || cardType == "player") {
      $this.find(".cards-media-container .source").remove();
      tweet.card = $this.find(".cards-media-container").html().trim();
      tweet.cardType = cardType;
    }
    tweet.createdAt = parseInt($this.find(".time span._timestamp").attr("data-time"));

    if (tweet.retweets + tweet.favorites > MIN_RETWEET_FAVS)
      info.tweets.push(tweet)
  });

  return info;
}

function expandAllTweets(callback) {
  queryActiveTab(function(tab){
    chrome.tabs.executeScript(tab.id, {
      code: "$('#stream-items-id > li .original-tweet .expand-stream-item.js-view-details').click();"
    }, callback);
  });
}

function loadUrl(url, callback) {
  /*
  _urlCallback = function(){
    setTimeout(callback, 2000);
  };
  queryActiveTab(function(tab){
    chrome.tabs.executeScript(tab.id, {
      code: "window.location = '"+url+"';"
    }, function(){
      chrome.tabs.onUpdated.addListener(_loadingListener);
    });
  });
  */
  chrome.tabs.update(currentTabId, {'url': url}, function(){
    setTimeout(callback, 3000);
  });
}

_loaded = false;
_urlCallback = undefined;
function _loadingListener(tabId, changeInfo, tab) {
  if (changeInfo.status == "loading")
    _loaded = true;
  else if (_loaded && changeInfo.status == "complete"){
    _loaded = false;
    chrome.tabs.onUpdated.removeListener(_loadingListener);
    _urlCallback();
  }
}

function queryActiveTab(callback) {
  chrome.tabs.query({
    //"currentWindow": true,//Filters tabs in current window
    "status": "complete", //The Page is completely loaded
    "active": true, // The tab or web page is browsed at this state,
    "windowType": "normal" // Filters normal web pages, eliminates g-talk notifications etc
  }, function (tabs) {//It returns an array
    for (var i in tabs) {
      var tab = tabs[i]
      callback(tab);
      break;
    }
  });
}

function fetchListMembers(cate, callback){
  var url = "https://api.twitter.com/1.1/lists/members.json";
  var accessor = {
    token: "418867501-jmTxZcDepapA51KHaoLjCRsZi4fT6ezJXN7ksu2H",
    tokenSecret: "st3f5IZRalRa813cLZ98S3bXsKlMXwxmt7hHcPU5O5o",
    consumerKey : "7rxYcY7qO7VX9UhyVbV0OQ",
    consumerSecret: "L3DULvN8JDSVRh0Sb5ZHzWRHFqRgBCMKIGAyVKTM"
  };

  var message = {
    action: url,
    method: "GET",
    parameters: {
      slug: cate,
      owner_screen_name: "PrimoEden"
    }
  };

  OAuth.completeRequest(message, accessor);        
  OAuth.SignatureMethod.sign(message, accessor);
  url = url + '?' + OAuth.formEncode(message.parameters);

  $.get(url, function(res){
    callback(res);
  }, "json")
}

function log(text){
  if (debug)
    console.log(text);
}