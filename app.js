//Storing configuration in the environment separate from code
require('dotenv').config();
// require modules
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-find-or-create');

const URL = process.env.URL;

const app = express();

// set view engine to use EJS as a templating engine
app.set('view engine', 'ejs');
// set body-parser to pass requests from the web page
app.use(bodyParser.urlencoded({
  extended: true
}));
// use the public directory to store the static files
app.use(express.static('public'));

///////////////////////// AUTHENTICATION CONFIGURATIONS ////////////////////////////////////////////

// use the session package to set up the session
// set up initial configurations for the session
app.use(session({
    secret: process.env.SECRET_WORD,
    resave: false,
    saveUninitialized: false
}));
// initialize the passport to start using it
app.use(passport.initialize());
// tell the app to use the passport to set up the session
app.use(passport.session());



// connect mongoose to MongoDB
main().catch(err => console.log(err));


async function main() {
  await mongoose.connect(URL);

    // create Mongoose schema
    const userSchema = new mongoose.Schema({
        email: String,
        password: String,
        googleId: String
    });

    // plugin for hash and salt users passwords
    userSchema.plugin(passportLocalMongoose);
    // plugin for mongoose findOrCreate user
    userSchema.plugin(findOrCreate);

    const bookListSchema = new mongoose.Schema({
        author: String,
        title: String
    });
    const bookReviewSchema = new mongoose.Schema({
        author: String,
        title: String,
        rating: Number,
        content: String
    });

    const User = mongoose.model('User', userSchema);

    // use static authenticate method of model in LocalStrategy (npm passport-local-mongoose)
    passport.use(User.createStrategy());

    // use serialize and deserialize of model for passport session support (passportjs.com)
    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
    
      passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
          done(err, user);
        });
      });

    // The Google authentication strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:3000/auth/google/books',
        // userProfileURL: 'https://googleapis.com/oauth2/v3/userinfo'
      },
      function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
          return cb(err, user);
        });
      }
    ));

    const Book = mongoose.model('Book', bookListSchema);
    const Review = mongoose.model('Review', bookReviewSchema);


    //////////////////////////////////////////// ROUTES ///////////////////////////////////////////////

    app.get('/', (req, res) => {
        res.render('home');
    });

    // Authentication route through Google
    app.get("/auth/google",
    passport.authenticate("google", {scope: ["profile"] })
    );

    app.get("/auth/google/books",
    passport.authenticate("google", { failureRedirect: "/login'" }),
    function(req, res) {
      // Successful authentication, redirect to the books page
      res.redirect("/books");
    });


    app.get('/login', (req, res) => {
        res.render('login');
    });

    app.get('/register', (req, res) => {
        res.render('register');
    });

    app.get('/books', (req, res) => {
        if(req.isAuthenticated()) {
            res.render('books');
        } else {
            res.redirect('login');
        }
    });

    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    ///////////////////////////////////// REGISTER ROUTE ///////////////////////////////////////////////////////

    app.post('/register', (req, res) => {
        User.register({username: req.body.username}, req.body.password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect('/register');
            } else {
                passport.authenticate('local')(req, res, function() {
                    res.redirect('/books');
                })
            }
        })        
    });

    app.post('/login', (req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function(err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate('local')(req, res, function() {
                    res.redirect('/books');
                });
            }
        });
    });

    ///////////////////////////////////// Requests targetting ALL books and reviews ///////////////////////////////////////////////////////

    // BOOKS route
    app.route('/books')
        .get(function(req, res){
            Book.find(function(err, foundBooks){
                if(!err){
                    res.send(foundBooks);
                } else {
                    res.send(err);
                }
            });
        })
        .post(function(req, res){
            // create a new book through the post request
            const newBook = new Book ({
                author: req.body.author,
                title: req.body.title
            });
            // save new book to mongoDB
            newBook.save(function(err){
                if (!err) {
                    res.send('A new book successfully added.')
                } else {
                    res.send(err);
                }
            });
        })
        // delete ALL books in a list
        .delete(function(req, res){
            Book.deleteMany(function(err) {
                if (err){
                    res.send('All books successfully deleted.')
                } else {
                    res.send(err);
                }
            });
        });


    // REVIEWS route
    app.route('/reviews')
        // find all reviews
        .get(function(req, res){
            Review.find(function(err, foundReviews){
                if(!err){
                    res.send(foundReviews);
                } else {
                    res.send(err);
                }
            });
        })
        // create a new review
        .post(function(req, res){
            const newReview = new Review ({
                author: reviewBookAuthor,
                title: reviewBookTitle,
                rating: bookRating,
                content: reviewContent
            });
            // save review to mongoDB
            newReview.save(function(err){
                if (!err) {
                    res.send('A new review successfully added.')
                } else {
                    res.send(err);
                }
            });
        })
        // delete ALL reviews
        .delete(function(req, res){
            Review.deleteMany(function(err) {
                if (err){
                    res.send('All reviews successfully deleted.')
                } else {
                    res.send(err);
                }
            });
        });


    ///////////////////////////////////// Requests targetting a SPECIFIC books and reviews ///////////////////////////////////////////////////////
    //find one book in the bucket
    app.route('/books/:title')
        .get((req, res) => {
            Book.findOne({title: req.params.title}, function(err, foundBook){
                if (!err) {
                    res.send(foundBook);
                } else {
                    res.send('No books matching this title was found.');
                }      
            });
            
        })
        //update author AND title
        .put((req, res) => {
            Book.findOneAndUpdate(
                {title: req.params.title},
                {author: req.body.author, title: req.body.title},
                {overwrite: true},
                function(err){
                    if(!err){
                        res.send("The book successfully updated.");
                    } else {
                        res.send(err);
                    }
                }
            );

        })
        // update title OR author
        .patch((req, res) => {
            Book.findOneAndUpdate(
                {title: req.params.title},
                {$set: req.body},
                function(err){
                    if(!err){
                        res.send("The book successfully updated.");
                    } else {
                        res.send(err);
                    }
                }
            );
        })
        // delete a specific book
        .delete((req, res) => {
            Book.deleteOne(
                {title: req.params.title},
                function(err){
                    if(!err){
                        res.send("The book successfully deleted.");
                    } else {
                        res.send(err);
                    }
                }
            );
        });
      

}







app.listen(3000, function() {
  console.log('Server started on port 3000');
});