import React from 'react'
import { Oval } from 'react-loader-spinner'
import { useState } from 'react';


function Upload() {
    const [image, setImage] = useState(null)
    const [msg, setMsg] = useState("")
    const [defaultImg, setDefaultImg] = useState(`${process.env.PUBLIC_URL}avtar.png`)
    const [showLoader, setShowLoader] = useState(true)
    const [tag, setTag] = useState([""])

    const handlePhoto = (e) => {
        // console.log(e.target.files[0])
        if (e.target.files[0]) {
            document.getElementById("imgPreview").src = URL.createObjectURL(e.target.files[0]);
            setImage(e.target.files[0]);
        } else {
            document.getElementById("imgPreview").src = defaultImg;
            setImage(null);
        }
    }

    const handleInputTag = (index) =>  event => {
        let newTags = [...tag];
        newTags[index] = event.target.value
        setTag(newTags)
    }

    const removeTag = (index)=>{
        if(tag.length > 1){
            setTag(tag.filter((ele,ind) => {
                return ind !== index
            }))
        }
    }

    const showTags = tag.map((t, index) => {
        return (
            <div class="link-input-group half" key={index}>
                <span onClick={() => removeTag(index)}>x</span>
                <input type="text" placeholder="Enter tag" value={tag[index]} onChange={handleInputTag(index)} required />
            </div>
        )
    })

    return (
        <>
            <div class="link-form-container">
                <p class="title">Upload Image</p>
                <form class="form">
                    <div class="link-input-group">
                        <label for="name">Title</label>
                        <input type="text" name="name" id="name" placeholder="Image Title" required />
                    </div>
                    <div class="link-input-group">
                        <label for="Profile">Profile photo</label>
                        <input type="file" name="Profile" id="Profile" accept="image/*" onChange={handlePhoto} required />
                        <img src={defaultImg} alt='Image Preview' id='imgPreview' />
                    </div>
                    <p class="sub-title">Tags</p>
                    <div className='flex-container'>
                        {showTags}
                    </div>


                    <button class="sign addMore" onClick={() => setTag([...tag, ""])}>
                        Add Tag
                    </button>
                </form>
            </div>
            <button class="cssbuttons-io-button">
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
                    /> :
                    <>
                        <svg viewBox="0 0 640 512" fill="white" height="1em" xmlns="http://www.w3.org/2000/svg"><path d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z"></path></svg>
                        <span>Upload</span>
                    </>
                }
            </button>
        </>
    )
}

export default Upload