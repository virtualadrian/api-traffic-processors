var KinesisExporter = require('../exporters/kinesisExporter.js');
var parser = require('../parsers/apiaxleParser.js');
var formatter = require('../formatters/trafficSpaces.js');

module.exports = function apiaxleKinesis(args) {
  var exporter = new KinesisExporter(args.streamName, args.region);

  this.processHit = function processHit(hit, cb) {
    var payload;
    var formattedPayload;
    try {
      payload = parser(hit);
      formattedPayload = formatter(payload);
      exporter.add(formattedPayload);
    } catch (err) {
      console.error(err);
    } finally {
      cb(null);
    }
  };
};
