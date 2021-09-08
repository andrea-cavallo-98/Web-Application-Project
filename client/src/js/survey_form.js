import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import API from './API.js';
import { Redirect } from 'react-router';


const SurveyForm = function (props) {

    /* Array containing answers to the survey provided by the user.
        Initially, all empty strings. Then, for a multiple choice question, a string is stored containing
        0 if the option is not selected, 1 otherwise. */
    let [answers, setAnswers] = useState(props.questions && new Array(props.questions.length).fill(""));
    /* username of the user filling the survey */
    let [username, setUsername] = useState("");
    /* true when the user clicks submit button the first time, used for error messages
    in various components */
    let [validated, setValidated] = useState(false);
    /* array containing true if the corresponding question has been answered properly, false otherwise
        (i.e. min ans and max ans constraints have been respected) */
    let [valid, setValid] = useState(props.questions && new Array(props.questions.length).fill(false));
    /* true when user successfully submits the form, used to redirect to the main page */
    let [submitted, setSubmitted] = useState(false);
    /* true if the form contains some errors, false otherwise */
    let [wrongForm, setWrongForm] = useState(true);

    /* Update the size of the array of answers and set to true the valid array for questions
        that can have 0 answers */
    useEffect(() => {
        setAnswers(new Array(props.questions.length).fill(""));
        let newValid = [];
        for (let q of props.questions) {
            if (q.min_ans === 0) {
                newValid = [...newValid, true];
            }
            else
                newValid = [...newValid, false];
        }
        setValid(newValid);
    }, [props.questions]);

    /* Check if form is valid */
    useEffect(() => {
        let isWrong = false;
        if (username.isEmpty()) { // Check username validity
            isWrong = true;
        }
        else { // Check validity of answers
            if (valid.some(v => v === false))
                isWrong = true;
        }
        setWrongForm(isWrong);
    }, [username, valid])

    // Check if string is empty or contains only white spaces
    // eslint-disable-next-line no-extend-native
    String.prototype.isEmpty = function () {
        return (this.length === 0 || !this.trim());
    };

    const sendAnswers = async (ev) => {
        ev.preventDefault();

        let question_ids = [];
        for (let q of props.questions)
            question_ids.push(q.id);

        let ans = answers;
        for (let index = 0; index < props.questions.length; index++) {
            if (props.questions[index].possible_answers && ans[index] === "") {
                // If a mcq has "" value, then all options must be set to 0
                let newString = "0";
                for (let j = 1; j < props.questions[index].possible_answers.split(";").length; j++)
                    newString = newString + ";0";
                ans[index] = newString;
            }
        }

        setValidated(true);
        if (!wrongForm) {
            let answersToSend = {
                "question_ids": question_ids,
                "answers": ans,
                "user": username,
                "survey_id": props.surveyId,
            }

            API.storeAnswersToSurvey(answersToSend).catch(err => props.setMessage({ msg: `Error: ${err}!`, type: 'danger' }))
                .then(setSubmitted(true)).then(props.setMessage({ msg: `Answers submitted successfully!`, type: 'success' }))
                .then(props.setReloadSurveys(s => !s));
        }
    }


    return (
        <>
            {submitted ? <Redirect to="/" /> : null}
            {
                props.newQuestionsReady ?
                    <Form noValidate onSubmit={(ev) => sendAnswers(ev)}>
                        <br />
                        <Col md={{ span: 8, offset: 2 }}>
                            <h2>{'Survey: ' + props.title}</h2>
                            <Form.Group>
                                <hr />
                                <Form.Label>Please insert your name:</Form.Label>
                                <Form.Control type="text" value={username} onChange={ev => setUsername(ev.target.value)} isInvalid={validated && username.isEmpty()} />
                                <Form.Control.Feedback type="invalid">Required field</Form.Control.Feedback>
                            </Form.Group>
                            {props.questions.map((q, index) => <SurveyFormQuestion question={q} key={q.id}
                                index={index} answers={answers} setAnswers={setAnswers} validated={validated} setValid={setValid}
                                valid={valid} />)}
                            {
                                wrongForm && validated ?
                                    <p class="text-danger" style={{ fontSize: 13 }}>Please fix errors before submitting</p> : null
                            }
                            <Row>
                                <Col sm={{ offset: 3 }}>
                                    <Button type="submit">Save</Button>
                                </Col>
                                <Col>
                                    <Button variant="secondary" onClick={() => { setSubmitted(true); props.setReloadSurveys(s => !s) }}>
                                        Cancel
                                    </Button>
                                </Col>
                            </Row>
                            <br />
                            <br />
                        </Col>
                    </Form>
                    :
                    <Col md={{ span: 8, offset: 5 }} style={{ fontSize: 20 }}>
                        <p>Loading...</p>
                    </Col>
            }
        </>
    );
}


