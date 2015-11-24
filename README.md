<a href="https://schemas.getpostman.com" target="_blank"><img src="https://s3.amazonaws.com/web-artefacts/postman-logo%2Btext-197x68.png" /></a>

# Postman Schemas

Repository of all schemas for JSON structures compatible with Postman (such as the Postman Collection Format). The schemas are also hosted online, at [schema.getpostman.com](https://schema.getpostman.com). 

### More Information
- [Postman Collection Format v2 proposal](http://www.slideshare.net/postmanlabs/postman-collection-format-v2-predraft) (May 27, 2015)
- [Postman Collection Format v2 announcement](http://blog.getpostman.com/2015/06/05/travelogue-of-postman-collection-format-v2/) (June 5, 2015)
- [Postman Collection Format JSON Schema announcement](http://blog.getpostman.com/2015/07/02/introducing-postman-collection-format-schema/) (July 2, 2015)

## Schema Formats

As of version 2.0.0-draft.3, the schemas are available in [YAML format](yaml/collection/) as well as [JSON format](json/collection/).  The YAML format is broken out into separate files, which makes it easier to digest.  The JSON format is auto-generated from the YAML source, so it's less human-friendly.

## Examples

We now have [several example collections](examples/collection) available for each schema version.  Most of the examples are in YAML format and include explanatory comments.

## Postman-Collection CLI

We now have a command-line tool for validating Postman Collections against the latest version of the schema.  The tool may eventually be published on npm, but for now you'll have to clone this repository to get it.

### Instructions:

1. `git clone` this repository

2. `npm install` to install dependencies

3. `npm start` to run the validator on all of the [example collections](examples/collection)

4. `npm link` to add the postman-collection CLI to your PATH, so you can run it from any directory.

### `postman-collection --help`

```bash
Usage: postman-collection [options] [command]


Commands:

validate [options] <files...>  Validates one or more Postman Collections. Exits with zero if all are valid
bundle [options] <files...>    Bundles a multi-file Postman Collection into a single file

Parses and validates Postman Collection files

Options:

-h, --help     output usage information
-V, --version  output the version number
```

### `postman-collection validate <files...>`

```bash
Usage: validate [options] <files...>

Validates one or more Postman Collections. Exits with zero if all are valid

Options:

-h, --help  output usage information
-b, --bail  Exit as soon as the first error is encountered
```

### `postman-collection bundle <files...>`

```bash
Usage: bundle [options] <files...>

Bundles a multi-file Postman Collection into a single file

Options:

-h, --help         output usage information
-o, --out <path>   The output file or directory (default is stdout)
-j, --json [n]     Output as JSON with [n] indentation
-y, --yaml [n]     Output as YAML with [n] indentation
-b, --bail         Exit as soon as the first error is encountered
-V, --no-validate  Create the output file, even if it's invalid
```

## Other Tools

All the schemas in this repository are valid JSON Schemas, compliant with the [JSON-Schema, Draft 4](http://json-schema.org/documentation.html). As such, they can be used with a number of tools to validate arbitrary JSON blobs:

### JavaScript tools:

#### [is-my-json-valid](https://github.com/mafintosh/is-my-json-valid)

```
var https = require('https'),
    validate = require('is-my-json-valid');

var input = {
    /* JSON of a collection V1 */
};

// we fetch the schema from server and when it is received, 
// validate our input JSON against it.
https.get('https://schema.getpostman.com/json/collection/v1/', function (response) {
    var body = '';

    response.on('data', function (d) {
        body += d;
    });

    response.on('end', function () {
        var validate = validator(JSON.parse(body));
        console.log(validate(input) ? 'It is a valid collection!' : 'It is not a valid collection!');
    });
});
```

#### [tv4](https://github.com/geraintluff/tv4)
```
var https = require('https'),
    tv4 = require('tv4');

var input = {
    /* JSON of a collection V1 */
};

// we fetch the schema from server and when it is received,
// validate our input JSON against it.
https.get('https://schema.getpostman.com/json/collection/v1/', function (response) {
    var body = '';

    response.on('data', function (d) {
        body += d;
    });

    response.on('end', function () {
        var result = tv4.validate(input, JSON.parse(body));
        console.log((result) ? 'It is a valid collection!' : 'It is not a valid collection!');
    });
});
```

### Python tools:

#### [jsonschema](https://github.com/Julian/jsonschema)

```
import requests  # make sure this is installed
from jsonschema import validate
from jsonschema.exceptions import ValidationError

schema = requests.get('https://schema.getpostman.com/json/collection/v1/').json()

test_input = {}  # Whatever needs to be validated.

try:
    validate(test_input, schema)
except ValidationError:
    print 'It is not a valid collection!'
else:
    print 'It is a valid collection!'
```
