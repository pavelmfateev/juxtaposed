const express = require("express"),
  router = express.Router(),
  Review = require("../models/review"),
  spotifyApiImport = require("../utils/spotifyApi");

let spotifyApi = spotifyApiImport.spotifyApi;

// **********************************
// INDEX - renders multiple reviews
// **********************************
router.get("/reviews", async (req, res) => {
  res.render("reviews/index");
});

// **********************************
// NEW - renders a form
// **********************************
router.get("/reviews/new", (req, res) => {
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
router.get("/reviews/addnew", (req, res) => {
  const { img, albumName, releaseDate, artistName, albumUri } = req.query;
  let re = /\w{8,}/;
  let id = re.exec(albumUri);
  let albumTracks = null;
  spotifyApi
    .getAlbum(id[0])
    .then(
      (data) => {
        albumTracks = data.body.tracks.items;
        console.log(albumTracks);
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

router.post("/reviews", async (req, res, next) => {
  try {
    const {
      song1,
      song2,
      song3,
      albumName,
      artistName,
      releaseDate,
      albumUri,
      albumComments,
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
      comment: albumComments,
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
            (categoryGrade / (numberReplies * 10)) * 25;
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
module.exports = router;
