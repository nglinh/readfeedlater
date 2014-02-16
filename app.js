
/**
 * Module dependencies.
 */

 var express = require('express');
 var routes = require('./routes');
 var user = require('./routes/user');
 var http = require('http');
 var path = require('path');
 var everyauth = require('everyauth');

//mongo setup
var mongo = require('mongodb');
var monk = require('monk');
var db = monk(process.env.MONGOHQ_URL);

var app = express();

var env = process.env;

var nextUserId = 0;

everyauth.facebook 					//default entry: /auth/facebook
.appId(env.FACEBOOK_APP_ID)
.appSecret(env.FACEBOOK_SECRET)
.handleAuthCallbackError( function (req, res) {
    // If a user denies your app, Facebook will redirect the user to
    // /auth/facebook/callback?error_reason=user_denied&error=access_denied&error_description=The+user+denied+your+request.
    // This configurable route handler defines how you want to respond to
    // that.
    // If you do not configure this, everyauth renders a default fallback
    // view notifying the user that their authentication failed and why.
})
.findOrCreateUser( function (session, accessToken, accessTokExtra, fbUserMetadata) {
	session.accessToken = accessToken;
	session.fbuid = fbUserMetadata.id;
	var curUser = {};
	var collection = db.get('usercollection');
	return collection.find({
		fbuid: fbUserMetadata.id
	}).success( function(doc) {
		if (doc.length == 0){
			collection.insert({
				id: nextUserId,
				fbuid: fbUserMetadata.id,
				name: fbUserMetadata.name
			}).success(function(doc) {
				curUser = doc;
				session.userid = curUser.id;
				console.log(session.userid);
				console.log(session.fbuid);
				session.save();
				nextUserId++;
			});
		}
		else {
			console.log('found');
			curUser = doc[0];
			session.userid = curUser.id;
			session.save();
			console.log(session.userid);
			console.log(session.fbuid);
		}
	});
})
.redirectPath('/');


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(everyauth.middleware());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));



var loggedin = function(req,res,next){
	if (typeof req.session.accessToken != 'undefined' && typeof req.session.userid != 'undefined'){
		next();
	}
	else{
		console.log(req.session.accessToken);
		console.log(req.session);
		res.redirect('/auth/facebook', 403);
	}
};

app.post('/api/savefeed', loggedin, function(req,res){
	feed = req.body;
	console.log(result);
	var collection = db.get('feedcollection');
	var result;
	collection.insert({
		id: feed.id,
		url: feed.url,
		userid: req.session.userid,
		fbuid: req.session.fbuid
	}, function(err,doc) {
		if (err){
			console.log(err);
		}
		else {
			console.log("got");
			console.log(doc);
			result = doc;
			res.json(result, 201);
		}
	});	
});

app.get('/feeds', loggedin, function(req,res){
	var collection = db.get('feedcollection');
	console.log(req.session);
	collection.find({
		userid:req.session.userid
	}, function(err, doc) {
		if(!err){
			res.json(doc,200);
		}
	})
});

var isOwner = function(req,res,next){
	var collection = db.get('feedcollection');
	collection.find({
		id:req.body.id
	}).success(function(doc) {
		if(doc.length != 0){
			if (req.session.userid === doc.userid){
				next();
			}
			else {
				res.redirect('/auth/facebook', 403);
			}
		}
		else{
			res.send('no such feed');
		}
	})
};

app.del('/api/feeds/:id', loggedin, isOwner, function(req,res) {
	var collection = db.get('feedcollection');
	collection.remove({
		id:req.body.id
	}).success(function(doc){
		res.send('success');
	}).error(function(err){
		console.log(error);
		res.send('error');
	})
});

app.get('/user');



// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
}

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
