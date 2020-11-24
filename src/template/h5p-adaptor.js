var scorm = pipwerks.SCORM;

var numberOfQuestions = 0;

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
  var masteryScore;
  if (scorm.version == "2004") {
    masteryScore = scorm.get("cmi.scaled_passing_score");
  } else if (scorm.version == "1.2") {
    masteryScore = scorm.get("cmi.student_data.mastery_score") / 100;
  }

  scorm.set("cmi.core.score.raw", result.score.raw);
  scorm.set("cmi.core.score.min", result.score.min);
  scorm.set("cmi.core.score.max", result.score.max);
  scorm.set("cmi.core.score.scaled", result.score.scaled);

  if (masteryScore === undefined) {
    scorm.status("set", "completed");
  }
  else {
    var passed = result.score.scaled >= masteryScore;
    if (scorm.version == "2004") {
      scorm.status("set", "completed");
      if (passed) {
        scorm.set("cmi.success_status", "passed");
      }
      else {
        scorm.set("cmi.success_status", "failed");
      }
    }
    else if (scorm.version == "1.2") {
      if (passed) {
        scorm.status("set", "passed")
      }
      else {
        scorm.status("set", "failed")
      }
    }
  }
}

var onAnswered = function (result) 
{

  numberOfQuestions++;
  var previousRaw = scorm.get("cmi.core.score.raw");
  var previousMin = scorm.get("cmi.core.score.min");
  var previousMax = scorm.get("cmi.core.score.max");
  var previousScaled = scorm.get("cmi.core.score.scaled");

  if(previousRaw)
  {
    scorm.set("cmi.core.score.raw", Number(previousRaw) + Number(result.score.raw));
    scorm.set("cmi.core.score.min", Number(previousMin) + Number(result.score.min));
    scorm.set("cmi.core.score.max", Number(previousMax) + Number(result.score.max));
    scorm.set("cmi.core.score.scaled", (Number(previousRaw) + Number(result.score.raw))/Number(numberOfQuestions));
  }
  else
  {
    scorm.set("cmi.core.score.raw", Number(result.score.raw));
    scorm.set("cmi.core.score.min", Number(result.score.min));
    scorm.set("cmi.core.score.max", Number(result.score.max));
    scorm.set("cmi.core.score.scaled", Number(result.score.raw));
  }
  
  //handle mastery score
  var masteryScore;
  if (scorm.version == "2004")
    masteryScore = scorm.get("cmi.scaled_passing_score");
  else if (scorm.version == "1.2")
    masteryScore = scorm.get("cmi.student_data.mastery_score") / 100;
  
  if (masteryScore === undefined)
    scorm.status("set", "completed");
  else 
  {
    var passed = result.score.scaled >= masteryScore;
    if (scorm.version == "2004") 
    {
      scorm.status("set", "completed");
      if (passed)
        scorm.set("cmi.success_status", "passed");
      else
        scorm.set("cmi.success_status", "failed");
    }
    else if (scorm.version == "1.2") 
    {
      if (passed)
        scorm.status("set", "passed")
      else
        scorm.status("set", "failed")
    }
  }
  
}

var count = 0;
H5P.externalDispatcher.on('xAPI', function (event) {
  console.log('xAPI event: ' + JSON.stringify(event));
  if (event.data.statement.result && event.data.statement.object.definition.description) 
  {
    console.log('This is question #' + count);
    count++;
    onAnswered(event.data.statement.result);
  }
});
