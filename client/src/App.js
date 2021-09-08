import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from './js/navbar.js';
import LoginForm from './js/login_form.js';
import SurveyList from './js/survey_list.js';
import SurveyForm from './js/survey_form.js';
import AddSurveyForm from './js/add_survey_form.js';
import SurveyFormView from './js/survey_form_view.js';
import API from './js/API.js';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { Link, BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Redirect } from 'react-router';
import { useEffect, useState } from 'react';


function App() {

  /* true if admin is logged in */
  let [loggedIn, setLoggedIn] = useState(false);
  /* name of the admin who is logged in */
  let [adminName, setAdminName] = useState('');
  /* message to display to the user */
  let [message, setMessage] = useState('');
  /* list of all surveys (for main page) */
  let [surveys, setSurveys] = useState([]);
  /* list of all surveys for the logged admin */
  let [adminSurveys, setAdminSurveys] = useState([]);
  /* list of questions for a specific survey */
  let [questions, setQuestions] = useState([]);
  /* data of survey currently selected (e.g. id, admin, title) */
  let [survey, setSurvey] = useState(undefined);
  /* number of responses to surveys of a given user */
  let [responses, setResponses] = useState(0);
  /* state modified to reload surveys when needed (i.e. after filling 
    a survey and after creating a new survey) */
  let [reloadSurveys, setReloadSurveys] = useState(false);
  /* state modified to reload admin surveys when needed (i.e. after filling 
  a survey and after creating a new survey) */
  let [reloadAdminSurveys, setReloadAdminSurveys] = useState(false);
  /* state used to show the questions of a selected surveys only when
    properly loaded from the db */
  let [newQuestionsReady, setNewQuestionsReady] = useState(false);
  /* state used to show the updated list of surveys only when
  properly loaded from the db */
  let [newSurveysReady, setNewSurveysReady] = useState(false);


  /* Get surveys of a logged admin from the db */
  useEffect(() => {
    const getSurveys = async () => {
      API.getUserInfo()
        .then(userInfo => API.getAdminSurveys(userInfo.id))
        .then(s => {
          setAdminSurveys(s);
          setNewSurveysReady(true);
        });
    };
    if (loggedIn) {
      getSurveys()
        .catch(err => {
          setMessage({ msg: "Impossible to load surveys! Please, try again later...", type: 'danger' });
          console.error(err);
        });
    }
  }, [loggedIn, reloadAdminSurveys]);


  /* get all available surveys */
  useEffect(() => {
    const getSurveys = async () => {
      API.getAllSurveys().then(s => setSurveys(s));
    };
    getSurveys()
      .catch(err => {
        setMessage({ msg: "Impossible to load surveys! Please, try again later...", type: 'danger' });
        console.error(err);
      });
  }, [reloadSurveys]);


  /* get questions for a specific survey */
  useEffect(() => {
    if (survey) {
      const getQuestionsForSurvey = async () => {
        // Sort questions according to the order given when they were created
        // (in the db they are not stored in order)
        API.getQuestions(survey.id).then(q => {
          setQuestions(q);
          setNewQuestionsReady(true);
        });
      };
      getQuestionsForSurvey()
        .catch(err => {
          setMessage({ msg: "Impossible to load questions! Please, try again later...", type: 'danger' })
          console.error(err);
        });
    }
  }, [survey]);


  /* login */
  const doLogin = async (credentials) => {
    try {
      await setNewSurveysReady(false);
      const user = await API.login(credentials);
      await setLoggedIn(true);
      await setMessage({ msg: `Welcome, ${user}!`, type: 'success' });
      await setAdminName(user);
    } catch (err) {
      setMessage({ msg: "Error in username or password!", type: 'danger' });
    }
  }

  /* logout */
  const doLogout = async () => {
    let logout = await API.logout();
    if (logout) {
      setLoggedIn(false);
      setAdminName('');
      setReloadSurveys(s => !s);
    }
  }

  useEffect(() => {
    setTimeout(() => {
      // After 2 seconds set the message value to null
      setMessage(null)
    }, 2000)
  }, [message]);


  return (

    <Router>

      <Container fluid className="m-0 p-0">
        <Row className="m-0 p-0">
          <Col className="m-0 p-0">
            <NavBar doLogout={doLogout} adminName={adminName} logged={loggedIn} />
          </Col>
        </Row>

        {message && <Row>
          <Col sm={{ span: 4, offset: 4 }}>
            <Alert variant={message.type} onClose={() => setMessage('')} dismissible>{message.msg}</Alert>
          </Col>
        </Row>}

        <Switch>

          <Route path="/login"
            render={() =>
              <>
                {loggedIn ? <Redirect to="/admin-home" /> : null}
                <Col sm={{ span: 4, offset: 4 }}>
                  <br />
                  <br />
                  <LoginForm doLogin={doLogin} />
                </Col>
              </>

            }
          />
          <Route exact path="/"
            render={() =>
              <>
                {loggedIn ? <Redirect to="/admin-home" /> : null}
                <SurveyList surveys={surveys} setSurvey={setSurvey} admin={false} setNewQuestionsReady={setNewQuestionsReady} />
              </>
            }
          />
          <Route path="/fill-survey"
            render={() =>
              <>
                {loggedIn ? <Redirect to="/admin-home" /> : null}
                <SurveyForm questions={questions} surveyId={survey ? survey.id : undefined} setMessage={setMessage}
                  title={survey ? survey.title : undefined} setReloadSurveys={setReloadSurveys} newQuestionsReady={newQuestionsReady} />
              </>
            }
          />
          <Route path="/admin-home"
            render={() =>
              <>
                {loggedIn ? null : <Redirect to="/" />}
                <SurveyList surveys={adminSurveys} setSurvey={setSurvey} admin={true} setResponses={setResponses}
                  setNewQuestionsReady={setNewQuestionsReady} newSurveysReady={newSurveysReady} />
                <Link to={"/create-survey"} style={{ textDecoration: 'none' }}>
                  <Col xs style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Button>Create a new survey</Button>
                  </Col>
                </Link>
                <br />
                <br />
              </>
            }
          />
          <Route path="/create-survey"
            render={() =>
              <>
                {loggedIn ? null : <Redirect to="/" />}
                <AddSurveyForm setMessage={setMessage} setReloadAdminSurveys={setReloadAdminSurveys} />
              </>
            }
          />
          <Route path="/view-survey"
            render={() =>
              <>
                {loggedIn ? null : <Redirect to="/" />}
                <SurveyFormView questions={questions} surveyId={survey ? survey.id : undefined} responses={responses}
                  title={survey ? survey.title : undefined} setReloadAdminSurveys={setReloadAdminSurveys} />
              </>
            }
          />
          <Route path="/" /* Any other route */
            render={() =>
              <Redirect to="/" />
            }
          />

        </Switch>
      </Container>
    </Router>
  );
}




export default App;
