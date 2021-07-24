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
// NEW - renders a form
// **********************************
app.get("/new", (req, res) => {
  res.render("new");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
