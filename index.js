"use strict"

const express = require('express');
const app = express();
const path = require('path');
const mongo = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/myUrls";

app.use(express.static(path.join(__dirname, 'public')));
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/public/index.html');
});

// when you try to append url to url, it becomes a new path
// put * in path to make it a param
app.get('/new/:link*', (req, res) => {
  const link = req.url.slice(5);
  mongo.connect(url, (err, db) => {
    const collection = db.collection('urlCollections');
    let num = Math.floor(100000 + Math.random() * 900000);
    num = num.toString().substr(0, 4);
    collection.insert({
      [num]: link
    }, (err, documents) => {
      if(err) throw(err);
      res.send({"original_url":link, "short_url":`http://localhost:3000/${num}`})
    });
    db.close();
  });
});

app.get('/:query', (req, res) => {
  const query = req.params.query;
  mongo.connect(url, (err, db) => {
    const collection = db.collection('urlCollections');
    collection.find({}, {
      [query]: 1
    }).toArray((err, docs) => {
      res.redirect(301, docs[1][query]);
    });
    db.close();
  });
});

app.listen(3000);
