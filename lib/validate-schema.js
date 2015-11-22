'use strict';

var util          = require('util'),
    ono           = require('ono'),
    ZSchema       = require('z-schema'),
    postmanSchema = require('../json/collection/v2.0.0-draft.3');

module.exports = validateSchema;

initializeZSchema();

/**
 * Validates a Postman Collection against the schema.
 *
 * @param {object} collection
 */
function validateSchema(collection) {
  // Validate the collection against the Postman Collection schema
  var isValid = ZSchema.validate(collection, postmanSchema);

  if (!isValid) {
    var err = ZSchema.getLastError();
    var message = 'Postman Collection schema validation failed. \n' + formatZSchemaError(err.details);
    throw ono.syntax(err, {details: err.details}, message);
  }
}

/**
 * Performs one-time initialization logic to prepare for Postman Collection schema validation.
 */
function initializeZSchema() {
  ZSchema = new ZSchema({
    breakOnFirstError: true,
    noExtraKeywords: true,
    ignoreUnknownFormats: false,
    reportPathAsArray: true
  });
}

/**
 * Z-Schema validation errors are a nested tree structure.
 * This function crawls that tree and builds an error message string.
 *
 * @param {object[]}  errors     - The Z-Schema error details
 * @param {string}    [indent]   - The whitespace used to indent the error message
 * @returns {string}
 */
function formatZSchemaError(errors, indent) {
  indent = indent || '  ';
  var message = '';
  errors.forEach(function(error, index) {
    message += util.format('%s%s at #/%s\n', indent, error.message, error.path.join('/'));
    if (error.inner) {
      message += formatZSchemaError(error.inner, indent + '  ');
    }
  });
  return message;
}
