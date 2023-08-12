import React from 'react'
import { Link } from 'react-router-dom'
import { Oval } from 'react-loader-spinner'

function Sign_in(props) {

    return (
        <>
            <div class="form-container">
                <p class="title">Login</p>
                <form class="form">
                    <div class="input-group">
                        <label for="username">Username</label>
                        <input type="text" name="username" id="username" placeholder="Username" required  />
                    </div>
                    <div class="input-group">
                        <label for="password">Password</label>
                        <input type="password" name="password" id="password" placeholder="Password" required  />
                    </div>
                    <button class="sign" type='submit'>
                        sign in
                    </button>
                </form>
                <p class="signup">Don't have an account?
                    <a rel="noopener noreferrer" > Sign up</a>
                </p>
            </div>
        </>
    )
}

export default Sign_in