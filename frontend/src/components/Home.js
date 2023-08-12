import React from 'react'

function Card() {
    return (
        <>
            <div className='cardBox'>
                <img src='https://linktree-19kk.onrender.com/static/images/elite.jpeg' />
                <span>Uploaded By : Akshay Singh</span>

                <button class="button"><span>Download</span></button>
            </div>
        </>
    )
}

function Home() {
    return (
        <>
            <h1 className='mainHeading'>Image Gallery</h1>
            <div id='image_container'>
                <Card />
            </div>
        </>
    )
}

export default Home