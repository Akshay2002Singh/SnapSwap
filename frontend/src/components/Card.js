import React, { useState, useCallback } from 'react'
import obj from '../url'

function Card(props) {
    const backend_url = obj.backend_url
    // Default to 'image' if fileType is not set (for backward compatibility)
    const isVideo = props.data.fileType === 'video'
    const [isModalOpen, setIsModalOpen] = useState(false)
    
    function save_file(url, title, fileType) {
        if(!props.authToken){
            props.setMsg(`Sign in to download ${fileType}`)
            window.scroll(0,0)
            return
        }
        props.setMsg(`Downloading ${fileType === 'video' ? 'Video' : 'Image'}`)
        fetch(url, {
            headers: {
                'authToken': props.authToken
            }
        })
            .then(resp => resp.blob())
            .then(blobobject => {
                const blob = window.URL.createObjectURL(blobobject);
                const anchor = document.createElement('a');
                anchor.style.display = 'none';
                anchor.href = blob;
                // Add appropriate file extension
                const ext = fileType === 'video' ? '.mp4' : '';
                anchor.download = title + ext;
                document.body.appendChild(anchor);
                anchor.click();
                window.URL.revokeObjectURL(blob);
                props.setMsg(`${fileType === 'video' ? 'Video' : 'Image'} Downloaded`)
            })
            .catch(() => props.setMsg(`Sorry, an error occurred in downloading the ${fileType === 'video' ? 'Video' : 'Image'}`));
    }
    
    // Get video filename from stored path
    const getVideoFilename = (filePath) => {
        if (!filePath) return '';
        const parts = filePath.split(/[\\/]/);
        return parts[parts.length - 1];
    }

    const appendAuthToken = (url) => {
        if (!props.authToken) return url
        const tokenParam = `authToken=${encodeURIComponent(props.authToken)}`
        return url.includes('?') ? `${url}&${tokenParam}` : `${url}?${tokenParam}`
    }

    const getVideoStreamUrl = (filePath) => {
        const filename = getVideoFilename(filePath);
        if (!filename) return '';
        const baseUrl = `${backend_url}/api/images/stream/${encodeURIComponent(filename)}`;
        return appendAuthToken(baseUrl);
    }
    
    const handleOpenModal = useCallback(() => {
        setIsModalOpen(true)
    }, [])

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false)
    }, [])

    const previewImageSrc = appendAuthToken(`${backend_url}/${props.data.path}`)
    const previewVideoSrc = getVideoStreamUrl(props.data.path)

    return (
        <>
            <div className='cardBox' index={props.index}>
                <div
                    className='cardPreview'
                    role='button'
                    tabIndex={0}
                    onClick={handleOpenModal}
                >
                    {isVideo ? (
                        <video
                            className='cardPreviewMedia'
                            src={previewVideoSrc}
                            preload="metadata"
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            className='cardPreviewMedia'
                            src={previewImageSrc}
                            alt={props.data.title}
                            loading='lazy'
                        />
                    )}
                    <span className='cardPreviewHint'>Tap to open</span>
                </div>
                <span className='imgTitle'>{props.data.title}</span>
                <span className='imgUploadBy'>Uploaded By : {props.data.username}</span>

                <button class="button" onClick={()=>save_file(
                    isVideo 
                        ? getVideoStreamUrl(props.data.path)
                        : appendAuthToken(`${backend_url}/${props.data.path}`), 
                    props.data.title,
                    isVideo ? 'video' : 'image'
                )}>
                    <span>Download</span>
                </button>
            </div>
            {isModalOpen && (
                <div className='mediaModalOverlay' onClick={handleCloseModal}>
                    <div className='mediaModalContent' onClick={event => event.stopPropagation()}>
                        <button className='mediaModalClose' type='button' onClick={handleCloseModal} aria-label='Close preview'>
                            &times;
                        </button>
                        <div className='mediaModalBody'>
                            {isVideo ? (
                                <video
                                    src={previewVideoSrc}
                                    controls
                                    autoPlay
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={previewImageSrc}
                                    alt={props.data.title}
                                />
                            )}
                        </div>
                        <div className='mediaModalMeta'>
                            <div className='mediaModalTitle'>{props.data.title}</div>
                            <div className='mediaModalUploader'>Uploaded by {props.data.username}</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Card