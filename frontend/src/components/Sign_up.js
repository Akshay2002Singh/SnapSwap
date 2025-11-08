import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Foot from './Foot'
import Alertmst from './Alertmst'
import Background from './Background'
import { Oval } from 'react-loader-spinner'
import obj from '../url'
import NavBar from './NavBar'

function Sign_up(props) {
    const navigate = useNavigate()
    const backend_url = obj.backend_url
    // userstate to store form data 
    const [user, setUser] = useState({
        'username': '',
        'email': '',
        'password': '',
        'confirmPassword': ''
    })
    // state to show msg 
    const [msg, setMsg] = useState("")
    const [showLoader, setShowLoader] = useState(false)

    function handleInput(e) {
        setUser({
            ...user,
            [e.target.name]: e.target.value
        })
        // console.log(user)
    }

    async function handleSubmit(event) {
        event.preventDefault();
        // check for password 
        setShowLoader(true)
        if (user.password !== user.confirmPassword) {
            setMsg("Password and Confirm password are not same")
            setShowLoader(false)
            return
        }
        
        // Check if backend_url is defined
        if (!backend_url) {
            setMsg("Backend URL not configured. Please check your environment variables.")
            setShowLoader(false)
            return
        }
        
        // check for username 
        try {
            const response = await fetch(`${backend_url}/api/auth/isValidUser`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 'username': user.username }),
            })
            
            if (!response) {
                setMsg("Cannot connect to server. Please make sure the backend is running.")
                setShowLoader(false)
                return
            }
            
            if (!response.ok) {
                const errorText = await response.text()
                console.error("Response error:", response.status, errorText)
                setMsg(`Server error (${response.status}). Please try again.`)
                setShowLoader(false)
                return
            }
            
            const data = await response.json()
            console.log(data)
            if (!data.valid) {
                setMsg("This username already exist, try another")
                setShowLoader(false)
                return
            }
            
            // check for email
            console.log("Attempting to validate email:", user.email)
            const email_response = await fetch(`${backend_url}/api/auth/isValidEmail`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 'email': user.email }),
            })
            
            if (!email_response) {
                setMsg("Cannot connect to server. Please make sure the backend is running.")
                setShowLoader(false)
                return
            }
            
            if (!email_response.ok) {
                const errorText = await email_response.text()
                console.error("Email validation error:", email_response.status, errorText)
                setMsg(`Server error (${email_response.status}). Please try again.`)
                setShowLoader(false)
                return
            }
            
            const email_data = await email_response.json()
            if (!email_data.valid) {
                setMsg("This Email already exist, try another")
                setShowLoader(false)
                return
            }
            
            // Submit data to backend 
            console.log("Attempting to create user")
            const create_user_response = await fetch(`${backend_url}/api/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    'email' : user.email,
                    'username' : user.username,
                    'password' : user.password
                }),
            })
            
            if (!create_user_response) {
                setMsg("Cannot connect to server. Please make sure the backend is running.")
                setShowLoader(false)
                return
            }
            
            if (!create_user_response.ok) {
                const errorText = await create_user_response.text()
                console.error("Signup error:", create_user_response.status, errorText)
                setMsg(`Server error (${create_user_response.status}). Please try again.`)
                setShowLoader(false)
                return
            }
            
            const create_user_data = await create_user_response.json()
            // console.log(create_user_data)
            if(create_user_data.userCreated){
                setMsg("")
                setShowLoader(false)
                navigate('/sign_in')
            } else if (create_user_data.error) {
                setMsg(create_user_data.error === "Validation error" ? "Invalid input. Please check your email, username, and password." : create_user_data.error)
                setShowLoader(false)
            } else {
                setMsg("Something went wrong. User not created.")
                setShowLoader(false)
            }
        } catch (error) {
            console.error("Sign up error:", error)
            if (error.message && error.message.includes('Failed to fetch')) {
                setMsg("Cannot connect to server. Please make sure the backend is running on " + (backend_url || "the configured port"))
            } else {
                setMsg("An error occurred: " + (error.message || "Please try again."))
            }
            setShowLoader(false)
        }
    }

    return (
        <>
            <Background/>
            <NavBar authToken={props.authToken} setAuthToken={props.setAuthToken} />
            <Alertmst msg={msg} setMsg={setMsg} />
            <div className="form-container">
                <p className="title">Create Account</p>
                <form className="form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" name="email" id="email" placeholder="Email" required value={user.email} onChange={handleInput} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input type="text" name="username" id="username" placeholder="Username" required value={user.username} onChange={handleInput} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" name="password" id="password" placeholder="Password" required value={user.password} onChange={handleInput} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input type="password" name="confirmPassword" id="confirmPassword" placeholder="Confirm Password" required value={user.confirmPassword} onChange={handleInput} />
                    </div>
                    <button type='submit' className="sign" >
                    {showLoader ?
                            <Oval
                            height={25}
                            width={25}
                            color="black"
                            wrapperStyle={{}}
                            wrapperClass="loader_react"
                            visible={true}
                            ariaLabel='oval-loading'
                            secondaryColor="grey"
                            strokeWidth={5}
                            strokeWidthSecondary={5}
                        /> : 'Sign up'}
                        </button>
                </form>
                <p className="signup">Already have an account?
                    <Link rel="noopener noreferrer" to="/sign_in"> Sign in</Link>
                </p>
            </div>
        </>
    )
}

export default Sign_up