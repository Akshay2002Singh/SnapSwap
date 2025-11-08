import React, { useState, useCallback } from 'react'
import obj from '../url'

function Card(props) {
    const backend_url = obj.backend_url
    const { data, authToken, setMsg, currentUsername, onDelete, index } = props
    const isVideo = data.fileType === 'video'
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    function save_file(url, title, fileType) {
        if (!authToken) {
            setMsg(`Sign in to download ${fileType}`)
            window.scroll(0, 0)
            return
        }
        setMsg(`Downloading ${fileType === 'video' ? 'Video' : 'Image'}`)
        fetch(url, {
            headers: {
                'authToken': authToken
            }
        })
            .then(resp => resp.blob())
            .then(blobobject => {
                const blob = window.URL.createObjectURL(blobobject);
                const anchor = document.createElement('a');
                anchor.style.display = 'none';
                anchor.href = blob;
                const ext = fileType === 'video' ? '.mp4' : '';
                anchor.download = title + ext;
                document.body.appendChild(anchor);
                anchor.click();
                window.URL.revokeObjectURL(blob);
                setMsg(`${fileType === 'video' ? 'Video' : 'Image'} Downloaded`)
            })
            .catch(() => setMsg(`Sorry, an error occurred in downloading the ${fileType === 'video' ? 'Video' : 'Image'}`));
    }

    const getVideoFilename = (filePath) => {
        if (!filePath) return '';
        const parts = filePath.split(/[\\/]/);
        return parts[parts.length - 1];
    }

    const appendAuthToken = (url) => {
        if (!authToken) return url
        const tokenParam = `authToken=${encodeURIComponent(authToken)}`
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

    const previewImageSrc = appendAuthToken(`${backend_url}/${data.path}`)
    const previewVideoSrc = getVideoStreamUrl(data.path)
    const mediaId = data?._id
    const isOwner = Boolean(currentUsername && data?.username && currentUsername === data.username)

    const handleDelete = useCallback(async () => {
        if (!isOwner) {
            setMsg('You can only delete media you uploaded.')
            return
        }

        if (!authToken) {
            setMsg('Sign in to delete media')
            return
        }

        if (!mediaId) {
            setMsg('Unable to delete this media')
            return
        }

        try {
            setIsDeleting(true)
            const response = await fetch(`${backend_url}/api/images/${mediaId}`, {
                method: 'DELETE',
                headers: {
                    'authToken': authToken
                }
            })

            let payload = {}
            try {
                payload = await response.json()
            } catch (error) {
                payload = {}
            }

            if (!response.ok || payload.msg !== 'Media deleted') {
                throw new Error(payload.msg || 'Failed to delete media')
            }

            setMsg('Media deleted')
            if (typeof onDelete === 'function') {
                onDelete(mediaId)
            }
            setIsModalOpen(false)
        } catch (error) {
            console.error('Failed to delete media:', error)
            setMsg(error.message || 'Failed to delete media')
        } finally {
            setIsDeleting(false)
        }
    }, [authToken, backend_url, isOwner, mediaId, onDelete, setMsg])

    return (
        <>
            <div className='cardBox' index={index}>
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
                            alt={data.title}
                            loading='lazy'
                        />
                    )}
                    <span className='cardPreviewHint'>Tap to open</span>
                </div>
                <span className='imgTitle'>{data.title}</span>
                <span className='imgUploadBy'>Uploaded By : {data.username}</span>

                <button class="button" onClick={()=>save_file(
                    isVideo 
                        ? getVideoStreamUrl(data.path)
                        : appendAuthToken(`${backend_url}/${data.path}`), 
                    data.title,
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
                                    alt={data.title}
                                />
                            )}
                        </div>
                        <div className='mediaModalMeta'>
                            <div className='mediaModalHeader'>
                                <div className='mediaModalTitle'>{data.title}</div>
                                {isOwner && (
                                    <button
                                        type='button'
                                        className='mediaModalDelete'
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                )}
                            </div>
                            <div className='mediaModalUploader'>Uploaded by {data.username}</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Card