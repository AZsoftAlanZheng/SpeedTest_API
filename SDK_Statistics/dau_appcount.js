//計算queryDate+queryAppID，每個deviceid在SDK_Statistics內的core版號
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

var queryDate = 20171001;
var queryVers = [6,7,8];
var running = 0;

var results = {};

var findDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('85kvmbzhq2gdJIXW5iNhM1CLD5CJ1Ua1lQC0hBwA.DevIDPerDay');// BJ/APM
  for (var index in queryVers) {
    let queryVer = queryVers[index];
    collection.distinct("AppID",{"Date":queryDate,"Version":{$eq:queryVer}},function(err, docs) {
      assert.equal(err, null);
      console.dir(docs);
      if(docs.length >0)  {
        for (var index in docs) {
            let appid = docs[index];
            running += 1;
            var collection = db.collection('85kvmbzhq2gdJIXW5iNhM1CLD5CJ1Ua1lQC0hBwA.DevIDPerDay');// BJ/APM
            collection.find({"Date":queryDate,"Version":{$eq:queryVer},"AppID":{$eq:appid}}).count(function(err, count) {
              assert.equal(err, null);
              //console.log("DevID:"+obj.DevID+", docs[0].Content.Core:"+ver);
              if(results[appid] == null) {
                results[appid] = {};
              }
              if(results[appid][queryVer] == null) {
                results[appid][queryVer] = 0;
              }
              results[appid][queryVer] = count;
              running -= 1;
              if(running==0) {
                callback();
              }
            });
        }
      } else {
        callback();
      }
    });
  }
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
        console.log("appid:" + k);
        for(var i in queryVers) {
          var ver = queryVers[i];
          console.log("\tver:" + ver + ", count:" + results[k][ver]);
        }
      }
  }
  });
});