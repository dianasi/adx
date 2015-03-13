var express = require('express')
var app = express()

app.get('/', function (req, res) {
  res.send('Hello Andrii Mykolayovych! 3000')
})
var port = process.env.PORT || 3000;
var server = app.listen(port, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)

})