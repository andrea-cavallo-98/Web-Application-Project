
import { Trash, ArrowDownCircle, ArrowUpCircle } from 'react-bootstrap-icons';
import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import API from './API';
import { Redirect } from 'react-router';

function AddSurveyForm(props) {
    /* modal form management */
    let [showForm, setShowForm] = useState(false);
    /* array containing the texts of all the questions for the survey */
    let [questionText, setQuestionText] = useState([]);
    /* array containing the texts of all the possible answers for each
        question (one string per question, options are separated by ;) */
    let [possibleAnswers, setPossibleAnswers] = useState([]);
    /* array containing the minimum number of required answers for each question */
    let [minAns, setMinAns] = useState([]);
    /* array containing the maximum number of required answers for each question */
    let [maxAns, setMaxAns] = useState([]);
    /* title of the survey */
    let [title, setTitle] = useState("");
    /* true when the user clicks submit button the first time, used for error messages
        in various components */
    let [validated, setValidated] = useState(false);
    /* true when user successfully submits the form, used to redirect to the main page */
    let [submitted, setSubmitted] = useState(false);
    /* true if there are errors in the form, false otherwise */
    let [wrongForm, setWrongForm] = useState(true);

    const handleCloseForm = () => setShowForm(false);
    const handleShowForm = () => setShowForm(true);

    // Check if string is empty or contains only white spaces
    // eslint-disable-next-line no-extend-native
    String.prototype.isEmpty = function () {
        return (this.length === 0 || !this.trim());
    };

    /* remove a question from the array and relative information
        (possible answers, min ans and max ans) */
    const handleDeleteQuestion = (index) => {
        setQuestionText(oldQ => {
            return oldQ.filter((q, j) => index !== j);
        });
        setPossibleAnswers(oldAns => {
            return oldAns.filter((a, j) => index !== j);
        });
        setMinAns(oldMinAns => {
            return oldMinAns.filter((a, j) => index !== j);
        });
        setMaxAns(oldMaxAns => {
            return oldMaxAns.filter((a, j) => index !== j);
        });
    }

    /* Swap the position of two questions (index is the question to move, 
        up == true swapping the question with the one above) */
    const handleMoveQuestion = (index, up) => {

        if (!((up && index === 0) || (!up && index === questionText.length - 1))) {

            // Store information about question to move
            let qToMove1 = questionText[index];
            let qToMove2 = up ? questionText[index - 1] : questionText[index + 1];
            let aToMove1 = possibleAnswers[index];
            let aToMove2 = up ? possibleAnswers[index - 1] : possibleAnswers[index + 1];
            let minAnsToMove1 = minAns[index];
            let minAnsToMove2 = up ? minAns[index - 1] : minAns[index + 1];
            let maxAnsToMove1 = maxAns[index];
            let maxAnsToMove2 = up ? maxAns[index - 1] : maxAns[index + 1];

            // Perform the swap on all arrays 
            setQuestionText(oldQ => {
                let newQ = oldQ.map((q, j) => {
                    if (j === index)
                        return qToMove2;
                    else if ((up && j === index - 1) || (!up && j === index + 1))
                        return qToMove1;
                    else
                        return q;
                });
                return newQ;
            });

            setPossibleAnswers(oldAns => {
                let newAns = oldAns.map((a, j) => {
                    if (j === index)
                        return aToMove2;
                    else if ((up && j === index - 1) || (!up && j === index + 1))
                        return aToMove1;
                    else
                        return a;
                });
                return newAns;
            });

            setMinAns(oldAns => {
                let newAns = oldAns.map((a, j) => {
                    if (j === index)
                        return minAnsToMove2;
                    else if ((up && j === index - 1) || (!up && j === index + 1))
                        return minAnsToMove1;
                    else
                        return a;
                });
                return newAns;
            });

            setMaxAns(oldAns => {
                let newAns = oldAns.map((a, j) => {
                    if (j === index)
                        return maxAnsToMove2;
                    else if ((up && j === index - 1) || (!up && j === index + 1))
                        return maxAnsToMove1;
                    else
                        return a;
                });
                return newAns;
            });

        }
    }

    useEffect(() => {
        let isWrong = false;
        // VALIDATION
        if (title.isEmpty()) // title not inserted
            isWrong = true;
        else if (questionText.length === 0) // no question inserted
            isWrong = true;
        setWrongForm(isWrong);
    }, [title, questionText]);

    const myHandleSubmit = (ev) => {
        ev.preventDefault();

        // Now show error messages, if there are any
        setValidated(true);

        if (!wrongForm) {
            let surveyToSend = {
                "title": title,
                "text": questionText,
                "answers": possibleAnswers,
                "min_ans": minAns,
                "max_ans": maxAns
            }

            API.storeSurvey(surveyToSend).catch(err => props.setMessage({ msg: `Error: ${err}!`, type: 'danger' }))
                .then(setSubmitted(true)).then(props.setMessage({ msg: `Survey created successfully!`, type: 'success' }))
                .then(props.setReloadAdminSurveys(s => !s));
        }
    };

    return (
        <>
            {submitted ? <Redirect to="/admin-home" /> : null}
            <br />
            <Col md={{ span: 8, offset: 2 }}>
                <Form noValidation onSubmit={(ev) => myHandleSubmit(ev)}>
                    <h2>Create new survey</h2>
                    <hr />
                    <Form.Group>
                        <Form.Label>{<b>Title</b>}</Form.Label>
                        <Form.Control type='text' value={title} onChange={ev => setTitle(ev.target.value)} isInvalid={validated && title.isEmpty()} />
                        <Form.Control.Feedback type="invalid">Required field</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group>
                        {
                            validated && questionText.length === 0 ?
                                <p class="text-danger" style={{ fontSize: 13 }}>Please insert at least one question</p>
                                : null
                        }
                        {
                            questionText.map((q, index) =>
                                <>
                                    <hr />
                                    <Row key={"a" + index}>
                                        <Col sm={{ span: 9 }}>
                                            <Form.Label>{<><b>Question {index + 1}: </b> {q}</>}</Form.Label>
                                            {
                                                possibleAnswers[index] ?
                                                    <p style={{ color: '#707070', fontSize: 13 }}>
                                                        {"Minimum required answers: " + minAns[index] + ", Maximum required answers: " + maxAns[index]}
                                                    </p>

                                                    :
                                                    <p style={{ color: '#707070', fontSize: 13 }}>{minAns[index] === 1 ? "Mandatory question" : "Optional question"}</p>
                                            }
                                        </Col>
                                        <Col sm={{ span: 1, offset: 0 }}>
                                            {
                                                index === 0 ?
                                                    < ArrowUpCircle size={20} color="grey" />
                                                    :
                                                    <a href="#/">< ArrowUpCircle size={20} color="blue" href="#/" onClick={() => handleMoveQuestion(index, true)} /></a>
                                            }
                                        </Col>
                                        <Col sm={{ span: 1, offset: 0 }}>
                                            {
                                                index === questionText.length - 1 ?
                                                    < ArrowDownCircle size={20} color="grey" />
                                                    :
                                                    <a href="#/">< ArrowDownCircle size={20} color="blue" href="#/" onClick={() => handleMoveQuestion(index, false)} /></a>
                                            }
                                        </Col>
                                        <Col sm={{ span: 1, offset: 0 }}>
                                            <a href="#/">< Trash size={20} color="blue" href="#/" onClick={() => handleDeleteQuestion(index)} /></a>
                                        </Col>
                                    </Row>
                                    {possibleAnswers[index] ?
                                        possibleAnswers[index].split(";").map((a, index) =>
                                            <AnswerRow a={a} key={"b" + index} index={index} />
                                        )
                                        : null
                                    }
                                </>
                            )}
                    </Form.Group>
                    <Row>
                        <Col>
                            <Button variant="primary" onClick={handleShowForm} >Add question</Button>
                        </Col>
                    </Row>
                    <Modal show={showForm} onHide={handleCloseForm}>
                        <Modal.Header closeButton>
                            <Modal.Title>Add a new question</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {<QuestionForm handleCloseForm={handleCloseForm} setQuestionText={setQuestionText} setPossibleAnswers={setPossibleAnswers}
                                setMinAns={setMinAns} setMaxAns={setMaxAns} />}
                        </Modal.Body>
                    </Modal>
                    <hr />
                    {
                        wrongForm && validated ?
                            <p class="text-danger" style={{ fontSize: 13 }}>Please fix errors before publishing survey</p> : null
                    }
                    <Row>
                        <Col sm={{ span: 3, offset: 6 }}>
                            <Button type="submit">Publish survey</Button>
                        </Col>
                        <Col sm={{ span: 3, offset: 0 }}>
                            <Button variant="secondary" onClick={() => { setSubmitted(true); props.setReloadAdminSurveys(s => !s) }}>
                                Back to your surveys
                            </Button>
                        </Col>
                    </Row>
                </Form >
            </Col>
            <br />
            <br />
        </>
    );
}


