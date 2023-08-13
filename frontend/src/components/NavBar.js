import React from 'react'
import { Link } from 'react-router-dom';

function NavButtons(props) {
    function handleLogout() {
        props.setAuthToken(null)
        localStorage.removeItem("SnapSwapAuthtoken");
    }
    if (props.authToken === null) {
        return (
            <>
                <Link to="/sign_up" >
                    <button className="btn btn-outline-success mx-1">Sign Up</button>
                </Link>
                <Link to="/sign_in">
                    <button className="btn btn-outline-success mx-1">Login</button>
                </Link>
            </>
        )
    } else {
        return (
            <>
                <Link>
                <button className="btn btn-outline-success mx-1" onClick={handleLogout}>Logout</button>
                </Link>
            </>
        )
    }
}

function NavBar(props) {

    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">SnapSwap</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link to='/' className="nav-link active" aria-current="page" href="#">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link to='/upload' className="nav-link" href="#">Upload</Link>
                        </li>
                        <li className="nav-item">
                            <Link to='/search' className="nav-link" href="#">Search</Link>
                        </li>
                    </ul>
                    <div className="d-flex">
                        <NavButtons authToken={props.authToken} setAuthToken={props.setAuthToken} />
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default NavBar