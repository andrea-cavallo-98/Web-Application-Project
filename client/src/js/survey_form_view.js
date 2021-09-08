import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import API from './API.js';
import { Redirect } from 'react-router-dom';


const SurveyFormView = function (props) {

    /* array of answers of user to the specified survey */
    let [answers, setAnswers] = useState([undefined]);
    /* id of the user whose answer is currently shown */
    let [userId, setUserId] = useState(-1);
    /* name of the user whose answer is currently shown */
    let [username, setUsername] = useState("");
    /* number of currently shown response among all available responses
        for the current survey */
    let [response, setResponse] = useState(0);
    /* true if the admin wants to see responses for the next user, false if
        the admin wants to go back to a previously viewed response */
    let [next, setNext] = useState(true);
    /* state used to show answers only when they are available from the db */
    let [answersReady, setAnswersReady] = useState(false);
    /* true if admin clicked on Back to your surveys button */
    let [moveBack, setMoveBack] = useState(false);

    /* set the next response (with appropriate checks) */
    const setNextResponse = function (up) {
        if (up) {
            if (response + 1 !== props.responses) {
                setNext(true)
                setResponse(r => r + 1);
            }
        }
        else {
            if (response !== 0) {
                setNext(false)
                setResponse(r => r - 1);
            }
        }
    }


    /* get answers for a specific survey and user */
    useEffect(() => {
        const getAnswers = async () => {
            setAnswersReady(false);
            setAnswers([]);

            // the user to look for has an id which is either bigger or smaller than the current
            // user, depending on whether we want to see a previously viewed response or a new one
            API.getAnswersToSurveyUser(props.surveyId, next ? (userId + 1) : (userId - 1), next)
                .then(userAns => {
                    if (userAns[0]) {
                        setUsername(userAns[0].username);
                        setUserId(userAns[0].user_id);
                        let allAns = [];
                        for (let ans of userAns) {
                            allAns = [...allAns, ans.answer];
                        }
                        // update the state
                        setAnswers(allAns);
                    }
                    setAnswersReady(true);
                });
        };
        getAnswers()
            .catch(err => {
                console.error(err);
            });
    }, [props.surveyId, response])

    return (
        <>
            {moveBack ? <Redirect to="admin-home" /> : null}
            <br />
            <Col md={{ span: 8, offset: 2 }}>
                <h2>{'Responses to survey: ' + props.title}</h2>

                {answersReady ?
                    <>
                        {((userId === -1) && (!answers[0])) ?
                            <p style={{ fontSize: 20 }}>No responses available for this survey</p>
                            :
                            <>
                                <Form>
                                    <Form.Group>
                                        <hr />
                                        <Form.Label>Username:</Form.Label>
                                        <Form.Control type="text" value={username} readOnly />
                                    </Form.Group>
                                    {props.questions.map((q, index) => <SurveyFormQuestion question={q} key={q.id}
                                        index={index} answers={answers} setAnswers={setAnswers} />)}
                                </Form>

                                <Row>
                                    <Col md={{ span: 3, offset: 1 }}>
                                        {
                                            response !== 0 ?
                                                <p> <a href="#/" className="text-primary" onClick={() => setNextResponse(false)}>Previous Response</a></p>
                                                : null
                                        }
                                    </Col>
                                    <Col md={{ span: 3, offset: 1 }}>
                                        <p>{"Response " + (response + 1) + " of " + props.responses}</p>
                                    </Col>
                                    <Col md={{ span: 3, offset: 1 }}>
                                        {
                                            response + 1 !== props.responses ?
                                                <p> <a href="#/" className="text-primary" onClick={() => setNextResponse(true)}>Next Response</a></p>
                                                : null
                                        }
                                    </Col>
                                </Row>
                            </>
                        }
                    </> :
                    <Col md={{ span: 8, offset: 5 }} style={{ fontSize: 20 }}>
                        <p>Loading...</p>
                    </Col>
                }

                <Row>
                    <Col xs style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Button variant="secondary" onClick={() => { setMoveBack(true); props.setReloadAdminSurveys(s => !s) }}>
                            Back to your surveys
                        </Button>
                    </Col>
                </Row>
            </Col>
            <br />
            <br />
        </>
    );

}


function SurveyFormQuestion(props) {

    let possible_answers = props.question.possible_answers ? props.question.possible_answers.split(";") : undefined;

    // Check if an answer is selected or not 
    const isSelected = function (ans, index) {

        if (!ans)
            return false;

        if (typeof (ans) == "number") // avoid errors due to wrong type
            ans = ans.toString();

        if (!ans.includes(";"))
            return ans === "1";
        else
            return ans.split(";")[index] === "1";
    }

    return (
        <Form.Group>
            <hr />
            <Form.Label>{<><b>Question {props.index + 1}: </b> {props.question.text}</>}</Form.Label>
            {possible_answers ?
                <>
                    <p style={{ color: '#707070', fontSize: 13 }}>
                        {" Minimum answers: " + props.question.min_ans + ", Maximum answers: " + props.question.max_ans}
                    </p>
                    {possible_answers.map((a, index) =>
                        <AnswerRow a={a} key={index} index={index} selected={isSelected(props.answers[props.index], index)} />
                    )}
                </>
                :
                <>
                    {
                        props.question.min_ans === 1 ?
                            <p style={{ color: '#707070', fontSize: 13 }}>Mandatory question</p>
                            :
                            <p style={{ color: '#707070', fontSize: 13 }}>Optional question</p>
                    }
                    <Form.Control as="textarea" rows={3} value={props.answers[props.index]} readOnly />
                </>
            }
        </Form.Group>
    );
}


function AnswerRow(props) {
    return (
        <Form.Check type="radio" label={props.a} checked={props.selected} disabled />
    );
}

export default SurveyFormView;