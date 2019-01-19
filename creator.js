var scopackager = require('simple-scorm-packager');
var fs = require('fs-extra');

const tempDir = "./temp";
const templateDir = "./src/template";
const h5pContentDir = "./workspace";
const outputDir = ".";

(async () => {
  await fs.remove(tempDir);
  await fs.copy(templateDir, tempDir, { errorOnExist: false, overwrite: true, recursive: true });
  await fs.copy(h5pContentDir, tempDir + "/workspace", { errorOnExist: false, overwrite: true, recursive: true })

  scopackager({
    version: '2004 4th Edition',
    organization: 'Test Company',
    title: 'Test Course',
    language: 'en-EN',
    identifier: '00',
    masteryScore: 100,
    startingPage: 'index.html',
    source: tempDir,
    package: {
      version: "1.0.0",
      zip: true,
      outputFolder: outputDir
    }
  }, async function (msg) {
    console.log(msg);
    await fs.remove(tempDir);
  });
})();