/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */
var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire');

function stubFirehose(fails) {
  var putRecord = fails
                  ? sinon.stub().callsArgWith(1, new Error('intentional error'))
                  : sinon.stub().callsArg(1, null, {});
  var putRecordBatch = fails
                       ? sinon.stub().callsArgWith(1, new Error('intentional error'))
                       : sinon.stub().callsArgWith(1, null, {});

  return {
    Firehose: sinon.stub().returns({ putRecord: putRecord, putRecordBatch: putRecordBatch }),
    putRecord: putRecord,
    putRecordBatch: putRecordBatch
  };
}

describe('kinesisExporter', function () {
  describe('add', function () {
    it('produces correct output', function () {
      var stubs = stubFirehose();
      var KinesisExporter = proxyquire('../../exporters/kinesisExporter.js', {
        'aws-sdk': { Firehose: stubs.Firehose }
      });
      var exporter = new KinesisExporter({ region: 'oz', streamName: 'teststream' });

      exporter.add('payload', function (err) {
        expect(err).to.not.exist;
        expect(stubs.putRecord.firstCall.args[0]).to.deep.equal({
          DeliveryStreamName: 'teststream',
          Record: { Data: 'payload\n' }
        });
      });
    });
  });

  describe('addBatch', function () {
    it('produces correct output', function () {
      var stubs = stubFirehose();
      var KinesisExporter = proxyquire('../../exporters/kinesisExporter.js', {
        'aws-sdk': { Firehose: stubs.Firehose }
      });
      var exporter = new KinesisExporter({ region: 'oz', streamName: 'teststream' });

      exporter.addBatch(['payload'], function (err) {
        expect(err).to.not.exist;
        expect(stubs.putRecordBatch.firstCall.args[0]).to.deep.equal({
          DeliveryStreamName: 'teststream',
          Records: [{ Data: 'payload\n' }]
        });
      });
    });

    it('sends in batches of 500', function () {
      var stubs = stubFirehose();
      var KinesisExporter = proxyquire('../../exporters/kinesisExporter.js', {
        'aws-sdk': { Firehose: stubs.Firehose }
      });
      var exporter = new KinesisExporter({ region: 'oz', streamName: 'teststream' });

      var rows = [];
      for (var i = 0; i < 501; i++) {
        rows.push('a');
      }

      exporter.addBatch(rows, function (err) {
        expect(err).to.not.exist;
        console.log('a');
        expect(stubs.putRecordBatch.firstCall.args[0].Records.length).to.equal(500);
        console.log('b');
        expect(stubs.putRecordBatch.secondCall.args[0]).to.deep.equal({
          DeliveryStreamName: 'teststream',
          Records: [{ Data: 'a\n' }]
        });
        console.log('c');
        expect(stubs.putRecordBatch.calledTwice).to.be.true;
        console.log('d');
      });
    });
  });
});