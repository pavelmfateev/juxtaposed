const express = require("express"),
  app = express(),
  port = 3000;

app.use(express.static(path.join(__dirname, "public")));
// Views folder and EJS setup:
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// ROUTES
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
