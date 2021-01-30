const _ = require("lodash");
const chalk = require("chalk");
const creator = require("./creator").default;
const CsvWriter = require("csv-writer");
const decompress = require("decompress");
const express = require("express");
const filesize = require("filesize");
const fileupload = require("express-fileupload");
const fs = require("fs-extra");
const fsExtra = require("fs-extra");
const ON_DEATH = require("death")({ uncaughtException: true });
const path = require("path");
const extract = require('extract-zip');
const archiver = require('archiver');
const prependFile = require('prepend-file');

const port = process.env.PORT || 80;
const useStatistics = process.env.USE_STATISTICS
  ? process.env.USE_STATISTICS.toLowerCase() === "true"
  : false;
const statisticsFile = path.resolve(
  process.env.STATISTICS_FILE || "statistics.csv"
);

const workingDir = "working_directory";
const uploadTmpDir = workingDir + "/downloads_tmp";
const h5pContentBaseDir = workingDir + "/workspace";
const tempBaseDir = workingDir + "/temp";
const outputDir = workingDir + "/output";

const createDirectoryIfNecessary = async dir => {
  if (!(await fs.exists(dir))) {
    await fs.mkdir(dir);
  }
};

const createWorkingDirectories = async () => {
  await createDirectoryIfNecessary(workingDir);
  await createDirectoryIfNecessary(uploadTmpDir);
  await createDirectoryIfNecessary(h5pContentBaseDir);
  await createDirectoryIfNecessary(outputDir);
};

ON_DEATH(function(signal, err) {
  fs.removeSync(workingDir);
  process.exit();
});

