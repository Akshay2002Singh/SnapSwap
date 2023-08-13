import React, { useState } from 'react'
import NavBar from './NavBar'
import obj from '../url'
import Alertmst from './Alertmst'
import Background from './Background'
import Card from './Card'
import { FidgetSpinner } from 'react-loader-spinner'


function Search(props) {
    const backend_url = obj.backend_url
    const [imageData, setImageData] = useState([])
    const [msg, setMsg] = useState("")
    const [loader,setLoader] = useState(false)

    const handleSubmit = async () => {
        let val = document.getElementById("searchInput").value
        setLoader(true)
        if (!val) {
            return
        }
        val = val.toLowerCase()
        val = val.split(" ")
        val = JSON.stringify(val)
        const response = await fetch(`${backend_url}/api/images/search`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                'val': val
            }),
        }).catch(error => {
            setMsg("Something Went Wrong")
            console.log(error)
        })
        const data = await response.json()

        if (data.msg === 'data not found') {
            setMsg("No match found")
        } else if (data.msg === 'error') {
            setMsg("Something went wrong")
        } else {
            setImageData(data.data)
            setMsg("")
        }
        setLoader(false)
    }

    const handleEnter = (event)=>{
        if (event.keyCode === 13) {
            event.preventDefault();
            document.getElementById("searchBtn").click();
        }
    }



    const showImages = imageData.map((data, index) => {
        return <Card data={data} index={index} setMsg={setMsg} authToken={props.authToken} />
    })

    return (
        <>
            <NavBar authToken={props.authToken} setAuthToken={props.setAuthToken} />
            <Alertmst msg={msg} setMsg={setMsg} />
            <Background />
            <div class="search">
                <div class="search-box">
                    <div class="search-field">
                        <input placeholder="Search..." class="input" type="text" id='searchInput' onKeyUp={handleEnter} />
                        <div class="search-box-icon">
                            <button class="btn-icon-content" onClick={handleSubmit} id='searchBtn'>
                                <i class="search-icon">
                                    <svg xmlns="://www.w3.org/2000/svg" version="1.1" viewBox="0 0 512 512"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" fill="#fff"></path></svg>
                                </i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <h1 className='mainHeading'>Search Results</h1>
            <FidgetSpinner
                visible={loader}
                height="250"
                width="250"
                ariaLabel="dna-loading"
                wrapperStyle={{}}
                wrapperClass="dna-wrapper fidgetLoader"
                ballColors={['#ff0000', '#00ff00', '#0000ff']}
                backgroundColor="#F4442E"
            />
            <div id='home_image_container'>
                {showImages}
            </div>
        </>
    )
}

export default Search