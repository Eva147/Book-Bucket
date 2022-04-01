//Storing configuration in the environment separate from code
require('dotenv').config();
// require modules
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
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
app.use(express.static("public"));
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
        content: String
    });

    const Book = mongoose.model('Book', bookListSchema);
    const Review = mongoose.model('Review', bookReviewSchema);



}

app.listen(3000, function() {
  console.log("Server started on port 3000");
});