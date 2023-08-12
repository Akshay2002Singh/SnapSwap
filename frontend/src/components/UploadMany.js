import React, { useState } from 'react'

function UploadMany() {
    const [files, setFiles] = useState({})
    const previewClick = () => {
        document.getElementById('change_image').click();
    }

    const changeInput = (event) => {
        setFiles(event.target.files)
    }

    const addMore = (event) => {
        document.getElementById('add_image').click();
    }

    const addImage = (event) => {
        const filenames = Object.values(files).map((f, index) => f.name)
        if (filenames.includes(event.target.files[0].name)) {
            return
        } else {
            setFiles({
                ...files,
                [Object.keys(files).length]: event.target.files[0]
            })
        }
    }


    const removeFile = (index) => {
        let afterRemoving = {};
        for (let i = 0, newIndex = 0; i < Object.keys(files).length; ++i) {
            if (i !== index) {
                afterRemoving[newIndex] = files[i];
                ++newIndex;
            }
        }
        setFiles(afterRemoving)
    }
    const showFiles = Object.keys(files).map((file, index) => {
        return (
            <>
                <div className='image_container' key={index}
                    onClick={(e) => e.stopPropagation()}>
                    <span className='cross' onClick={() => removeFile(index)}>X</span>
                    <img src={URL.createObjectURL(files[index])} />
                </div>
            </>
        )
    })

    return (
        <>
            <h1 className='mainHeading'>Upload Images</h1>
            <input id='add_image' type='file' accept="image/*" onChange={addImage} />
            <input id='change_image' type='file' accept="image/*" multiple onChange={changeInput} />
            <div>
                <div id='image_preview' onClick={previewClick}>
                    {showFiles}
                </div>
                <div className='btnHolder'>
                    <button className='uploadBtn' onClick={addMore}>Add More</button>
                    <button className='uploadBtn' onClick={previewClick}>Select</button>
                </div>
                <button class="cssbuttons-io-button">
                    <svg viewBox="0 0 640 512" fill="white" height="1em" xmlns="http://www.w3.org/2000/svg"><path d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z"></path></svg>
                    <span>Upload</span>
                </button>
            </div>
        </>
    )
}

export default UploadMany