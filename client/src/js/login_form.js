
import { EyeFill } from 'react-bootstrap-icons';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Link } from 'react-router-dom';


const LoginForm = function (props) {
    /* password inserted */
    const [passwordType, setPasswordType] = useState("password");
    /* state used to track hide/show password */
    const togglePasswordType = () => { setPasswordType((old) => old === "password" ? "text" : "password") }

    const myHandleSubmit = (values) => {

        const credentials = {
            username: values.username,
            password: values.password
        };
        props.doLogin(credentials);
    }

    // use formik for validation
    const formik = useFormik({
        initialValues: {
            username: '',
            password: ''
        },
        validationSchema: Yup.object({
            username: Yup.string().required('Required field'),
            password: Yup.string().required('Required field'),
        }),
        onSubmit: myHandleSubmit,
    });


    return (
        <>
            <h2>Login</h2>
            <Form onSubmit={formik.handleSubmit} >
                <Form.Group>
                    <Form.Label>Username</Form.Label>
                    <Form.Control id="username" type='text' value={formik.values.username} onChange={formik.handleChange} isInvalid={formik.touched.username && formik.errors.username} />
                    <Form.Control.Feedback type="invalid">{formik.errors.username}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Password</Form.Label>
                    <Form.Control id="password" type={passwordType} value={formik.values.password} onChange={formik.handleChange} isInvalid={formik.touched.password && formik.errors.password}>
                    </Form.Control>
                    <Col sm={{ offset: 8 }}>
                        <EyeFill style={{ cursor: "pointer" }} onClick={togglePasswordType} /><i> show password</i>
                    </Col>
                    <Form.Control.Feedback type="invalid">{formik.errors.password}</Form.Control.Feedback>
                </Form.Group>

                <Row>
                    <Col sm={{span:2}}>
                        <Button type="submit">Login</Button>
                    </Col>
                    <Col sm={{offset:0}}>
                        <Link to="/">
                            <Button variant="secondary">Back to all surveys</Button>
                        </Link>
                    </Col>
                </Row>
            </Form>
        </>

    )

}

export default LoginForm;