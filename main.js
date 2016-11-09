var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
var portArg = process.argv[2];

// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})
client.rpush('serverList', portArg)

// HTTP SERVER
var server = app.listen(3000, 'localhost', function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})


///////////// WEB ROUTES

app.get('/', function(req, res) {
  res.send('hello world')
})

// SET Function
app.get('/set', function(req, res){
	client.set('myKey', 'this message will self-destruct in 10 seconds', function(err, value){
		res.send(value)
	});
	client.expire('myKey', 10);
})

// GET Function
app.get('/get', function(req, res){
	client.get('myKey', function(err, value){
		if(value)
			res.send(value)
		else
			res.send("Key has expired! Request served at: " + req.client.server._connectionKey)
	})

})

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next) 
{
	console.log(req.method, req.url);
	client.lpush('recentVisit', req.url, function(err, reply){})
	client.ltrim('recentVisit', 0, 9, function(err, reply){})
	next(); // Passing the request to the next handler in the stack.
});

// RECENT Function
app.get('/recent', function(req, res){
	 client.lrange('recentVisit', 0, 9, function(err, urls){
	 	res.send(urls);
	 })
})

// UPLOAD Function
app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files

   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		client.rpush('images', img, function(err, data){})
		});
	}

   res.status(204).end()
}]);

// MEOW Function
app.get('/meow', function(req, res) {
	client.lpop('images', function(err, imagedata)
	{
		if (err) throw err
		res.writeHead(200, {'content-type':'text/html'});
		if (imagedata)
   			res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>");
		else
			res.write("Sorry no images uploaded!")
   	res.end();
	})
})

// SPAWN Function
app.get('/spawn', function(req, res) {
	// spawning new server at port 3001
    portArg = parseInt(portArg) + 1;
    var server = app.listen(portArg, function () {
      var host = server.address().address
      var port = server.address().port
      client.rpush('serverList', port)
      console.log('Example app listening at http://%s:%s', host, port)
      
    });
    var status = "New server spawned at : " + portArg;
    res.send(status);
});

// DESTROY Function
app.get('/destroy', function(req, res) {
   
    client.LLEN('serverList', function(err, length) {
        console.log('Number of servers: ' + length)
        if (length > 1){
        	var random = Math.floor((Math.random() * length) + 0);
        	console.log(random)
        	client.lindex('serverList', random, function(err, index){
        		client.lrem('serverList', 1, index);  
    		});
    	var status = "Random Server Destroyed";
    	res.send(status);
        }
        else
        	res.send('Sorry only 1 server is present. Please spawn more to destroy.')
        
    });
});

// LISTSERVERS Function
app.get('/listservers', function(req, res) {
    client.lrange("serverList", 0, -1, function(err, urls) {
        res.send(urls);
    });
});

