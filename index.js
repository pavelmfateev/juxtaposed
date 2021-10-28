const express = require("express"),
  app = express(),
  path = require("path"),
  port = 3000,
  ejsMate = require("ejs-mate"),
  mongoose = require("mongoose"),
  reviewRoutes = require("./routes/reviews.js"),
  spotifyRoutes = require("./routes/spotify.js");

mongoose.set("useFindAndModify", false);
mongoose.connect("mongodb://localhost:27017/juxtaposed", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

//To parse form data in POST request body:
app.use(express.urlencoded({ extended: true }));
// To parse incoming JSON in POST request body:
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
// Views folder and EJS setup:
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(reviewRoutes);
app.use(spotifyRoutes);

// ROUTES
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
