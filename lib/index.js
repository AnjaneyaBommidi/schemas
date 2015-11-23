'use strict';

var maybe          = require('call-me-maybe'),
    Promise        = require('./promise'),
    validateSchema = require('./validate-schema'),
    debuffer       = require('./debuffer'),
    $RefParser     = require('json-schema-ref-parser'),
    util           = require('util');

module.exports = PostmanCollection;

/**
 * Parses and validates Postman Collections.
 *
 * @constructor
 * @extends $RefParser
 */
function PostmanCollection() {
  $RefParser.apply(this, arguments);
}

util.inherits(PostmanCollection, $RefParser);

/**
 * Validates one or more Postman Collections.
 *
 * @param {string|object|array} collections - One or more Postman Collection objects, file paths, or URLs
 * @param {object} [options]
 * @param {function} [callback]
 * @returns {Promise}
 */
PostmanCollection.validate = function(collections, options, callback) {
  return instantiateAndInvoke(this, 'validate', arguments);
};

/**
 * Bundles one or more multi-file Postman Collections into single files.
 *
 * @param {string|object|array} collections - One or more Postman Collection objects, file paths, or URLs
 * @param {object} [options]
 * @param {function} [callback]
 * @returns {Promise}
 */
PostmanCollection.bundle = function(collections, options, callback) {
  return instantiateAndInvoke(this, 'bundle', arguments);
};

/**
 * Validates the given Postman Collection.
 *
 * @param {string|object|array} collection - a Postman Collection object, file path, or URL
 * @param {object} [options]
 * @param {function} [callback]
 * @returns {Promise}
 */
PostmanCollection.prototype.validate = function(collection, options, callback) {
  var args = normalizeArgs(arguments);

  return this.dereference(args.collections[0], args.options)
    .then(function(collection) {
      debuffer(collection);
      validateSchema(collection);
      return maybe(args.callback, Promise.resolve(collection));
    })
    .catch(function(err) {
      return maybe(args.callback, Promise.reject(err));
    });
};

/**
 * Instantiates a {@link PostmanCollection} object for each collection in {@link args.collections},
 * and calls the specified method on each object.
 *
 * @param {function} Species - The class to be instantiated ({@link PostmanCollection} or a derived class)
 * @param {string} method - The method name to invoke
 * @param {object} args - collections, [options], [callback]
 * @returns {Promise}
 */
function instantiateAndInvoke(Species, method, args) {
  var error = false;
  args = normalizeArgs(args);

  return Promise.all(
    args.collections.map(function(collection) {
      return new Species()[method](collection, args.options)
        .catch(function(err) {
          if (args.options.bail) {
            // Bail as soon as the first error occurs
            return Promise.reject(err);
          }
          else {
            // Resolve with the Error object, so other promises keep processing
            error = true;
            return err;
          }
        });
    }))
    .then(function(results) {
      if (!args.multiple) {
        // The user passed-in a single collection (not an array),
        // so resolve with a single result (not an array)
        results = results[0];
      }

      if (error) {
        // One or more of the promises rejected, so reject
        return maybe(args.callback, Promise.reject(results));
      }
      else {
        // All of the promises resolved, so resolve
        return maybe(args.callback, Promise.resolve(results));
      }
    })
    .catch(function(err) {
      // An error occurred and/or options.bail is set, so reject
      return maybe(args.callback, Promise.reject(err));
    });
}

/**
 * Normalizes the given arguments, accounting for optional args.
 *
 * @param {Arguments} args
 * @returns {object}
 */
function normalizeArgs(args) {
  var collections = args[0], options = args[1], callback = args[2], multiple = false;

  // Normalize the "collections" arg as an array
  // If it was initially an array, then set the "multiple" flag (even if it's an array of one)
  if (Array.isArray(collections)) {
    multiple = true;
  }
  else {
    collections = [collections];
  }

  // Shift the "callback" arg if "options" isn't specified
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }

  // Populate default options
  if (!options) {
    options = {bail: false}
  }

  return {
    collections: collections,
    options: options,
    callback: callback,
    multiple: multiple
  };
}
