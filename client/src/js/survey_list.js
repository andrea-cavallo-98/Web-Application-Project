
import { ListGroup, Form, Col, Row, Badge } from 'react-bootstrap';
import { useState } from 'react';
import { Redirect } from 'react-router';


const SurveyList = function (props) {

    let title_msg = props.admin ? "Your surveys" : "Available surveys"
    /* used to redirect to the proper path when the user selects a survey to either
        fill (user) or view (admin logged in) */
    let [surveySelected, setSurveySelected] = useState(false);
    let link = props.admin ? "/view-survey" : "/fill-survey"

    return (
        <>
            {surveySelected ? <Redirect to={link} /> : null}

            <ListGroup className="my-3">
                <Row>
                    <Col md={{ span: 8, offset: 2 }}>
                        <h2>{title_msg}</h2>
                    </Col>
                </Row>
                <br />
                <Row>
                    {
                        (!props.newSurveysReady) && props.admin ?
                            <Col md={{ span: 8, offset: 5 }}>
                                <p style={{ fontSize: 20 }}>Loading...</p>
                            </Col>
                            :
                            <Col md={{ span: 8, offset: 2 }}>
                                {
                                    props.surveys.length !== 0 ? props.surveys.map(s =>
                                        <SurveyListRow survey={s} setSurvey={props.setSurvey} key={s.id} admin={props.admin}
                                            setResponses={props.setResponses} setSurveySelected={setSurveySelected}
                                            setNewQuestionsReady={props.setNewQuestionsReady} />
                                    )
                                        :
                                        <p style={{ fontSize: 20 }}>No surveys available...</p>
                                }
                            </Col>
                    }
                </Row>
            </ListGroup>
            <br />
            <br />
        </>
    )
}


function SurveyListRow(props) {
    /* state to change the background of the component when
        hovering with the mouse */
    let [bgColor, setBgColor] = useState("");

    const setSurveyInfo = function () {
        props.setNewQuestionsReady(false);
        props.setSurvey(props.survey)
        props.setSurveySelected(true);
        if (props.admin)
            props.setResponses(props.survey.responses)
    }

    return (
        <a href="#/">
            <ListGroup.Item variant={bgColor}
                onMouseOver={() => setBgColor("primary")}
                onMouseLeave={() => setBgColor("")}
                onClick={() => { setSurveyInfo() }}

            >
                <Form.Group>
                    <Row >
                        <Col xs style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Form.Text style={{ fontSize: 14, color: '#000' }}> {props.survey.title} </Form.Text>
                        </Col>
                        {
                            props.admin ?
                                <Col xs style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {
                                        props.survey.responses === 1 ?
                                            <Badge variant="dark">{props.survey.responses + " response"}</Badge>
                                            :
                                            <Badge variant="dark">{props.survey.responses + " responses"}</Badge>
                                    }
                                </Col>
                                : null
                        }

                    </Row>
                </Form.Group>
            </ListGroup.Item>
        </a>

    );
}


export default SurveyList