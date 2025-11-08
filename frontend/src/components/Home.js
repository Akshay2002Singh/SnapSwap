import React, { useEffect, useState } from 'react'
import NavBar from './NavBar'
import obj from '../url'
import Alertmst from './Alertmst'
import Background from './Background'
import Card from './Card'
import { TailSpin } from 'react-loader-spinner'
import { useSearchParams } from 'react-router-dom'

function Home(props) {
    const backend_url = obj.backend_url
    const [imageData, setImageData] = useState([])
    const [searchParams, setSearchParams] = useSearchParams()
    const currentPage = parseInt(searchParams.get('page')) || 1
    const [page, setPage] = useState(currentPage)
    const [morePage, setMorePage] = useState(false)
    const [msg, setMsg] = useState("")
    const [loader, setLoader] = useState(true)

    

    const showImages = imageData.map((data, index) => {
        return <Card data={data} index={index} setMsg={setMsg} authToken={props.authToken} />
    })

    useEffect(() => {
        setLoader(true)
        fetch(`${backend_url}/api/images/getImages?page=${page-1 < 0 ? 0 : page-1}`).
            then(response => response.json()).
            then(data => {
                setImageData(data.data)
                // setPage(page + 1)
                setMorePage(data.morePage)
                console.log(data.data)
            }).catch(error => console.log(error))
        setLoader(false)
    }, [page])

    useEffect(() => {
        setSearchParams({ page })
    }, [page])

    return (
        <>
            <NavBar authToken={props.authToken} setAuthToken={props.setAuthToken} />
            <Alertmst msg={msg} setMsg={setMsg} />
            <Background />
            <h1 className='mainHeading'>Image & Video Gallery</h1>

            <TailSpin
                height="250"
                width="250"
                color="#4fa94d"
                ariaLabel="tail-spin-loading"
                radius="1"
                wrapperStyle={{}}
                wrapperClass="fidgetLoader"
                visible={loader}
            />
            <div id='home_image_container'>
                {showImages}
            </div>
            <div className='homeBtnHolder'>
                <div id='previousHolder'>
                    {page > 1 ?
                        <button class="btn-class-previous" onClick={() => setPage(page - 1)}>
                            <svg viewBox="0 0 320 512" height="1em" xmlns="http://www.w3.org/2000/svg">
                                <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z">
                                </path>
                            </svg>
                            <span>Previous</span>
                        </button>
                        : ""}
                </div>
                <div id='nextHolder'>
                    {morePage ?
                        <button class="btn-class-next" onClick={() => setPage(page + 1)}>
                            <span>Next</span>
                            <svg viewBox="0 0 320 512" height="1em" xmlns="http://www.w3.org/2000/svg">
                                <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z">
                                </path>
                            </svg>
                        </button>
                        : ""}
                </div>
            </div>
        </>
    )
}

export default Home