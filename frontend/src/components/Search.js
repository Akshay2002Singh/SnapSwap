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
    const [loader, setLoader] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const handleSubmit = async () => {
        const inputElement = document.getElementById("searchInput")
        const rawValue = inputElement ? inputElement.value : ''
        const trimmedValue = rawValue.trim()

        if (!trimmedValue) {
            setImageData([])
            setMsg("Please enter a search term")
            setLoader(false)
            setHasSearched(true)
            return
        }

        setLoader(true)

        const tags = JSON.stringify(
            trimmedValue
                .toLowerCase()
                .split(/\s+/)
                .filter(Boolean)
        )

        try {
            const response = await fetch(`${backend_url}/api/images/search`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    'val': tags
                }),
            })

            if (!response) {
                throw new Error('No response received')
            }

            const data = await response.json()

            if (!data || data.msg === 'data not found' || !Array.isArray(data.data) || data.data.length === 0) {
                setImageData([])
                setMsg("No match found")
            } else if (data.msg === 'error') {
                setImageData([])
                setMsg("Something went wrong")
            } else {
                setImageData(data.data)
                setMsg("")
            }
        } catch (error) {
            console.log(error)
            setImageData([])
            setMsg("Something went wrong")
        } finally {
            setLoader(false)
            setHasSearched(true)
        }
    }

    const handleEnter = (event) => {
        if (event.keyCode === 13) {
            event.preventDefault();
            document.getElementById("searchBtn").click();
        }
    }



    const handleCardDelete = (id) => {
        setImageData(prev => prev.filter(item => item._id !== id))
    }

    const showImages = imageData.map((data, index) => (
        <Card
            key={data._id || data.path || index}
            data={data}
            index={index}
            setMsg={setMsg}
            authToken={props.authToken}
            currentUsername={props.currentUsername}
            onDelete={handleCardDelete}
        />
    ))

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
            {imageData.length > 0 ?
                <>
                    <h1 className='mainHeading'>Search Results</h1>
                    <div id='home_image_container'>
                        {showImages}
                    </div>
                </>
                : null}
            {
                !loader && imageData.length === 0 && hasSearched ?
                    <div style={{ color: "#e0dfdf", textAlign: "center", marginTop: "20px" }}>
                        No results yet. Try different keywords.
                    </div>
                    :
                    null
            }
        </>
    )
}

export default Search