//Storing configuration in the environment separate from code
require('dotenv').config();
// require modules
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const res = require('express/lib/response');
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
// connect mongoose to MongoDB
main().catch(err => console.log(err));



app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});


async function main() {
  await mongoose.connect(URL);

    // create Mongoose schema
    const userSchema = new mongoose.Schema({
        email: String,
        password: String
    });

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
    const Book = mongoose.model('Book', bookListSchema);
    const Review = mongoose.model('Review', bookReviewSchema);


    ///////////////////////////////////// REGISTER ROUTE ///////////////////////////////////////////////////////

    app.post('/register', (req, res) => {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });
        newUser.save((err) => {
            if(err) {
                console.log(err);
            } else {
                res.render('books');
                console.log("A new user saccessfully added.")
            }
        });
    });
    app.post('/login', (req, res) => {
        const userName = req.body.username;
        const loginPassword = req.body.password; 
        console.log(userName, loginPassword);
        User.findOne({email: userName}, (err, foundUser) => {
            if (err) {
                console.log(err);
            } else {
                if(foundUser) {
                    if (foundUser.password === loginPassword) {
                        res.render('books');
                    } else {
                        alert('Try again');
                    }
                } 
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