(async () => {
  await fs.remove(workingDir);
  await createWorkingDirectories();
  const app = express();
  app.use(fileupload());
  app.use(express.urlencoded({ extended: false }));

  // compile index.html (to include site-specific files)
  const compiled = _.template(
    await fsExtra.readFile(path.resolve("src/static/index.html"))
  );
  const index = compiled({
    imprint: await fsExtra.readFile(path.resolve("static/imprint.html")),
    privacy: await fsExtra.readFile(path.resolve("static/privacy.html")),
    license: await fsExtra.readFile(path.resolve("static/license.html"))
  });

  // Express middleware
  app.get("/", (req, res) => {
    res.send(index);
  });

  app.use(express.static("src/static"));

  app.post("/convert", async function(req, res) {
    let uploadedFile;
    if (!req.files || !req.files.h5p_file) {
      return res.status(400).send("You must upload a H5P file.");
    }
    uploadedFile = req.files.h5p_file;
    const masteryScore = req.body.h5p_mastery_score;
    const gradingMethod = req.body.gradingMethod;

    const uploadedFilePath = uploadTmpDir + "/" + uploadedFile.name;
    const tempDir = tempBaseDir + "/" + uploadedFile.name;
    uploadedFile.mv(uploadedFilePath, async err => {
      if (err) {
        return res.status(500).send(err);
      }

      // create a working directory for the unpackaged H5P files
      const workspaceName = h5pContentBaseDir + "/" + uploadedFile.name;
      await decompress(uploadedFilePath, workspaceName);
      await fs.remove(uploadedFilePath);

      // read content type and version from H5P metadata
      let contentType = "unknown";
      let contentTypeMachineName = "unknown";
      let contentTypeVersion = "unknown";
      try {
        const h5pMetadata = await fsExtra.readJSON(workspaceName + "/h5p.json");
        const mainLibrary = h5pMetadata.preloadedDependencies.find(
          dep => dep.machineName === h5pMetadata.mainLibrary
        );
        contentType = `${mainLibrary.machineName}-${mainLibrary.majorVersion}.${mainLibrary.minorVersion}`;
        contentTypeMachineName = mainLibrary.machineName;
        contentTypeVersion = `${mainLibrary.majorVersion}.${mainLibrary.minorVersion}`;
      } catch (error) {
        console.error(
          chalk.red(
            new Date().toLocaleString() +
              " - Could not read main library of content."
          )
        );
      }

      // package SCORM
      let filename = "";
      try {
        filename = await creator(
          outputDir,
          workspaceName,
          tempDir,
          masteryScore
        );
      } catch (error) {
        console.error(chalk.red(new Date().toLocaleString() + " - " + error));
        filename = "";
      } finally {
        await fs.remove(workspaceName);
      }
      if (!filename) {
        return res
          .status(400)
          .send(
            "Something went wrong when creating the SCORM package. Try again!"
          );
      }


      var extractDir = path.resolve(outputDir) + "/" + filename.substring(0,filename.length - 4); //remove '.zip' for unzipped folder name
      console.log("Unzipping: '" + outputDir + "/" +filename + "' to " + extractDir);
      try 
      {
        await extract(outputDir + "/" +filename, { dir: extractDir })
        console.log('Extraction complete')
      } 
      catch (err) 
      {
        if(err)
          console.log('| extract error | '+err);
        else
          console.log('extract completed with no errors!');
      }

      const jsonDirectory = path.join(extractDir, "gradingSettings.json");
      console.log("Writing JSON to " + jsonDirectory);

      await fs.outputJsonSync(jsonDirectory, {gradingMethod: gradingMethod, masteryScore: masteryScore });

      
      
      const adaptorDirectory = path.join(extractDir, "h5p-adaptor.js");
      const settings = '// settings\nvar gradingMethod = "' + gradingMethod + '";\nvar masteryScore = ' + masteryScore + ';\n\n';

      console.log("Settings prepend: " + adaptorDirectory);
      await prependFile(adaptorDirectory, settings);

      //rezip file
      var output = fs.createWriteStream(extractDir + "-final.zip"); //+ "-final.zip"
      var archive = archiver('zip');

      await archive.pipe(output);
      fs.ensureDirSync(extractDir);
      await archive.directory(extractDir, "");

      await output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
      });

      await archive.on('error', function(err){
          console.log('| rearchiver error | ' + err)
      });

      await archive.on('warning', function(err) {
        console.log('| rearchiver error2 | ' + err);
      });
      
      await archive.finalize();

      var zipdir = require('zip-dir');
      var buffer = await zipdir(extractDir);
      var outputZip = extractDir + "-final.zip"
      zipdir(extractDir, { saveTo: outputZip }, function (err, buffer) {
        // `buffer` is the buffer of the zipped file
        // And the buffer was saved to `~/myzip.zip`
        if(err)
          console.log("| ZIP ERR | " + err);
        else
          console.log("No zipping errors");
      });

      await res.download(outputZip);


      // Log success
      console.log(
        new Date().toLocaleString() +
          ` - Successfully converted file (${contentType}, ${filesize(
            req.files.h5p_file.size
          )}).`
      );

      // Log usage for statistical purposes
      if (useStatistics) {
        const header = [
          { id: "time", title: "Time" },
          { id: "ctMachineName", title: "Content Type" },
          { id: "ctVersion", title: "Content Type Version" },
          { id: "filesize", title: "Size (in bytes)" }
        ];
        const csvWriter = CsvWriter.createObjectCsvWriter({
          append: true,
          path: statisticsFile,
          header
        });
        if (!(await fsExtra.pathExists(statisticsFile))) {
          const csvW = CsvWriter.createObjectCsvStringifier({ header });
          await fsExtra.writeFile(statisticsFile, csvW.getHeaderString());
        }
        await csvWriter.writeRecords([
          {
            time: new Date().toUTCString(),
            ctMachineName: contentTypeMachineName,
            ctVersion: contentTypeVersion,
            filesize: req.files.h5p_file.size
          }
        ]);
      }
    });
  });

  app.listen(port, function() {
    console.log(new Date().toLocaleString() + " - Listening on port " + port);
  });
})();
