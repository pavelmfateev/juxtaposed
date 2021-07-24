const express = require("express"),
  app = express(),
  path = require("path"),
  port = 3000,
  ejsMate = require("ejs-mate");

app.use(express.static(path.join(__dirname, "public")));
// Views folder and EJS setup:
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// ROUTES
app.get("/", (req, res) => {
  res.render("index");
});

// **********************************
// INDEX - renders multiple reviews
// **********************************
app.get("/reviews", async (req, res) => {
  res.render("reviews/index");
});

// **********************************
// NEW - renders a form
// **********************************
app.get("reviews/new", (req, res) => {
  res.render("reviews/new");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
