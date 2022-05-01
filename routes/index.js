var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'Hey', message: 'Willkommen zum Bestellsystem!', kellner: "kellner",stand: "stand", admin: "admin"});
});

router.get('/kellner.js', function (req, res) {
  res.render('kellner');
});


module.exports = router;
