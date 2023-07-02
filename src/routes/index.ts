// Copyright Michael Selinger 2023
import express, { Express, Request, Response } from 'express';
const router = express.Router();

/* GET home page. */
router.get('/', (_req: Request, res: Response) => {
  res.render('index', {registrationActive: global.registrationActive});
});

/* GET developer page. */
router.get('/dev', (_req: Request, res: Response)  => {
  res.render('dev');
});

/* GET developer page. */
router.get('/public', (_req: Request, res: Response) => {
  res.render('public_stats');
});


/*
router.get('/error', function (req, res) {
  res.render("error", {error: "test"});
});*/

module.exports = router;