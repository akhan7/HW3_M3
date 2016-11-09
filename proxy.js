var http      = require('http');
var httpProxy = require('http-proxy');
var redis = require('redis')
var express = require('express')
var app = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})


client.del("redirects");

var ports = {};
var proxy   = httpProxy.createProxyServer(ports);
var server  = http.createServer(function(req, res)
{	client.rpoplpush('serverList','serverList',function(err, prt) {
		if (err) throw err;
		proxy.web( req, res, {target: "http://127.0.0.1:"+prt } );
		console.log("Redirecting to : " + prt)
	})
});

console.log("Proxy server on port: 9000");
server.listen(9000)