"use strict"

const express = require('express');
const app = express();
const path = require('path');
const mongo = require('mongodb').MongoClient;
const url = process.env.MONGOLAB_URI;

app.use(express.static(path.join(__dirname, 'public')));
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/public/index.html');
});

// when you try to append url to url, it becomes a new path
// put * in path to make it a param
app.get('/new/:link*', (req, res) => {
  const link = req.url.slice(5);
  if(!validateURL(link)) { res.send({"error":"Invalid URL!"}); }
  else {
    saveToDB(link, req, res);
  }
});

app.get('/:query', (req, res) => {
  getURL(req, res);
});

app.listen(process.env.PORT || 3000);

function validateURL(url) {
  // Regex from https://gist.github.com/dperini/729294
  let regex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
  return regex.test(url);
}

function saveToDB(link, req, res) {
  mongo.connect(url, (err, db) => {
    const collection = db.collection('urlCollections');
    // generate random number to be database field for link
    let num = Math.floor(100000 + Math.random() * 900000);
    num = num.toString().substr(0, 4);
    collection.insert({
      [num]: link
    }, (err, documents) => {
      if(err) throw(err);
      res.send({"original_url":link, "short_url":`https://betterurl.herokuapp.com/${num}`})
    });
    db.close();
  });
}

function getURL(req, res) {
  const query = req.params.query;
  mongo.connect(url, (err, db) => {
    const collection = db.collection('urlCollections');
    collection.find({}, {
      [query]: 1
    }).toArray((err, docs) => {
      if(!docs[docs.length - 1][query]) {
        res.send({"errors":"This url is not on the database!"});
      } else {
        res.redirect(301, docs[docs.length - 1][query]);
      }
    });
    db.close();
  });
}
