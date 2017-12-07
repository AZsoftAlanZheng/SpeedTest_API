//計算queryDate+queryAppID，每個deviceid在SDK_Statistics內的core版號
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

var queryDate = 20170921;
var queryAppID = 'za8umbzhV32pFTo4vQpzdR-JbVRmRRzPlQDdGTYA';
var running = 0;

var results = {};

var findDocuments = function(db, callback) {
  // Get the documents collection
  // var collection = db.collection('jf8umbzhK2BwPLUOW3-XcDhfH_wrzDu_lQC032sA.DroiObjectApi');// Alpha/jmeter
  var collection = db.collection('85kvmbzhq2gdJIXW5iNhM1CLD5CJ1Ua1lQC0hBwA.DevIDPerDay');// BJ/APM
  // Find some documents
  collection.find({'Date':queryDate,'AppID':queryAppID},{DevID:1}).limit(800000).toArray(function(err, docs) {
    assert.equal(err, null);
    // assert.equal(2, docs.length);
    // console.log("Found the following records");
    // console.dir(docs);
    console.log("Data:"+queryDate+", AppID:"+queryAppID+", Count:"+docs.length);

    if(docs.length >0)  {
      docs.forEach(function(obj) {
        // console.log(obj.DevID);
        running += 1;
        var collection = db.collection('85kvmbzhq2gdJIXW5iNhM1CLD5CJ1Ua1lQC0hBwA.SDK_Statistics');// BJ/APM
        collection.find({'DeviceID':obj.Dev,'AppID':queryAppID},{Content:1}).sort({'_ModifiedTime':-1}).limit(1).toArray(function(err, docs) {
          assert.equal(err, null);
          // assert.equal(2, docs.length);
          // console.log("Found the following records");
          // console.dir(docs);
          var ver = docs[0].Content.Core;
          //console.log("DevID:"+obj.DevID+", docs[0].Content.Core:"+ver);
          if(results[ver] == null) {
            results[ver] = 1;
          } else {
            results[ver] += 1;
          }
          running -= 1;
          if(running==0) {
            callback(docs);
          }
        });
        
      });
    } else {
      callback(docs);
    }
  });
}

// Connection URL
// var url = 'mongodb://bass:F4mIfVIYGUBYBiQE@10.128.112.181:7379/baas?authSource=admin'; //Alpha
var url = 'mongodb://bass:F4mIfVIYGUBYBiQE@10.10.50.51:7379/baas1?authSource=admin';  //BJ
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");
  console.log("Current database", db.databaseName);
  findDocuments(db, function() {
    db.close();
    for (var k in results){
      if (results.hasOwnProperty(k)) {
           console.log("ver:" + k + ", count:" + results[k]);
      }
  }
  });
});