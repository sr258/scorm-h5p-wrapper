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

//finish onAnswered to work for any type of question
//use event type "completed" to account for the scoring options chosen in branching scenario
//end goal - choose between ending vs cumulative scoring while creating; 
  //choose whether to grade branching and or questions on slides on this wrapper
//bonus: get grades to display 5/10 questions answered correctly so the professor can see that info quickly 

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


//see if there is a work around for avoiding double counts of certian votes
//add option to remove cumulative points - if you want to add branching scenario scoring, check if verb is completed, then add score
// to create option, add radio button to index.html, then read it in index.js and use it in the creator
// creator.js uses scopackager which is within the simple-scorm-packager module
// the source for scopackager is in /simple-scorm-packager/lib/index.js according to cli.js
// this is packaged into an object in lib/schemas/config.js

/*
use https://jsonformatter.curiousconcept.com/#

where it goes wrong:

xAPI event: {"type":"xAPI",
"data":{"statement":{"actor":{"account":{"name":"not-trackable-5476070d-b77b-4dc2-ac18-f842ce8af709"},
"objectType":"Agent"},"verb":{"id":"http://adlnet.gov/expapi/verbs/answered",
"display":{"en-US":"answered"}},
"object":{"id":"undefined?subContentId=da33d126-9959-446d-85e9-58e2e6be0d50",
"objectType":"Activity",
"definition":{"extensions":{"http://h5p.org/x-api/h5p-local-content-id":"63qcaf6da",
"http://h5p.org/x-api/h5p-subContentId":"da33d126-9959-446d-85e9-58e2e6be0d50"},
"name":{"en-US":"Untitled Single Choice Set"}}},
"context":{"contextActivities":{"parent":[{"id":"undefined?subContentId=a59165f2-c613-4b24-b853-373504080346",
"objectType":"Activity"}],
"category":[{"id":"http://h5p.org/libraries/H5P.SingleChoiceSet-1.11",
"objectType":"Activity"}]},
"extensions":{"http://id.tincanapi.com/extension/ending-point":1}},
"result":{"score":{"min":0,"max":2,"raw":2,"scaled":1},
"completion":true,"success":true}}}}

prev:

xAPI event: {"type":"xAPI",
"data":{"statement":{"actor":{"account":{"name":"not-trackable-64a855ec-cf39-424d-b800-1a9ba09fdd90"},
"objectType":"Agent"},
"verb":{"id":"http://adlnet.gov/expapi/verbs/answered",
"display":{"en-US":"answered"}},
"context":{"contextActivities":{"parent":[{"id":"undefined?subContentId=da33d126-9959-446d-85e9-58e2e6be0d50",
"objectType":"Activity"}]},
"extensions":{"http://id.tincanapi.com/extension/ending-point":1}},
"object":{"id":"undefined?subContentId=f40863c7-65f8-4c5e-ae6f-43bf15325356",
"objectType":"Activity",
"definition":{"description":{"en-US":"Question 2?"},
"interactionType":"choice",
"correctResponsesPattern":["0"],
"type":"http://adlnet.gov/expapi/activities/cmi.interaction",
"choices":[{"id":"0","description":{"en-US":"d"}},{"id":"1","description":{"en-US":"e"}},{"id":"2","description":{"en-US":"f"}}],
"extensions":{"http://h5p.org/x-api/h5p-local-content-id":"63qcaf6da","http://h5p.org/x-api/h5p-subContentId":"f40863c7-65f8-4c5e-ae6f-43bf15325356"}}},
"result":{"response":"0","completion":true,"success":true,
"score":{"raw":1,"min":0,"max":1,"scaled":1}}}}}

first:
xAPI event: {"type":"xAPI","data":{"statement":{"actor":{"account":{"name":"not-trackable-2eead89b-32e2-433a-a502-2beb31ccab58"},
"objectType":"Agent"},"verb":{"id":"http://adlnet.gov/expapi/verbs/answered","display":{"en-US":"answered"}},
"object":{"id":"undefined?subContentId=eccaeaba-e962-4880-9e1b-d1be011b0133","objectType":"Activity",
"definition":{"extensions":{"http://h5p.org/x-api/h5p-local-content-id":"3pbl43krb",
"http://h5p.org/x-api/h5p-subContentId":"eccaeaba-e962-4880-9e1b-d1be011b0133"},
"name":{"en-US":"Untitled Multiple Choice"},"description":{"en-US":"Are you paying attention?\n"},
"type":"http://adlnet.gov/expapi/activities/cmi.interaction","interactionType":"choice","correctResponsesPattern":["0"],
"choices":[{"id":"0","description":{"en-US":"Yes\n"}},{"id":"1","description":{"en-US":"Not really\n"}}]}},
"context":{"contextActivities":{"parent":[{"id":"undefined?subContentId=a11fcd10-91ba-476a-be43-fe0367d91fac",
"objectType":"Activity"}],"category":[{"id":"http://h5p.org/libraries/H5P.MultiChoice-1.14","objectType":"Activity"}]},
"extensions":{"http://id.tincanapi.com/extension/ending-point":"PT11S"}},"result":{"score":{"min":0,"max":1,"raw":1,"scaled":1},
"completion":true,"success":true,"duration":"PT2S","response":"0"}}}}


options:
context.category.id = single choice set //too narrow to catch other cases | backup scenario, will have to manually add all exceptions
is object.definition.description definied?  //potentially too broad, if a question type doesn't include description | appears to often times be defined
is object.definition.interactionType === choice? //potentially too broad if interaction type isn't set as choice, or isn't included | is not always choice

*/