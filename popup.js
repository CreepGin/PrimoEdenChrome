
_running = false;
$("#run").click(function(){
  _running = !_running;
  if (_running) {
    execCmd("run");
    $(this).text("Pause");
  }else{
    execCmd("pause");
    $(this).text("Run");
  }
});
$("#reset").click(function(){
  execCmd("reset");
  _running = false;
  $("#run").text("Run");
});
$("#debug").click(function(){
  execCmd("setVar", {
    name: "debug",
    value: $(this).is(':checked')
  });
});
$("#url").keyup(function(){
  execCmd("setVar", {
    name: "PRIMOEDEN_URL",
    value: $(this).val()
  });
});
$("#url").keyup();

function execCmd(name, data){
  chrome.extension.sendRequest({command: name, data: data});
}
