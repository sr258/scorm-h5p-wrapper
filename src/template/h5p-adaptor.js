var scorm = pipwerks.SCORM;

function init() {
  scorm.init();
}

function set(param, value) {
  scorm.set(param, value);
}

function get(param) {
  scorm.get(param);
}

function end() {
  scorm.quit();
}

window.onload = function () {
  init();
}

window.onunload = function () {
  end();
}

var onCompleted = function (result) {
  scorm.status("set", "completed");
  scorm.set("cmi.core.score.raw", result.raw);
  scorm.set("cmi.core.score.min", "0");
  scorm.set("cmi.core.score.max", "100");
  scorm.set("cmi.core.score.scaled", result.scaled);
}

H5P.externalDispatcher.on('xAPI', function (event) {
  console.log('xAPI event: ' + JSON.stringify(event));
  if (event.data.statement.result) {
    console.log('It\'s a completed event.');
    onCompleted(event.data.statement.result);
  }
});