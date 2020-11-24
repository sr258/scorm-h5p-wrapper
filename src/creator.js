var scopackager = require("simple-scorm-packager");
var fs = require("fs-extra");

const templateDir = "./src/template";

var cleanAndTrim = text => {
  var textClean = text.replace(/[^a-zA-Z\d\s]/g, "");
  return textClean.replace(/\s/g, "");
};

var creator = async (outputDir, h5pContentDir, tempDir, masteryScore, gradingMethod) => {
  const oldConsoleLog = console.log;
  const log = "";
  console.log = message => `${log}${message}\n`;

  if (!masteryScore) {
    masteryScore = 100;
  }
  if(!gradingMethod)
  {
    gradingMethod = "Question";
  }

  await fs.remove(tempDir);
  await fs.copy(templateDir, tempDir, {
    errorOnExist: false,
    overwrite: true,
    recursive: true
  });
  await fs.copy(h5pContentDir, tempDir + "/workspace", {
    errorOnExist: false,
    overwrite: true,
    recursive: true
  });
  try {
    const h5p = await fs.readJSON(h5pContentDir + "/h5p.json");
    return await new Promise((resolve, reject) => {
      const options = {
        version: "1.2",
        organization:
          h5p.authors && h5p.authors[0] ? h5p.authors[0].name : "H5P Author",
        title: h5p.title || "H5P Content",
        language: "en-EN",
        identifier: "00",
        masteryScore: masteryScore,
        startingPage: "index.html",
        source: tempDir,
        package: {
          version: "1.0.0",
          zip: true,
          outputFolder: outputDir,
          date: new Date().toISOString().slice(0, 10)
        }
      };
      scopackager(options, async () => {
        await fs.remove(tempDir);
        resolve(
          cleanAndTrim(options.title) +
            "_v" +
            options.package.version +
            "_" +
            options.package.date +
            ".zip"
        );
      });
    });
  } catch (e) {
    await fs.remove(tempDir);
    throw new Error(`Error when packaging SCORM:\n${log}`);
  } finally {
    console.log = oldConsoleLog;
  }
};

exports.default = creator;
