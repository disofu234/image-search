var express = require("express");
var mongo = require("mongodb").MongoClient;
var request = require("request");

var app  = express();

mongo.connect(process.env.MONGODB_URI, function(err, db){
    if (err) throw err;
    
    db.createCollection("searches");
    
    var searches = db.collection("searches");
    
    app.get("/", function(req, res) {
        res.send("Hello"); 
    });
    
    app.get("/:search", function(req, res) {
        var search = req.params.search;
        var offset = (req.query.offset) ? req.query.offset : 0;
        var count = (req.query.count) ? req.query.count : 10;
        
        var search_timestamp = {
            "search": search,
            "time": new Date().toDateString()
        };
        
        searches.insert(search_timestamp);
        
        var request_url = {
            url: "https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=" + search + "&offset=" + offset + "&count=" + count,
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.API_KEY
            }
        };
        
        request(request_url, "json", function(err, json_res, body) {
            if (err) throw err;
            
            var search_res = JSON.parse(body);
            
            var search_array = [];
            
            search_res.value.forEach(function(val) {
                var search_obj = {
                    "name": val.name,
                    "img_url": val.contentUrl,
                    "source_url": val.hosPageUrl
                };
                
                search_array.push(search_obj);
            });
            
            res.json(search_array);
        });
    });
    
    app.get("/latest", function(req, res) {
        var latest = [];
        
        searches.find({}, { _id:0 }).sort({$natural: -1}).limit(10).toArray(function(err, search) {
            if(err) throw err;
            
            res.send(search);
        });
    });
    
    app.listen(process.env.PORT);
});

