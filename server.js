var express    = require('express');
var app        = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport	= require('passport');
var config      = require('./config/database'); // get db config file
var User        = require('./app/models/user'); // get the mongoose model
var port        = process.env.PORT || 8090;
var jwt         = require('jwt-simple');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use(morgan('dev'));

app.use(passport.initialize());

app.get('/', function(req, res){
   res.send('HELLO! The API is at http:localhost:' + port + '/api');
});

app.listen(port);
console.log('App is listening at: http://localhost:' + port);

mongoose.connect(config.database);

require('./config/passport')(passport);

var apiRoutes = express.Router();

apiRoutes.post('/signup', function(req, res){
    if(!req.body.name || !req.body.password){
        res.json({success:false, msg: 'Please pass name and password.'});
    } else {
        var newUser = new User({
            name: req.body.name,
            password: req.body.password
        });

        newUser.save(function(err){
            if(err){
                return res.json({success: false, msg: 'Username already exists.'});
            }
            res.json({success: true, msg: 'Successfully created new user'});
        })
    }
});

apiRoutes.post('authenticate', function(req, res){
    console.log(req.body);
   User.findOne({
       name: req.body.name
   }, function(err, user){
       if(err) throw err;
       if(!user) {
           res.send({success:false, msg: 'Authentication failed. User not found.'});
       } else {
           user.comparePassword(req.body.password, function(err, isMatch){
               if(isMatch && !err){
                   var token = jwt.encode(user, config.secret);
                   res.json({success: true, token: 'JWT' + token});
               } else {
                   res.send({success: false, msg: 'Authentication failed. Wrong Password.'});
               }
           });
       }
   })
});

// connect api routes under /api/*

app.use('/api', apiRoutes);