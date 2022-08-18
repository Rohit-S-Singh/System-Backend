const express = require("express");
const router = express.Router();

const multer = require("multer");

// Bring in Models & Helpers
const Movie = require("../models/movies");



const storage = multer.diskStorage({
  destination: (req,file,cb) =>{

    cb(null,'../uploads')

  },
  filename: (req,file,cb) => {
    cb(null, Date.now() + "--" + file.originalname)
  }
});

const upload = multer({storage: storage});


router.post("/add",upload.single('image'), async(req, res) => {

  try{

  
  console.log("Hello World");

  // console.log(req.file);
  // console.log(req.body);

  const movie = req.body;

  const name = movie.Title;
  const releasedDate = movie.Released;
  const runtime = movie.Runtime;
  const description = movie.Plot;
  const Poster = movie.Poster;

  const moviee = new Movie ({
        name,
        description,
        runtime,
        releasedDate,
        Poster
      });

    const savedMovie = await moviee.save();
    console.log("done");

  res.status(200).json({
    success: true,
    message: "Movie Created Sucessfully",
    movie:moviee
  });
}
  
  catch (error) {
    console.log(error)
      return res.status(400).json({
        error: "Your request could not be processed. Please try again.",
      });
    }
})



router.get("/get",async (req,res)=>{

  const Movies = await Movie.find({});

  res.status(200).json({
    success: true,
    message: "Movie Created Sucessfully",
    movies:Movies
  });

})

module.exports = router;
