import React from 'react'
import { Oval } from 'react-loader-spinner'
import { useState } from 'react'

function Sign_up() {
    const [showLoader, setShowLoader] = useState(false)

  return (
    <div className="form-container">
                <p className="title">Create Account</p>
                <form className="form" >
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" name="email" id="email" placeholder="Email" required  />
                    </div>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input type="text" name="username" id="username" placeholder="Username" required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" name="password" id="password" placeholder="Password" required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input type="password" name="confirmPassword" id="confirmPassword" placeholder="Confirm Password" required />
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
                    <a rel="noopener noreferrer" to="/sign_in"> Sign in</a>
                </p>
            </div>
  )
}

export default Sign_up