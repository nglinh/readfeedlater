
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
var db = monk('localhost:27017/readfeedlater');

var app = express();

var env = process.env;

var nextUserId = 0;


function addUser (source, sourceUser) {
	console.log(sourceUser);
	var curUser = {};
	collection = db.get('usercollection');
	if (collection){
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
	}
	else {
		collection.insert({
			id: nextUserId,
			fbuid: sourceUser.id,
			name: sourceUser.name
		})
		.success(function(doc) {
			curUser = doc;
			console.log('created user');
			console.log(doc);
		})
		.error(function(err) {
			console.log('error');
			console.log(err);
		});
		nextUserId++;
	}
  // if (arguments.length === 1) { // password-based
  // 	user = sourceUser = source;
  // 	user.id = ++nextUserId;
  // 	return usersById[nextUserId] = user;
  // } else { // non-password-based
  // 	user = usersById[++nextUserId] = {id: nextUserId};
  // 	user[source] = sourceUser;
  // }
  return curUser;
}

//Facebook login
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
	// return usersByFbId[fbUserMetadata.id] ||
	// (usersByFbId[fbUserMetadata.id] = 
		return addUser('facebook', fbUserMetadata);
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

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
}

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});