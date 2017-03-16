

var express = require('express');
var graphqlHTTP = require('express-graphql');
var schema = require('./src/schema.js');
var compression = require('compression');
var fs = require('fs');
var app = express();

app.use('/', (req,res) => res.redirect('/graphql'));
app.use('/graphql', graphqlHTTP({
  schema: Schema,
  graphiql: true,
}));


//var indexFile = fs.readFileSync('index.html', 'utf8');
//app.use(compression());

//app.get('/', function(req, res) {
//  res.type('html');
//  res.status(200).send(indexFile);
//});
//app.use('/static', express.static('static'));
var port = process.env.PORT || 3000;

app.listen(port);
console.log('App started on port: ' + port);
