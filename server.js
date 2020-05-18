"use strict";

const express = require("express");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const dns = require("dns");
const url = require("url");
const bodyParser = require("body-parser");

const cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});

// Mongoose setup
const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String
});
let Url = mongoose.model("Url", urlSchema);

/* Create a new short url  */
let createShortUrl = function(url, done) {
  let urlLink = new Url(url);

  urlLink.save((err, data) => {
    if (err) return done(err);

    done(null, data);
  });
};

/* Get the real url*/
function getShortUrl(id, done) {
  Url.findOne({ shortUrl: id }, 'originalUrl', function(err, data) {
    if (err) 
      return done(err);

    done(null, data.originalUrl);
  });
}

// Post method
let counter = 1;

app.post("/api/shorturl/new", function(req, res) {  
  let urlToBeParsed = url.parse(req.body.url);
  dns.lookup(urlToBeParsed.hostname, function(err) {
    if (err)
      res.json({"error": "invalid URL" });
    
    if(urlToBeParsed.hostname === null){
     urlToBeParsed.hostname  = req.body.url; 
    }
    
    let url = { originalUrl: urlToBeParsed.hostname, shortUrl: counter++ };
    
    createShortUrl(url, function(err, data) {
      if(err)
        res.json({"error": "invalid url"});
      
      res.json({original_url: data.originalUrl , short_url: data.shortUrl});
    });
  });
});

// get url
app.get("/api/shorturl/:id", function(req, res) {
  getShortUrl(req.params.id, function(err, data) {
    if (err)
      res.json({ Error: "Url not found " + err });

    let redirectUrl = url.parse(data);
    console.log(redirectUrl.href);
    res.redirect(`https://${redirectUrl.href}/`);
  });

});
