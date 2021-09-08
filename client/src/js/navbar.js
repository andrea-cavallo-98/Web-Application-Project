import Navbar from 'react-bootstrap/Navbar'
import { UiChecks, PersonCircle } from 'react-bootstrap-icons'
import { useLocation, Link } from 'react-router-dom';
import { Col } from 'react-bootstrap';

const NavBar = function (props) {

    let location = useLocation();

    return (

        <Navbar bg="dark" variant="dark" expand="lg" >
            <Col sm={{ span: 4 }}>
                <UiChecks color="white" size={35} className="mr-5" />
                {
                    /* Do the logout before moving back to home if user is logged in */
                    props.logged ?
                        <Navbar.Brand href="#" onClick={props.doLogout}>Survey manager</Navbar.Brand>
                        :
                        <Navbar.Brand href="/">Survey manager</Navbar.Brand>
                }
            </Col>

            {props.logged ?
                <>
                    <Col sm={{ offset: 5 }}>
                        <Navbar.Brand>{props.adminName}</Navbar.Brand>
                        < PersonCircle action color="white" size={50} />
                    </Col>
                    <Col sm={{ span: 1 }}>
                        <Link to="/" style={{ color: '#FFF' }} onClick={props.doLogout}>Logout</Link>
                    </Col>
                </> :
                <Col sm={{ offset: 6 }}>
                    {   /* Do not display the login link in the login page */
                        location.pathname.endsWith("login") ?
                            null :
                            <Link to="/login" style={{ color: '#FFF' }}>Login as Admin</Link>
                    }
                </Col>
            }

        </Navbar>
    );
}



export default NavBar






