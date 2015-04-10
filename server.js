var express = require('express')
var app = express()
var azure = require('azure-storage');

var STORAGE_KEY = "WhayVYIGUPHk07sI/9zF6dvPNKRDnqbsRMunTVFclgzojOu8l4PNfgSJezeUF+ZDgAp+In7ryiApcRw6QVcnfA==";
var STORAGE_ACCOUNT = "storage26";
var blobService = azure.createBlobService(STORAGE_ACCOUNT, STORAGE_KEY);

var tableService = azure.createTableService(STORAGE_ACCOUNT, STORAGE_KEY);

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var table = "todo2";
tableService.createTableIfNotExists(table, function(error, result, response) {
	console.log("Table create result");
});

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

app.get('/todo/add', function(req,res,next){
	var priority = req.query.priority;
	var text = req.query.text;
	
	var entGen = azure.TableUtilities.entityGenerator;
	var entity = {
	  PartitionKey: entGen.Int32(priority),
	  RowKey: entGen.String(text),
	  priority: entGen.Int32(priority)
	};
	tableService.insertEntity(table, entity, function(error, result, response) {
	  if(error) {
		return next(error);
	  }
	  res.redirect('/todo');
	});
});

app.get('/todo', function(req,res,next){
	var is_priority = (req.query.priority);
	var query = new azure.TableQuery();
	var entGen = azure.TableUtilities.entityGenerator;
	if(is_priority)
	  query = query.where('priority ge ?', 9);
	console.log(query);
	tableService.queryEntities(table, query, null, function(error, result, response) {
	
		  if(error)
			return next(error);
			
			var html = '<form action="/todo/add"><input name="priority" placeholder="Priority"><input name="text" placeholder="Task"><input type="submit" /></form>';
			html += "<br><a href='/todo?priority=true'>Priority only</a> <a href='/todo'>All</a><br>"
			var length = result.entries.length;
			//console.log(length);
			for(var i=0; i<length; ++i) {
				var item = result.entries[i];
				//console.log(item.PartitionKey);
				html += item.PartitionKey._ + " " + item.RowKey._ + "<br>";
			}
		
		
		//console.log(result);
		res.send(html);
	  
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