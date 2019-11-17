# scorm-h5p-wrapper

This utility allows you to package H5P files into SCORM files.

## Advantages of packaging H5P content into SCORM

(in comparison to embedding from external sites or using the built-in H5P module of your LMS)

* You can use H5P in any LMS that supports SCORM.
* Scores are reported to the LMS through SCORM.
* You don't have to rely on external sites (privacy concerns, availability).
* You can use H5P content types which are not available in your LMS.
* Your content will never change, so updates to the H5P core or libraries won't affect it.
      
## Disadvantages of packing H5P content into SCORM
      
* Users don't benefit from caching H5P library files across content. This means that all JavaScript, HTML and CSS files have to be downloaded for each package. If the LMS server is a bit slow, this can lead to noticeable delays in loading the content.
* You can't use the H5P Editor in your LMS to quickly change the content. You have to store your H5P files in a separate place and edit your content on H5P.org or on another CMS that supports H5P (like a local Drupal or WordPress installation).
* You don't benefit from updates to H5P libraries or the core.
* The packages are a bit bigger as they include the h5p-standalone library.
      
As a conclusion, you should only package H5P into SCORM if there are compelling reasons to do so and if you know what you are doing! If you have  administrative rights on your LMS and there is a H5P module for it, you should certainly install this module and upload your content the regular way.

## Installation

* It's a NodeJS application, so get NodeJS and NPM for your system.
* Clone this repository
* ``npm install``
* ``npm run copy-h5p-standalone`` to copy necessary files into the template directory
* ``PORT=8080 npm start``
* Access the application at ``http://localhost:8080``

Note that you must fill the placeholders for the imprint, privacy policy and license in ``/static``. You could do this by mounting a Docker volume into ``/usr/src/app/static``. 

Example for docker-compose:
```
volumes:
  - ./local-dir:/usr/src/app/static
```

## Logging

You can log successful packaging in a CSV file using two environment variables:

- set ``USE_STATISTICS`` to ``true``
- set ``STATISTICS_FILE`` to a path in the filesystem where the log file should be stored. (optional, defaults to ``./statistics.csv``)

Example (Linux):
```
PORT=8080 USE_STATISTICS=true STATISTICS_FILE=my_statistics.csv npm start
``` 

## Running it without installation

There is a running version of this application at https://deutsche-h5p-uebersetzungscommunity.tk/scorm-h5p/
