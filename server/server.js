'use strict';

const express = require('express');
const morgan = require('morgan');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; // username+psw
const userDao = require('./user-dao');
const session = require('express-session');
const surveyDao = require('./survey-dao'); // module for accessing the DB


// Set up Passport 
passport.use(new LocalStrategy(
  function (username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { message: 'Incorrect username and/or password.' });

      return done(null, user);
    });
  }
));


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  userDao.getUserById(id).then((user) => {
    done(null, user); // req.user
  })
    .catch((err) => {
      done(err, null);
    });
});

// init express
const app = new express();
const port = 3001;

app.use(morgan('dev'));
app.use(express.json()); // parse the body in JSON format => populate req.body attributes


const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(400).json({ error: 'Not authorized' });
}

// enable sessions in Express
app.use(session({
  // set up here express-session
  secret: 'una frase segreta da non condividere con nessuno e da nessuna parte, usata per firmare il cookie Session ID',
  resave: false,
  saveUninitialized: false,
}));

// init Passport to use sessions
app.use(passport.initialize());
app.use(passport.session());


/*** Surveys APIs ***/
// Get all surveys
app.get('/api/surveys', (req, res) => {
  surveyDao.getAllSurveys()
    .then((surveys) => { res.json(surveys); })
    .catch((error) => { res.status(500).json(error); });
});


// Get all surveys for an admin
app.get('/api/admin-surveys/:id', isLoggedIn, async (req, res) => {
  const admin_id = req.params.id;
  surveyDao.getAllSurveysAdmin(admin_id)
    .then((surveys) => { res.json(surveys); })
    .catch((error) => { res.status(500).json(error); });
});


// Get questions for a specific survey id
app.get('/api/survey/:id', async (req, res) => {
  const id = req.params.id;
  surveyDao.getQuestions(id)
    .then(questions => { res.json(questions) })
    .catch(error => res.status(500).json(error));
});


// Add a new survey
app.post('/api/survey', isLoggedIn, async (req, res) => {

  let title = req.body.title;
  let admin_id = req.user.id;
  let text = req.body.text;
  let answers = req.body.answers;
  let min_ans = req.body.min_ans;
  let max_ans = req.body.max_ans;

  /* Validation */
  let dataCorrect = true;
  // Check if title is empty
  if (title.isEmpty())
    dataCorrect = false;
  else {
    // Check length of arrays
    if (text.length != answers.length || answers.length != min_ans.length || min_ans.length != max_ans.length)
      dataCorrect = false;
    // Check texts of questions are not empty
    if (text.some(t => t.isEmpty()))
      dataCorrect = false;
    // Check min and max ans
    for (let index = 0; index < min_ans.length; index++) {
      if (min_ans[index] > max_ans[index]) {
        dataCorrect = false;
        break;
      }
      if (answers[index] && min_ans[index] > answers[index].split(";").length) {
        dataCorrect = false;
        break;
      }
    }
  }

  if (!dataCorrect) {
    res.status(500).json({ error: "Data is not correct!" });
    return;
  }

  /* Insert data in db */
  try {
    let s_id = await surveyDao.createSurvey(title, admin_id);
    let index = 0;
    for (let t of text) {
      await surveyDao.addQuestionForSurvey(t, answers[index], s_id, min_ans[index], max_ans[index]);
      index++;
    }
    res.end();
  } catch (error) {
    res.status(500).json(error);
  }
});


/*** Answers APIs ***/

// Add answers to a survey
app.post('/api/answer-survey', async (req, res) => {

  let user = req.body.user;
  let survey_id = req.body.survey_id;
  let answers = req.body.answers;
  let question_ids = req.body.question_ids;

  try {
    let u_id = await surveyDao.getNextUserId(survey_id);
    let index = 0;
    for (let a of answers) {
      await surveyDao.storeSingleAnswer(user, a, survey_id, question_ids[index], u_id);
      index++;
    }
    res.end();
  } catch (error) {
    res.status(500).json(error);
  }
});


// get answers for given survey id and user id
app.get('/api/answer-survey/:s_id/:u_id/:next', isLoggedIn, async (req, res) => {
  const s_id = req.params.s_id;
  const u_id = req.params.u_id;
  const next = req.params.next == 1 ? true : false;
  surveyDao.getAnswersToSurveyUser(s_id, u_id, next)
    .then(answers => { res.json(answers) })
    .catch(error => res.status(500).json(error));
});



/*** User APIs ***/
app.post('/api/sessions', passport.authenticate('local'), (req, res) => {
  res.json(req.user);
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current_session', (req, res) => {
  if (req.isAuthenticated())
    res.json(req.user);
  else
    res.status(401).json({ error: 'Not authenticated' });
});

// DELETE /sessions/current
// logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout();
  res.end();
});


// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});