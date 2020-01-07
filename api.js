var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const sanitize = require('sanitize-html');

// API for the program

var mongodb;

// the tokens used throughout the program
let dbTokens;
let dbRegex;

// var mongoURL = "mongodb://localhost:27017/code-explainer";
// var mongoURL = "mongodb+srv://chris:Racecar27!@code-explainer-nfphc.mongodb.net";
const mongoURL = "mongodb+srv://chris:Racecar27!@code-explainer-nfphc.mongodb.net/test?retryWrites=true";
// const mongoURL = "mongodb://chris:Racecar27!@code-explainer-shard-00-00-nfphc.mongodb.net:27017,code-explainer-shard-00-01-nfphc.mongodb.net:27017,code-explainer-shard-00-02-nfphc.mongodb.net:27017/test?ssl=true&replicaSet=code-explainer-shard-0&authSource=admin&retryWrites=true"

const client = new MongoClient(mongoURL, { useNewUrlParser: true });

client.connect(mongoURL, async function(err, client) {
  if(err) { throw err; }
  console.log("MongoDB connected");
  mongodb = client.db("code-explainer");
  // let temp = await client.db("code-explainer").collection("test").find({}).toArray();
  // console.log(temp);
});

let prevLang = "";

router.get('/', function(req, res) {
  res.send('TESTING');
})

router.get('/rules/:lang', async function(req, res) {

  if (mongodb) {
    let tokens = JSON.parse(req.query.tokens);
    let lang = req.params.lang;

    if (!dbTokens || prevLang != lang){
      dbTokens = await mongodb.collection(lang + "TokenRules").find({}).toArray();
    }

    if (!dbRegex || prevLang != lang){
      dbRegex = await mongodb.collection(lang + "RegexRules").find({}).toArray();
    }

    let rules = {};
    // First make sure we have all our stuff
    if (dbTokens && dbRegex && tokens){
      tokens.forEach(token => {
        let tokenSig = `${token.type}:${token.value}`;  // Get the token signature
        let found = dbTokens.find(val => val.token == tokenSig); // lets see if it's found in the tokens database
        if (found) {  // If so, then we just stick it in our return result
          found.html = sanitize(found.html, {
            allowedTags: sanitize.defaults.allowedTags.concat([ 'h1', 'h2' ])
          });  // Just to make sure all our input is squeeky clean
          rules[tokenSig] = found;
        } else { // Otherwise, we check the regex database
          
          found = dbRegex.find(val => {

            if (!val.regex){ // If we don't have a regex value, then we just check if the types match
              return val.tokenType == token.type;
            } else {
              // Otherwise we check to see if 
              let regy = new RegExp(val.regex, 'g');
              let result = regy.test(token.line) && val.tokenType == token.type;
              return result;
            }

          });
          if (found) {
            found.html = sanitize(found.html, {
              allowedTags: sanitize.defaults.allowedTags.concat([ 'h1', 'h2' ])
            });
            rules[tokenSig] = found;
          } else {
            // console.log("Token not found: ", token);
          }
        }
      });
    }
    res.status(200).send(JSON.stringify(rules));
  } else {
    res.status(500).send("Unable to access database");
  }
});

router.post('/feedback', function(req, res) {
  if (mongodb){
    mongodb.collection("javascriptFeedback").insert(req.body, function (err, resp) {
      if (err) {
        res.status(500).send("ERR");
        throw err;
      }
      res.status(200).send("OK");
    });
  }
});

router.post('/stat', async function (req, res) {
  if (mongodb) {
    let stats = await mongodb.collection("javascriptStats").find({tag: req.body.tag}).toArray()    
    if (stats.length > 0) {
      mongodb.collection("javascriptStats").update({tag: req.body.tag}, { $inc: { click: 1}})
    } else {
      mongodb.collection("javascriptStats").insert({tag: req.body.tag, click: 1})
    }
    res.status(200).send("OK");
  }
});


module.exports = router;