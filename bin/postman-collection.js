#!/usr/bin/env node
'use strict';

var program           = require('commander'),
    globby            = require('globby'),
    fs                = require('fs'),
    path              = require('path'),
    mkdirp            = require('mkdirp'),
    util              = require('util'),
    ono               = require('ono'),
    YAML              = require('json-schema-ref-parser').YAML,
    manifest          = require('../package'),
    PostmanCollection = require('../'),
    E_NO_ARGS         = 1,
    E_NO_FILES        = 2,
    E_INVALID         = 3,
    E_OTHER           = 4;

/**
 * Parse command-line arguments
 */
function main() {
  program
    .version(manifest.version)
    .description(manifest.description);

  program.command('validate <files...>')
    .description('Validates one or more Postman Collections. Exits with zero if all are valid')
    .option('-b, --bail', 'Exit as soon as the first error is encountered')
    .action(validate);

  program.command('bundle <files...>')
    .description('Bundles a multi-file Postman Collection into a single file')
    .option('-o, --out <path>', 'The output file or directory (default is stdout)')
    .option('-j, --json [n]', 'Output as JSON with [n] indentation')
    .option('-y, --yaml [n]', 'Output as YAML with [n] indentation')
    .option('-b, --bail', 'Exit as soon as the first error is encountered')
    .option('-V, --no-validate', 'Create the output file, even if it\'s invalid')
    .action(bundle);

  program.parse(process.argv);

  // Require 4 args ("node" "postman-collection.js", "<command>", "<arg>")
  if (program.rawArgs.length < 4) {
    program.outputHelp();
    process.exit(E_NO_ARGS);
  }
}

/**
 * Validates one or more Postman Collection files.
 *
 * @param {string[]} globs - Filenames and/or glob patterns
 * @param {object} options - Command-line options
 */
function validate(globs, options) {
  var files;

  expandGlobs(globs)
    .then(function(results) {
      files = results;
      return PostmanCollection.validate(files, {bail: options.bail});
    })
    .then(function(results) {
      showResults(results, success);
    })
    .catch(function(results) {
      showResults(results, success, error);
    });

  function success(index) {
    console.log('✔ VALID    %s', files[index]);
  }

  function error(index) {
    console.log('✘ INVALID  %s', files[index]);
  }
}

/**
 * Validates one or more Postman Collection files.
 *
 * @param {string[]} globs - Filenames and/or glob patterns
 * @param {object} options - Command-line options
 */
function bundle(globs, options) {
  var files;

  expandGlobs(globs)
    .then(function(results) {
      files = results;

      if (options.validate) {
        // Validate the collection(s) first
        return PostmanCollection.validate(files, {bail: options.bail});
      }
    })
    .then(function() {
      // Bundle the collection(s)
      return PostmanCollection.bundle(files, {bail: options.bail});
    })
    .then(function(results) {
      if (options.out) {
        // Write each output file
        files.forEach(function(file, index) {
          var result = results[index];
          var outPath = getOutputPath(file, options);
          mkdirp.sync(path.dirname(outPath));
          fs.writeFileSync(outPath, serialize(result, options));
        });

        // Show a summary of the results
        showResults(results, success);
      }
      else {
        // No --out param was specified, so write the results to stdout
        console.log(serialize(results, options));
      }
    })
    .catch(function(results) {
      showResults(results, success, error);
    });

  function success(index) {
    console.log('✔ %s  -->  %s', files[index], getOutputPath(files[index], options));
  }

  function error(index) {
    console.log('✘ %s  -->  %s', files[index], getOutputPath(files[index], options));
  }
}

/**
 * Expands one or more glob patterns into an array of file paths.
 * Throws an error if no matching files are found.
 *
 * @param {string[]} globs - Filenames and/or glob patterns
 * @returns {Promise<string[]>}
 */
function expandGlobs(globs) {
  return globby(globs)
    .then(function(files) {
      if (files.length === 0) {
        process.exitCode = E_NO_FILES;
        throw new Error('No matching files were found');
      }
      return files;
    });
}

/**
 * Serializes the given object as JSON or YAML, based on the options.
 *
 * @param {object} obj - The object to serialize
 * @param {object} options - Serialization options
 * @returns {string}
 */
function serialize(obj, options) {
  try {
    var yaml = !!options.yaml;
    var indent = parseInt(options.json || options.yaml) || 2;
    return yaml ? YAML.stringify(obj, null, indent) : JSON.stringify(obj, null, indent);
  }
  catch (err) {
    throw ono(err, 'An error occurred while serializing the results');
  }
}

/**
 * Returns the output path for the given file, based on the options.
 *
 * @param {string} file - The input file path
 * @param {object} options - The output options
 * @returns {string}
 */
function getOutputPath(file, options) {
  if (!options.out) {
    return 'stdout';
  }

  var isFile = !!path.extname(options.out);
  if (isFile) {
    // options.out is a full file path, so use it as-is
    return options.out;
  }
  else {
    // options.out is a directory
    var outPath = path.join(options.out, file);

    // Make the file extension match the output format
    var ext = path.extname(outPath);
    outPath = outPath.substr(0, outPath.length - ext.length);
    outPath += options.yaml ? '.yaml' : '.json';

    return outPath;
  }
}

/**
 * Displays the results, calling the given success or error function for each result.
 * If there are any errors, then the program is terminated.
 *
 * @param {Error|array} results - The results of the operation
 * @param {function} successFn - The function to call for each successful result
 * @param {function} [errorFn] - The function to call for each error result
 */
function showResults(results, successFn, errorFn) {
  if (errorFn) {
    process.exitCode = E_INVALID;
  }

  if (results instanceof Error) {
    errorHandler(results);
    return;
  }

  // First, group the results by passed & failed
  var passed = [], failed = [];
  results.forEach(function(result, index) {
    if (result instanceof Error) {
      failed.push(index);

      // Display detailed error information
      console.error('\n=============== ERROR #%d ===============\n%s\n', failed.length, result.stack);
    }
    else {
      passed.push(index);
    }
  });

  // Display a summary of successful and failed results
  passed.forEach(successFn);
  errorFn && failed.forEach(errorFn);
  console.error('\n%d succeeded, %d failed', passed.length, failed.length);
}

/**
 * Logs errors to stderr, and terminates if the error is fatal
 *
 * @param {Error|string} err
 */
function errorHandler(err) {
  console.error(err.stack);

  // Terminate with non-zero code
  process.exitCode || (process.exitCode = E_OTHER);
  process.exit();
}

main();
