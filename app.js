//Storing configuration in the environment separate from code
require('dotenv').config();
// require modules
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
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

async function main() {
  await mongoose.connect(URL);

    // create Mongoose schema
    const bookListSchema = new mongoose.Schema({
        author: String,
        name: String
    });
    const bookReviewSchema = new mongoose.Schema({
        author: String,
        name: String,
        rating: Number,
        content: String
    });

    const Book = mongoose.model('Book', bookListSchema);
    const Review = mongoose.model('Review', bookReviewSchema);

    // /BOOKS route
    app.get('/books', function(req, res){
        Book.find(function(err, foundBooks){
            if(!err){
                res.send(foundBooks);
            } else {
                res.send(err);
            }
        });
    });
    app.post('/books', function(req, res){
        // create a new book through the post request
        const newBook = new Book ({
            author: req.body.bookAuthor,
            name: req.body.bookTitle
        });
        // save new book to mongoDB
        newBook.save(function(err){
            if (!err) {
                res.send('A new book successfully added.')
            } else {
                res.send(err);
            }
        });
    });
    

    // /REVIEWS route
    app.get('/reviews', function(req, res){
        Review.find(function(err, foundReviews){
            if(!err){
                res.send(foundReviews);
            } else {
                res.send(err);
            }
        });
    });
    app.post('/reviews', function(req, res){
        // create a new book through the post request
        const newReview = new Review ({
            author: reviewBookAuthor,
            name: reviewBookTitle,
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
    });

}

app.listen(3000, function() {
  console.log('Server started on port 3000');
});