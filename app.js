
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
		session.fbuid = fbUserMetadata.id;					//stick to session
		return addUser('facebook', fbUserMetadata);
	})
.redirectPath('/');

var addUser  = function(source, sourceUser) {
	console.log(sourceUser);
	var curUser = {};
	var collection = db.get('usercollection');
	collection.find({
		fbuid: sourceUser.id
	},function(err,res){
		if (!err){
			if (res.length == 0){
				collection.insert({
					id: nextUserId,
					fbuid: sourceUser.id,
					name: sourceUser.name
				}, function(e, res){
					curUser = res[0];
				});
				nextUserId++;
			}
			else {
				console.log('found');
				curUser = res[0];
				console.log(res);
			}
		}
	});
	return curUser;
};


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
	if (req.session.accessToken){
		next();
	}
	else{
		res.send("please log in");
	}
};

app.post('/api/savefeed', loggedin, function(req,res){
	feed = req.body;
	console.log(result);
	var collection = db.get('feedcollection');
	var result;
	collection.find({
		id: feed.id
	}, function(err,doc) {
		if (err) {
			console.log(err);
		}
		else {
			if(doc.length == 0){
				collection.insert({
					id: feed.id,
					url: feed.url
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
			}
			else {
				console.log('found');
				console.log(doc);
				result = doc[0];
				res.json(result, 201);
			}
		}
	});
});



// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
}

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