function QuestionForm(props) {

    /* possible answers for the current question */
    let [questionAnswers, setQuestionAnswers] = useState([]);
    /* min required answers for the current question */
    let [minAns, setMinAns] = useState(0);
    /* max required answers for the current question */
    let [maxAns, setMaxAns] = useState(1);
    /* text of the question */
    let [qText, setQText] = useState("");
    /* true when user clicks on submit the first time, used to display 
        error messages */
    let [qValidated, setqValidated] = useState(false);
    /* true if an error regarding min and max ans occurs, used to 
        display the relative error message */
    let [errorMsgMinMax, setErrorMsgMinMax] = useState(false);
    /* true if an error regarding an empty answer occurs, used to 
    display the relative error message */
    let [errorMsgEmptyAns, setErrorMsgEmptyAns] = useState(false);
    /* true if there are errors in the form, false otherwise */
    let [wrongFormQ, setWrongFormQ] = useState(true);

    useEffect(() => {
        let isWrong = false;
        // VALIDATION
        if (qText.isEmpty()) // check if text of question was inserted
            isWrong = true;

        // check if there are empty answers
        if (questionAnswers.some(qAns => qAns.isEmpty())) {
            isWrong = true;
            setErrorMsgEmptyAns(qValidated);
        }
        else
            setErrorMsgEmptyAns(false);

        // check if values for min ans and max ans are compatible with each other
        if (minAns > maxAns) {
            isWrong = true;
            setErrorMsgMinMax(qValidated);
        } else
            setErrorMsgMinMax(false);

        setWrongFormQ(isWrong);
    }, [qText, questionAnswers, minAns, maxAns, qValidated]);


    const myHandleSubmitQ = (ev) => {

        ev.preventDefault();

        setqValidated(true);

        // if no errors, save the new question in the main states
        if (!wrongFormQ) {
            let possible_answers = questionAnswers[0];
            // possible answers are stored as a unique string separated by ;
            for (let i = 1; i < questionAnswers.length; i++)
                possible_answers = possible_answers + ";" + questionAnswers[i];

            props.setQuestionText(q => [...q, qText]);
            props.setPossibleAnswers(a => [...a, possible_answers]);
            props.setMinAns(a => [...a, minAns]);
            props.setMaxAns(a => [...a, maxAns]);
            props.handleCloseForm();
        }
    };

    /* add the text of a new possible answer */
    const storeAnswerText = (text, index) => {
        setQuestionAnswers(oldAns => {
            const newAns = oldAns.map((ans, j) => {
                if (j === index)
                    // replace ";" in answers with a similar unicode representation of the semicolon
                    // this avoids problems since answers in the db are separated by ";"
                    return text.replaceAll(";", "\uff1b");
                else
                    return ans;
            });
            return newAns;
        });
    }

    /* delete a possible answer */
    const handleDeleteAnswer = (index) => {
        setQuestionAnswers(oldAns => {
            return oldAns.filter((a, j) => index !== j)
        });
    }

    return (
        <Form>
            <Form.Group >
                <Form.Label>Question</Form.Label>
                <Form.Control type='text' value={qText} onChange={ev => setQText(ev.target.value)} isInvalid={qValidated && qText.isEmpty()} />
                <Form.Control.Feedback type="invalid">Required field</Form.Control.Feedback>
            </Form.Group>

            <Form.Group>
                {
                    questionAnswers.length !== 0 ?
                        <>
                            <Row>
                                <Col>
                                    <Form.Label>Minimum required answers</Form.Label>
                                    <Form.Control as="select" value={minAns} onChange={ev => setMinAns(ev.target.value)}>
                                        {
                                            /* min ans can have any value from 0 to questionAnswers.length + 1 */
                                            [...Array(questionAnswers.length + 1).keys()].map(i =>
                                                <option key={i} value={i}>{i}</option>
                                            )
                                        }
                                    </Form.Control>
                                </Col>
                                <Col>
                                    <Form.Label>Maximum required answers</Form.Label>
                                    <Form.Control as="select" value={maxAns} onChange={ev => setMaxAns(ev.target.value)}>
                                        {
                                            /* max ans can have any value from 1 to questionAnswers.length + 1 */
                                            [...Array(questionAnswers.length + 1).keys()].map(i => {
                                                if (i !== 0)
                                                    return <option key={i} value={i}>{i}</option>
                                                else return null
                                            }
                                            )
                                        }
                                    </Form.Control>
                                </Col>
                            </Row>
                            {errorMsgMinMax ?
                                <p class="text-danger" style={{ fontSize: 13 }}>Minimum required answers cannot be more than maximum required answers</p>
                                : null
                            }
                        </>
                        :
                        <Row>
                            <Col>
                                <Form.Check type="checkbox" label="Set question as mandatory" checked={minAns === 1}
                                    onClick={() => setMinAns(a => 1 - a)}></Form.Check>
                            </Col>
                        </Row>
                }
            </Form.Group>

            {
                questionAnswers.length !== 0 ?
                    <Form.Group>
                        <hr />
                        <Form.Label>Answers</Form.Label>
                        {errorMsgEmptyAns ?
                            <p class="text-danger" style={{ fontSize: 13 }}>Answers cannot be empty</p>
                            : null
                        }

                        {questionAnswers.map((a, index) =>
                            <Row>
                                <Col sm={{ span: 10 }}>
                                    <Form.Control id="formAnswers" type="text" value={a} onChange={ev => storeAnswerText(ev.target.value, index)} key={index} />
                                </Col>
                                <Col>
                                    <a href="#/">< Trash color="blue" href="#/" onClick={() => handleDeleteAnswer(index)} /></a>
                                </Col>
                            </Row>
                        )}
                    </Form.Group>
                    : null
            }
            <Button onClick={() => setQuestionAnswers(a => [...a, ""])}>Add answer</Button>
            <hr />
            {
                wrongFormQ && qValidated ?
                    <p class="text-danger" style={{ fontSize: 13 }}>Please fix errors before saving</p> : null
            }
            <Row>
                <Col sm={{ span: 1, offset: 7 }}>
                    <Button onClick={ev => myHandleSubmitQ(ev)}>Save</Button>
                </Col>
                <Col sm={{ offset: 1 }}>
                    <Button variant='secondary' onClick={props.handleCloseForm}>Cancel</Button>
                </Col>
            </Row>
        </Form>
    )
}


function AnswerRow(props) {
    return (
        <Form.Check type="radio" label={props.a} checked={false} disabled />
    );
}


export default AddSurveyForm
