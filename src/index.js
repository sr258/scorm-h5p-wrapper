var express = require('express');
var fileupload = require('express-fileupload');
var fs = require('fs-extra');
var decompress = require('decompress');
var creator = require('./creator').default;
var ON_DEATH = require('death')({ uncaughtException: true });

const port = 80;

const workingDir = "working_directory";
const uploadTmpDir = workingDir + "/downloads_tmp";
const h5pContentBaseDir = workingDir + "/workspace";
const tempBaseDir = workingDir + "/temp";
const outputDir = workingDir + "/output";

var createDirectoryIfNecessary = async (dir) => {
  if (!(await fs.exists(dir))) {
    await fs.mkdir(dir);
  }
}

var createWorkingDirectories = async () => {
  await createDirectoryIfNecessary(workingDir);
  await createDirectoryIfNecessary(uploadTmpDir);
  await createDirectoryIfNecessary(h5pContentBaseDir);
  await createDirectoryIfNecessary(outputDir);
}

ON_DEATH(function (signal, err) {
  fs.removeSync(workingDir);
  process.exit();
});

(async () => {
  await fs.remove(workingDir);
  await createWorkingDirectories();
  var app = express();
  app.use(fileupload());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static('src/static'));

  app.post('/convert', async function (req, res) {
    var uploadedFile;
    if (!req.files || !req.files.h5p_file) {
      return res.status(400).send();
    }
    uploadedFile = req.files.h5p_file;

    var masteryScore = req.body.h5p_mastery_score;

    const uploadedFilePath = uploadTmpDir + "/" + uploadedFile.name;
    const tempDir = tempBaseDir + "/" + uploadedFile.name;
    uploadedFile.mv(uploadedFilePath, async (err) => {
      if (err) {
        return res.status(500).send(err);
      }

      const workspaceName = h5pContentBaseDir + "/" + uploadedFile.name;
      await decompress(uploadedFilePath, workspaceName);
      await fs.remove(uploadedFilePath);
      const filename = await creator(outputDir, workspaceName, tempDir, masteryScore);
      await fs.remove(workspaceName);
      if (!filename) {
        return res.status(400).send();
      }
      res.download(outputDir + "/" + filename, async () => {
        await fs.remove(outputDir + "/" + filename);
      });
    });
  });

  app.listen(port, function () {
    console.log('listening on port ' + port);
  });
})();