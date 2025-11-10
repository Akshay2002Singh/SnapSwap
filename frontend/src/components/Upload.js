import React, { useEffect } from 'react'
import { Oval } from 'react-loader-spinner'
import { useState } from 'react';
import NavBar from './NavBar';
import obj from '../url'
import Background from './Background';
import Alertmst from './Alertmst';
import { useNavigate } from 'react-router-dom';

// Get max file size from environment variable (default: 12MB)
const MAX_FILE_SIZE = parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '12582912') // 12MB in bytes

function Upload(props) {
    const navigate = useNavigate()
    const [title, setTitle] = useState("")
    const [image, setImage] = useState(null)
    const [fileType, setFileType] = useState("image") // 'image' or 'video'
    const [msg, setMsg] = useState("")
    const [defaultImg, setDefaultImg] = useState(`${process.env.PUBLIC_URL}upload.png`)
    const [showLoader, setShowLoader] = useState(false)
    const [tag, setTag] = useState([""])
    const backend_url = obj.backend_url
    // console.log(props.authToken)
    useEffect(()=>{
        if(!props.authToken){
            navigate('/sign_in')
        }
    },[])

    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowLoader(true)
        const formData = new FormData();
        formData.append('title', title);
        formData.append('photo', image);
        formData.append('tags', JSON.stringify(tag));
        const response = await fetch(`${backend_url}/api/images/upload`, {
            method: "POST",
            headers: {
                "authToken": props.authToken
            },
            body: formData,
        }).catch(error => console.log(error))
        const data = await response.json()
        if(data.msg === "file not saved" || data.msg === "image not saved"){
            setMsg("Something went wrong, Data not saved")
        }else if(data.msg && data.msg.includes("size exceeds") && data.msg.includes("limit")){
            setMsg(data.msg + ". Please upload a smaller file.")
        }else{
            setTitle("")
            if(fileType === "image") {
                document.getElementById("imgPreview").src = defaultImg;
            } else {
                const videoPreview = document.getElementById("videoPreview");
                if(videoPreview) {
                    videoPreview.src = "";
                    videoPreview.style.display = "none";
                }
                document.getElementById("imgPreview").style.display = "block";
            }
            setImage(null)
            setFileType("image")
            setTag([""])
            setMsg("Data saved successfully")
        }
        setShowLoader(false)
        window.scrollTo(0, 0)
    }

    const handlePhoto = (e) => {
        const file = e.target.files[0];
        if (file) {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');
            
            if (isVideo) {
                // Check file size
                if (file.size > MAX_FILE_SIZE) {
                    const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024))
                    setMsg(`Video size exceeds ${maxSizeMB}MB limit. Please select a smaller video.`);
                    e.target.value = ""; // Reset file input
                    return;
                }
                setFileType("video");
                setImage(file);
                
                // Hide image preview, show video preview
                const imgPreview = document.getElementById("imgPreview");
                let videoPreview = document.getElementById("videoPreview");
                
                if (!videoPreview) {
                    // Create video element if it doesn't exist
                    videoPreview = document.createElement("video");
                    videoPreview.id = "videoPreview";
                    videoPreview.controls = true;
                    videoPreview.style.maxWidth = "100%";
                    videoPreview.style.maxHeight = "300px";
                    videoPreview.style.display = "block";
                    videoPreview.style.margin = "10px auto";
                    imgPreview.parentNode.insertBefore(videoPreview, imgPreview.nextSibling);
                }
                
                videoPreview.src = URL.createObjectURL(file);
                videoPreview.style.display = "block";
                imgPreview.style.display = "none";
            } else if (isImage) {
                // Check file size for images
                if (file.size > MAX_FILE_SIZE) {
                    const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024))
                    setMsg(`Image size exceeds ${maxSizeMB}MB limit. Please select a smaller image.`);
                    e.target.value = ""; // Reset file input
                    return;
                }
                setFileType("image");
                setImage(file);
                
                const imgPreview = document.getElementById("imgPreview");
                const videoPreview = document.getElementById("videoPreview");
                if (videoPreview) {
                    videoPreview.style.display = "none";
                    videoPreview.src = "";
                }
                imgPreview.src = URL.createObjectURL(file);
                imgPreview.style.display = "block";
            } else {
                setMsg("Please select an image or video file.");
                e.target.value = "";
            }
        } else {
            document.getElementById("imgPreview").src = defaultImg;
            document.getElementById("imgPreview").style.display = "block";
            const videoPreview = document.getElementById("videoPreview");
            if (videoPreview) {
                videoPreview.style.display = "none";
                videoPreview.src = "";
            }
            setImage(null);
            setFileType("image");
        }
    }

    const handleInputTag = (index) => event => {
        let newTags = [...tag];
        newTags[index] = event.target.value.toLowerCase()
        setTag(newTags)
    }

    const removeTag = (index) => {
        if (tag.length > 1) {
            setTag(tag.filter((ele, ind) => {
                return ind !== index
            }))
        }
    }

    const showTags = tag.map((t, index) => {
        return (
            <div className="link-input-group half" key={index}>
                {index !== 0 ?
                    <span onClick={() => removeTag(index)}>x</span>
                    : ""}
                <input type="text" placeholder="Enter tag" value={tag[index]} onChange={handleInputTag(index)} required />
            </div>
        )
    })

    return (
        <>
            <NavBar authToken={props.authToken} setAuthToken={props.setAuthToken} />
            <Alertmst msg={msg} setMsg={setMsg} />
            <Background />
            <div className="link-form-container">
                <p className="title">Upload Image or Video</p>
                <form className="form" onSubmit={handleSubmit}>
                    <div className="link-input-group">
                        <label htmlFor="name">Title</label>
                        <input type="text" name="name" id="name" placeholder="File Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="link-input-group">
                        <label htmlFor="Profile">Upload Image or Video</label>
                        <input type="file" name="Profile" id="Profile" accept="image/*,video/*" onChange={handlePhoto} required />
                        <img src={defaultImg} alt='Image Preview' id='imgPreview' style={{display: 'block'}} />
                        <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                            Maximum file size: {Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB
                        </p>
                    </div>
                    <p className="sub-title">Tags</p>
                    <div className='flex-container'>
                        {showTags}
                    </div>


                    <button className="sign addMore" onClick={() => setTag([...tag, ""])}>
                        Add Tag
                    </button>
                    <button type='submit' id='form_submit' style={{ "display": "none" }}>Submit</button>
                </form>
            </div>
            <button className="cssbuttons-io-button" onClick={() => document.getElementById('form_submit').click()}>
                {showLoader ?
                    <Oval
                        height={25}
                        width={25}
                        color="black"
                        wrapperStyle={{}}
                        wrapperclassName="loader_react"
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