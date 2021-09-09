const express = require("express"),
  app = express(),
  path = require("path"),
  port = 3000,
  ejsMate = require("ejs-mate"),
  SpotifyWebApi = require("spotify-web-api-node"),
  qs = require("qs"),
  mongoose = require("mongoose"),
  Review = require("./models/review");

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
app.get("/reviews/new", (req, res) => {
  res.render("reviews/new");
});
const gradingParameters = [
  {
    name: "Production Value",
    parameters: ["Mixing", "Instrumentation", "Vocal production"],
  },
  {
    name: "Album Composition",
    parameters: ["Length", "Versatility", "Consistency", "Concept"],
  },
  { name: "Performance", parameters: ["Vocal performance", "Instrumental"] },
  {
    name: "Songwriting",
    parameters: ["Lyrics", "Melody", "Harmony", "Originality", "Hooks"],
  },
];
// **********************************
// NEW REVIEW
// **********************************
app.get("/reviews/addnew", (req, res) => {
  const { img, albumName, releaseDate, artistName, albumUri } = req.query;
  let re = /\w{8,}/;
  let id = re.exec(albumUri);
  let albumTracks = null;
  spotifyApi
    .getAlbum(id[0])
    .then(
      (data) => {
        albumTracks = data.body.tracks.items;
      },
      (err) => {
        console.error(err);
      }
    )
    .then(() => {
      res.render("reviews/newReview", {
        img,
        albumName,
        releaseDate,
        artistName,
        albumUri: id,
        gradingParameters,
        albumTracks,
      });
    });
});

app.post("/reviews", async (req, res, next) => {
  try {
    const {
      song1,
      song2,
      song3,
      albumName,
      artistName,
      releaseDate,
      albumUri,
      albumComments
    } = req.body;
    delete req.body.song1;
    delete req.body.song2;
    delete req.body.song3;
    delete req.body.albumName;
    delete req.body.artistName;
    delete req.body.releaseDate;
    delete req.body.albumUri;
    delete req.body.albumComments;

    const results = ({
      Mixing: mixing,
      Instrumentation: instrumentation,
      "Vocal production": vocalProd,
      Length: length,
      Versatility: versatility,
      Consistency: consistency,
      Concept: concept,
      "Vocal performance": vocalPerf,
      Instrumental: instrumental,
      Lyrics: lyrics,
      Melody: melody,
      Harmony: harmony,
      Originality: originality,
      Hooks: hooks,
    } = req.body);

    let resultsArray = [];
    let itr = 0;
    for (const element in results) {
      resultsArray[itr] = { subcategory: element, grade: results[element] };
      itr++;
    }

    let newReview = {
      dateAdded: new Date(),
      albumName: albumName,
      artistName: artistName,
      release_date: releaseDate,
      albumUri: albumUri,
      tracks: [],
      grades: [],
      total: 0,
      comment: albumComments
    };
    const tracks = [song1, song2, song3];
    for (let i = 0; i < 3; i++) {
      if (tracks[i] != "Choose...") {
        newReview.tracks.push(tracks[i]);
      }
    }
    let resultsItr = 0;
    for (let i = 0; i < gradingParameters.length; i++) {
      let categoryGrade = 0;
      newReview.grades[i] = {
        category: gradingParameters[i].name,
        parameters: [],
        categoryTotal: 0,
      };
      let numberReplies = 0;
      for (let j = 0; j < gradingParameters[i].parameters.length; j++) {
        newReview.grades[i].parameters[j] = {
          name: resultsArray[resultsItr].subcategory,
          grade: resultsArray[resultsItr].grade,
        };
        let parsedResult = parseInt(resultsArray[resultsItr].grade);
        if (parsedResult > -1) {
          categoryGrade += parsedResult;
          numberReplies++;
        }
        resultsItr++;
        if (j == gradingParameters[i].parameters.length - 1) {
          newReview.grades[i].parameters[j].categoryTotal =
            (categoryGrade / ((numberReplies) * 10)) * 25;
          newReview.total += newReview.grades[i].parameters[j].categoryTotal;
        }
      }
    }
    const createReview = new Review(newReview);
    await createReview.save();
    res.redirect("/");
  } catch (e) {
    next(e);
  }
});

// **********************************
// SPOTIFY
// **********************************
const spotifyApi = new SpotifyWebApi({
  clientId: "4b50a8d89ede43c4b8f4f830be9a7336",
  clientSecret: "9263d548b4c94787bf52b8325ef0dfb7",
  redirectUri: "http://localhost:3000/spotify",
});
const scopes = [
  "ugc-image-upload",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
  "app-remote-control",
  "user-read-email",
  "user-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-read-private",
  "playlist-modify-private",
  "user-library-modify",
  "user-library-read",
  "user-top-read",
  "user-read-playback-position",
  "user-read-recently-played",
  "user-follow-read",
  "user-follow-modify",
];

app.get("/login", (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get("/spotify", (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error("Callback Error:", error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      const access_token = data.body["access_token"];
      const refresh_token = data.body["refresh_token"];
      const expires_in = data.body["expires_in"];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log("access_token:", access_token);
      console.log("refresh_token:", refresh_token);

      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      // res.send("Success! You can now close the window.");
      res.redirect("reviews/new");

      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body["access_token"];

        console.log("The access token has been refreshed!");
        console.log("access_token:", access_token);
        spotifyApi.setAccessToken(access_token);
      }, (expires_in / 2) * 1000);
    })
    .catch((error) => {
      console.error("Error getting Tokens:", error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

// **********************************
// SEARCH
// **********************************
app.post("/spotify/search", (req, res) => {
  const { searchString, searchBy } = req.body;
  let searchResults = [];
  spotifyApi
    .searchAlbums(searchString)
    .then(
      (data) => {
        for (const element of data.body.albums.items) {
          // console.log(element);
        }
        searchResults = data.body.albums.items;
      },
      (err) => {
        console.error(err);
      }
    )
    .then(() => {
      // console.log(searchResults);
      res.render("reviews/searchResults", { searchResults });
    });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
