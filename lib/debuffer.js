'use strict';

module.exports = debuffer;

/**
 * JSON Schema $Ref Parser parses unknown file types (anything other than JSON/YAML) as Buffers.
 * That's fine for binary files, but Postman Collections needs JavaScript files to be loaded as
 * strings, not Buffers.  So this function converts all scripts in the collection to strings.
 *
 * @param {object} collection
 */
function debuffer(collection) {
  debufferScripts(collection.scripts);
  debufferFolder(collection.requests);
  debufferFolder(collection.tests);
  debufferFolder(collection.examples);
}

/**
 * Debuffers a "Folder" object (see folder.yaml)
 *
 * @param {object} folder
 */
function debufferFolder(folder) {
  if (folder && typeof folder === 'object' && Array.isArray(folder.items)) {
    // Crawl each item in this folder
    folder.items.forEach(function(item) {
      if (item.items) {
        // We found a sub-folder
        debufferFolder(item);
      }
      else {
        debufferScripts(item.events);
      }
    });
  }
}

/**
 * Debuffers a "Scripts" object (see scripts.yaml)
 *
 * @param {object} scripts
 */
function debufferScripts(scripts) {
  if (scripts && typeof scripts === 'object') {
    Object.keys(scripts).forEach(function(key) {
      var script = scripts[key];
      if (Buffer.isBuffer(script)) {
        scripts[key] = script.toString();
      }
    });
  }
}
