const express = require("express");
const pool = require("../config");

router = express.Router();

router.get('/randomcar', async function (req, res, next) {
  try {
      let random = []
      const [randomcar, field] = await pool.query(
          'SELECT * FROM Car JOIN Car_images USING(car_id) WHERE main = 1')
      for(let i = 0 ; i < 6 ; i++){
        let car = randomcar[Math.floor(Math.random()*randomcar.length)]
        random.push(car)
        let index = randomcar.indexOf(car)
        randomcar.splice(index, 1)
      }
      return res.json(random)
  } catch (error) {
      res.json(error)
  }
})

exports.router = router;
