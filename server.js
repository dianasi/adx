var express = require('express')
var app = express()
var azure = require('azure-storage');

var STORAGE_KEY = "WhayVYIGUPHk07sI/9zF6dvPNKRDnqbsRMunTVFclgzojOu8l4PNfgSJezeUF+ZDgAp+In7ryiApcRw6QVcnfA==";
var STORAGE_ACCOUNT = "storage26";
var blobService = azure.createBlobService(STORAGE_ACCOUNT, STORAGE_KEY);
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

function ensureContainer(name, callback) {
	blobService.createContainerIfNotExists(name, {
		publicAccessLevel: 'blob'
	}, function(err, created){
		if(err) return callback(err);
		callback(null);
	});
}

function uploadFile(file, callback) {
	var container = 'main';
	ensureContainer(container, function(err) {
		if(err) return callback(err);
		
		var path = file.path;
		var name = file.originalFilename;
		
		blobService.createBlockBlobFromLocalFile(container, name, path, callback);
	});
}
function getUrl(container, blob) {
	var sharedAccessPolicy = { AccessPolicy: { Expiry: azure.date.minutesFromNow(60) } };
	var sasUrl = blobService.getUrl(container, blob, sharedAccessPolicy);
	return sasUrl;
}

function getFilesList(callback) {
	blobService.listBlobsSegmented('main', null, {}, function(err, list) {
		if(err) return callback(err);
		
		var result = [];
		list.entries.forEach(function(f){
			result.push({
				name: f.name,
				url: getUrl('main', f.name)
			});
		});
		callback(null, result);
	});
	//getBlobUrl
}

app.post('/upload', multipartMiddleware, function(req, res, next) {
	uploadFile(req.files.file1, function(err) {
		if(err) return next(err);
		
		res.redirect('/');
	});
});

app.get('/', function (req, res, next) {
	var form = '<form action="upload" method="post" enctype="multipart/form-data"><input type="file" name="file1"><button type="submit">Submit</button></form>';
	var message = 'Hello Andrii Mykolayovych!';
	
	var urls = [];
	getFilesList(function(err, list) {
		if(err) return next(err);
		
		list.forEach(function(f){
			urls.push('<a href="'+f.url+'" target="_blank">'+f.name+'</a>');
		});
		
		var links = urls.join('<br>');
		res.send(message+form+'<br>'+links);
	});
	
})
var port = process.env.PORT || 3000;
var server = app.listen(port, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)

})