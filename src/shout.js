var _ = require("lodash");
var http = require("http");
var express = require("express");
var fs = require("fs");
var io = require("socket.io");
var config = require("./config");
var Client = require("./client");

module.exports = shout;

var sockets;
var clients = [];

function shout() {
	var root = config("root");
	var port = config("port");
	
	var app = express()
		.use(root, serve)
		.use(root, express.static("client"));
	
	var server = http.createServer(app);
	
	server.listen(port);
	
	sockets = io(server);
	sockets.on("connect", function(s) {
		init(s);
	});
	
	console.log("");
	console.log("shout@" + require("../package.json").version)
	console.log("");
	console.log("host  " + config("host"));
	console.log("port  " + config("port"));
	console.log("root  " + config("root"));
	console.log("mode  " + _.keys(_.pickBy(config("mode"))).join(", "));
	console.log("");
	console.log("Server started!");
	console.log("Press ctrl-c to stop");
	console.log("");
};

function serve(req, res, next) {
	if (req.url.split("?")[0] != "/") {
		return next();
	}
	
	var model = {
		"shout": JSON.stringify({
			version: require("../package.json").version,
			mode: config("mode")
		})
	};
	
	return fs.readFile(
		"client/index.html",
		"utf-8",
		function(err, file) {
			if (!err) {
				res.end(_.template(file)(model));
			}
		}
	);
}

function init(socket) {
	socket.emit("auth");
	socket.on("auth", function(data) {
		auth(socket, data);
	});
}

function auth(socket, data) {
	var client;
	
	if (data == "guest") {
		client = new Client(sockets)
	} else {
		client = new Client(sockets, "username");
	}
	
	clients.push(client);
	console.log(clients.length);
}
