'use strict';

// Module imports
var restify = require('restify-clients')
  , express = require('express')
  , http = require('http')
  , https = require('https')
  , bodyParser = require('body-parser')
  , fs = require("fs")
  , _ = require('lodash')
  , log = require('npmlog-ts')
  , cors = require('cors')
;

// ************************************************************************
// Main code STARTS HERE !!
// ************************************************************************

log.stream = process.stdout;
log.timestamp = true;

// Main handlers registration - BEGIN
// Main error handler
process.on('uncaughtException', function (err) {
  log.info("","Uncaught Exception: " + err);
  log.info("","Uncaught Exception: " + err.stack);
});
// Detect CTRL-C
process.on('SIGINT', function() {
  log.info("","Caught interrupt signal");
  log.info("","Exiting gracefully");
  process.exit(2);
});
// Main handlers registration - END

log.level = 'verbose';

// REST engine initial setup
const SSLPATH = '/u01/ssl';
//const SSLPATH = '/Users/ccasares/Documents/Oracle/Presales/Initiatives/Wedo/setup/wedoteam.io.certificate';

const optionsSSL = {
  cert: fs.readFileSync(SSLPATH + "/certificate.fullchain.crt").toString(),
  key: fs.readFileSync(SSLPATH + "/certificate.key").toString()
};

// Instantiate classes & servers
const restURI = '/iot/api/v2/apps/:appid/messages'
    , PORT    = 9004
;
var restapp       = express()
//  , restserver    = https.createServer(optionsSSL, restapp)
  , restserver    = http.createServer(restapp)
;

restapp.use(bodyParser.urlencoded({ extended: true }));
restapp.use(bodyParser.json());
restapp.use(cors());

const IOTHOST = 'ccasares-dev.frastg.iot.ocs.oraclecloud.com'
    , IOTUSERNAME = 'wedo'
    , IOTPASSWORD = 'Welcome2019#'

var client = restify.createJsonClient({
  url: 'https://' + IOTHOST,
  rejectUnauthorized: false,
  headers: {
    "content-type": "application/json"
  }
});

client.basicAuth(IOTUSERNAME, IOTPASSWORD);

restapp.get(restURI, (req,res) => {
  let query = "";
  _.forEach(Object.keys(req.query), q => {
    query += "&" + q + '=' + req.query[q];
  });
  query = query.replace("&", "?");  // Only replaces first one

  let URI = restURI.replace(":appid", req.params.appid);
  URI += query;

  client.get(URI, (err, req_, res_, obj) => {
    var j = JSON.parse(res_.body);
    var items = j.items;
    _.forEach(items, e => {
      e.eventTimeAsString = _.trimEnd(_.split(e.eventTimeAsString, 'T')[1],'Z');
    });
    res.status(200).json(_.sortBy(items, "eventTime"));
  });
});

restapp.listen(PORT, function() {
  log.info("","REST server running on http://localhost:" + PORT + restURI);
});