function SurveyFormQuestion(props) {

    // possible answers for the current question
    let possible_answers = props.question.possible_answers ? props.question.possible_answers.split(";") : undefined;

    /* add the answer selected by the user in a multiple choice question */
    const storeAnswerOptions = (sel) => {

        props.setAnswers(oldAns => {
            const newAns = oldAns.map((ans, j) => {
                if (j === props.index) {
                    if (ans) { // if the string is already properly organized
                        let oldFields = ans.split(";");
                        let isSel = oldFields[sel] === "1";
                        oldFields[sel] = isSel ? "0" : "1";

                        // Check if question has now a valid number of answers
                        let providedAnswers = 0;
                        let isNowValid = true;
                        for (let f of oldFields)
                            if (f === "1")
                                providedAnswers += 1;
                        if (props.question.min_ans > providedAnswers || props.question.max_ans < providedAnswers)
                            isNowValid = false;
                        // update the valid state of the question
                        props.setValid(oldValid => {
                            const newValid = oldValid.map((valid, j) => {
                                if (j === props.index)
                                    return isNowValid;
                                else
                                    return valid;
                            });
                            return newValid;
                        });

                        // Update string of answers
                        let newString = oldFields[0];
                        for (let i = 1; i < oldFields.length; i++)
                            newString = newString + ";" + oldFields[i];
                        return newString;
                    }
                    else { // the string is empty, organize it with 0 and 1
                        let fields = new Array(possible_answers.length).fill("0");
                        fields[sel] = "1";

                        // Check if question has now a valid number of answers
                        let isNowValid = true;
                        if (props.question.min_ans > 1 || props.question.max_ans < 1)
                            isNowValid = false;
                        // update the valid state of the question
                        props.setValid(oldValid => {
                            const newValid = oldValid.map((valid, j) => {
                                if (j === props.index)
                                    return isNowValid;
                                else
                                    return valid;
                            });
                            return newValid;
                        });

                        // Update string of answers
                        let newString = fields[0];
                        for (let i = 1; i < fields.length; i++)
                            newString = newString + ";" + fields[i];
                        return newString;
                    }
                }
                else
                    return ans;
            });
            return newAns;
        });
    }

    /* store the answer for an open question */
    const storeAnswerText = (text) => {

        // check if the answer is valid (must not be empty and must be shorter than 200 chars)
        let val = (!text.isEmpty()) && text.length <= 200;

        // update the array of answers
        props.setAnswers(oldAns => {
            const newAns = oldAns.map((ans, j) => {
                if (j === props.index)
                    return text;
                else
                    return ans;
            });
            return newAns;
        });

        // update the valid state for the current question
        props.setValid(oldValid => {
            const newValid = oldValid.map((valid, j) => {
                if (j === props.index)
                    return val;
                else
                    return valid;
            });
            return newValid;
        });
    }


    return (
        <Form.Group required>
            <hr />
            <Form.Label>{<><b>Question {props.index + 1}: </b> {props.question.text}</>}</Form.Label>


            {possible_answers ?
                <>
                    <p style={{ color: '#707070', fontSize: 13 }}>
                        {
                            props.question.min_ans === props.question.max_ans ?
                                props.question.max_ans === 1 ?
                                    " Please insert " + props.question.min_ans + " answer"
                                    :
                                    " Please insert " + props.question.min_ans + " answers"
                                :
                                " Please insert between " + props.question.min_ans + " and " + props.question.max_ans + " answers"
                        }
                    </p>
                    {
                        (!props.valid[props.index]) && props.validated ?
                            <p class="text-danger" style={{ fontSize: 13 }}>Wrong number of answers</p>
                            : null
                    }
                    {possible_answers.map((a, index) =>
                        <AnswerRow a={a} key={index} storeAnswerOptions={storeAnswerOptions} index={index}
                            selected={props.answers[props.index] ? props.answers[props.index].split(";")[index] === "1" : false} />
                    )}
                </>
                :
                <>
                    <p style={{ color: '#707070', fontSize: 13 }}>
                        {
                            props.question.min_ans === 1 ?
                                "Mandatory question"
                                :
                                "Optional question"
                        }
                    </p>
                    {
                        props.question.min_ans === 0 ?
                            <>
                                <Form.Control as="textarea" rows={3} value={props.answers[props.index]}
                                    onChange={ev => storeAnswerText(ev.target.value)} />
                            </>
                            :
                            <>
                                <Form.Control as="textarea" rows={3} value={props.answers[props.index]}
                                    onChange={ev => storeAnswerText(ev.target.value)} isInvalid={props.validated &&
                                        (props.answers[props.index].isEmpty() || (props.answers[props.index] && props.answers[props.index].length > 200))} />
                                <Form.Control.Feedback type="invalid">
                                    {props.answers[props.index] && props.answers[props.index].length > 200 ?
                                        "Answers cannot be longer than 200 characters"
                                        :
                                        "Required field"}
                                </Form.Control.Feedback>
                            </>
                    }
                </>
            }
        </Form.Group>
    );
}


function AnswerRow(props) {

    return (
        <Form.Check type="radio" label={props.a} checked={props.selected} onClick={() => props.storeAnswerOptions(props.index)} />
    );
}

export default SurveyForm;