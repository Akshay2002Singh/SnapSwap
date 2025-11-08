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
    const [morePage, setMorePage] = useState(false)
    const [msg, setMsg] = useState("")
    const [loader, setLoader] = useState(true)

    const page = parseInt(searchParams.get('page')) || 1

    const handleCardDelete = (id) => {
        setImageData((prev) => prev.filter((item) => item._id !== id))
    }

    const handleNext = () => {
        setSearchParams({ page: String(page + 1) })
    }

    const handlePrevious = () => {
        const targetPage = page - 1
        if (targetPage <= 1) {
            setSearchParams({})
        } else {
            setSearchParams({ page: String(targetPage) })
        }
    }

    const showImages = imageData.map((data, index) => {
        return (
            <Card
                key={data._id || data.path || index}
                data={data}
                index={index}
                setMsg={setMsg}
                authToken={props.authToken}
                currentUsername={props.currentUsername}
                onDelete={handleCardDelete}
            />
        )
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoader(true)
                const response = await fetch(`${backend_url}/api/images/getImages?page=${page - 1 < 0 ? 0 : page - 1}`)
                const data = await response.json()
                setImageData(Array.isArray(data.data) ? data.data : [])
                setMorePage(Boolean(data.morePage))
            } catch (error) {
                console.error(error)
                setImageData([])
                setMorePage(false)
                setMsg('Unable to load gallery right now.')
            } finally {
                setLoader(false)
            }
        }

        fetchData()

    }, [page, backend_url])

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
                        <button class="btn-class-previous" onClick={handlePrevious}>
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
                        <button class="btn-class-next" onClick={handleNext}>
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