import React from 'react'
import obj from '../url'

function Card(props) {
    const backend_url = obj.backend_url
    function save_image(url,title) {
        if(!props.authToken){
            props.setMsg("Sign in to download image")
            window.scroll(0,0)
            return
        }
        props.setMsg("Downloading Image")
        fetch(url)
            .then(resp => resp.blob())
            .then(blobobject => {
                const blob = window.URL.createObjectURL(blobobject);
                const anchor = document.createElement('a');
                anchor.style.display = 'none';
                anchor.href = blob;
                anchor.download = title;
                document.body.appendChild(anchor);
                anchor.click();
                window.URL.revokeObjectURL(blob);
                props.setMsg("Image Downloaded")
            })
            .catch(() => props.setMsg('Sorry, an error occurred in downloading the Image'));
    }
    return (
        <>
            <div className='cardBox' index={props.index}>
                <img src={`${backend_url}/${props.data.path}`} />
                <span className='imgTitle'>{props.data.title}</span>
                <span className='imgUploadBy'>Uploaded By : {props.data.username}</span>

                <button class="button" onClick={()=>save_image(`${backend_url}/${props.data.path}`,props.data.title)}><span>Download</span></button>
            </div>
        </>
    )
}

export default Card