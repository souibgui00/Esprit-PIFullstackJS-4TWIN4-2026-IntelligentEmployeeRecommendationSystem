"use client"

import { useEffect, useRef, useState } from "react"
import * as faceapi from "face-api.js"

export function FaceIdScanner({
    onMatchSuccess,
    targetImage,
    targetLabel = "User",
    mode = "verify"
}) {
    const [localUserStream, setLocalUserStream] = useState(null)
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [loginResult, setLoginResult] = useState("PENDING") // PENDING | SUCCESS | FAILED
    const [imageError, setImageError] = useState(false)
    const [statusText, setStatusText] = useState("Loading AI models...")

    const videoRef = useRef()
    const canvasRef = useRef()
    const faceApiIntervalRef = useRef()
    const hasMatchedRef = useRef(false) // Prevents duplicate onMatchSuccess calls
    const isDetectingRef = useRef(false) // Prevents overlapping inference stampedes

    // KEY FIX: store descriptors in a ref so scanFace() always reads the latest value
    const labeledDescriptorsRef = useRef(null)

    const videoWidth = 640
    const videoHeight = 360

    // ── 1. Load face-api models ──────────────────────────────────────────────
    const loadModels = async () => {
        const uri = "/models"
        await faceapi.nets.ssdMobilenetv1.loadFromUri(uri)
        await faceapi.nets.faceLandmark68Net.loadFromUri(uri)
        await faceapi.nets.faceRecognitionNet.loadFromUri(uri)
    }

    // ── 2. Load reference face from user's profile photo ────────────────────
    const loadLabeledImages = async () => {
        if (!targetImage) {
            console.error("No targetImage provided — face not enrolled yet")
            setImageError(true)
            return null
        }
        console.log("Loading reference image from:", targetImage)

        const descriptions = []

        // Use HTMLImageElement with crossOrigin to bypass CORS on Cloudinary URLs
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = targetImage

        await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = (e) => {
                console.error("Failed to load reference image:", e)
                reject(new Error("Image load failed"))
            }
        })

        console.log("Reference image loaded, detecting face...")
        const detection = await faceapi
            .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }))
            .withFaceLandmarks()
            .withFaceDescriptor()

        if (detection) {
            console.log("Face detected in reference photo")
            descriptions.push(detection.descriptor)
        } else {
            console.error("No face found in the reference photo. Photo URL:", targetImage)
            setImageError(true)
            return null
        }
        return new faceapi.LabeledFaceDescriptors(targetLabel, descriptions)
    }

    // ── 3. Boot: load models then descriptors ────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                setStatusText("Loading AI models...")
                await loadModels()

                if (mode === "verify") {
                    setStatusText("Loading your face profile...")
                    const labeled = await loadLabeledImages()
                    if (labeled) {
                        labeledDescriptorsRef.current = labeled  // store in ref!
                        setModelsLoaded(true)
                        setStatusText("Show your face to the camera")
                    }
                } else {
                    setModelsLoaded(true)
                    setStatusText("Position your face then click Capture")
                }
            } catch (err) {
                console.error("Init error:", err)
                setImageError(true)
            }
        }
        init()

        return () => {
            if (faceApiIntervalRef.current) clearInterval(faceApiIntervalRef.current)
        }
    }, [targetImage, mode])

    // ── 4. Open webcam ───────────────────────────────────────────────────────
    const getLocalUserVideo = () => {
        navigator.mediaDevices
            .getUserMedia({ audio: false, video: true })
            .then((stream) => {
                videoRef.current.srcObject = stream
                setLocalUserStream(stream)
                setStatusText("Scanning Face...")
            })
            .catch((err) => {
                console.error("Camera error:", err)
                setStatusText("Camera access denied")
            })
    }

    // ── 5. scanFace — reads from ref (no stale closure) ─────────────────────
    const scanFace = () => {
        faceapi.matchDimensions(canvasRef.current, videoRef.current)
        hasMatchedRef.current = false // reset on each new scan session

        const interval = setInterval(async () => {
            // Guard: already matched, stop firing
            if (hasMatchedRef.current) return

            // Prevent overlapping detections (this was causing the duplicate 500 errors)
            if (isDetectingRef.current) return
            isDetectingRef.current = true

            // Guard: descriptors must be ready
            const labeled = labeledDescriptorsRef.current
            if (!labeled) {
                isDetectingRef.current = false
                return
            }

            // Guard: video must be playing and ready
            const video = videoRef.current
            if (!video || video.readyState < 2 || video.paused || video.ended) {
                isDetectingRef.current = false
                return
            }

            try {
                const detections = await faceapi
                    .detectAllFaces(video)
                    .withFaceLandmarks()
                    .withFaceDescriptors()

                // Check again in case another execution matched while we were awaiting
                if (hasMatchedRef.current) return

                const resizedDetections = faceapi.resizeResults(detections, {
                    width: videoWidth,
                    height: videoHeight,
                })

                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext("2d")
                    ctx.clearRect(0, 0, videoWidth, videoHeight)
                    faceapi.draw.drawDetections(canvasRef.current, resizedDetections)
                    faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections)
                }

                const faceMatcher = new faceapi.FaceMatcher(labeled)
                const results = resizedDetections.map((d) => faceMatcher.findBestMatch(d.descriptor))

                if (results.length > 0 && results[0].label === targetLabel) {
                    // Lock immediately — prevents any further interval runs
                    hasMatchedRef.current = true
                    clearInterval(interval)

                    setLoginResult("SUCCESS")
                    setStatusText("Face Recognized! Logging in...")

                    // Stop camera tracks
                    if (video.srcObject) {
                        video.srcObject.getTracks().forEach(t => t.stop())
                        video.srcObject = null
                    }

                    if (onMatchSuccess) onMatchSuccess()
                } else if (results.length > 0) {
                    setStatusText("Face not recognized. Try again.")
                }
            } catch (e) {
                // Swallow transient errors (e.g. video not ready yet)
            } finally {
                isDetectingRef.current = false
            }
        }, 1000 / 15)

        faceApiIntervalRef.current = interval
    }

    // ── 6. Register: capture snapshot WITH face validation ───────────────────
    const captureImage = async () => {
        if (!videoRef.current) return
        setStatusText("Checking face in frame...")

        // First detect face in live video to confirm one is visible
        const check = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
            .withFaceLandmarks()

        if (!check) {
            setStatusText("No face detected. Look directly at the camera and try again.")
            return
        }

        setStatusText("Face confirmed. Saving...")
        const canvas = document.createElement("canvas")
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        canvas.getContext("2d").drawImage(videoRef.current, 0, 0)
        canvas.toBlob((blob) => {
            if (localUserStream) localUserStream.getTracks().forEach((t) => t.stop())
            if (onMatchSuccess) onMatchSuccess({ blob, dataUrl: canvas.toDataURL("image/jpeg") })
        }, "image/jpeg", 0.95)
    }

    // ── Error state ──────────────────────────────────────────────────────────
    if (imageError) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="text-rose-500 font-semibold text-sm">
                    Could not load your face profile. Please re-enroll your face from your profile page.
                </p>
            </div>
        )
    }

    // ── Main UI ──────────────────────────────────────────────────────────────
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <p className="text-sm font-semibold text-slate-300 tracking-wide min-h-5" aria-live="polite">
                {statusText}
            </p>

            <div
                className="relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10"
                style={{ width: "100%", maxWidth: videoWidth, aspectRatio: `${videoWidth}/${videoHeight}` }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    width={videoWidth}
                    height={videoHeight}
                    onPlay={mode === "verify" ? scanFace : undefined}
                    aria-hidden="true"
                    style={{
                        objectFit: "fill",
                        width: "100%",
                        height: "100%",
                        display: localUserStream ? "block" : "none",
                        transform: "scaleX(-1)",
                    }}
                />
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        display: localUserStream ? "block" : "none",
                    }}
                />

                {!localUserStream && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                            </svg>
                            <p className="text-xs">{modelsLoaded ? "Click Open Camera to start" : "Loading..."}</p>
                        </div>
                    </div>
                )}

                {loginResult === "SUCCESS" && (
                    <div className="absolute inset-0 bg-emerald-900/80 flex items-center justify-center">
                        <p className="text-emerald-300 font-bold text-lg">Identity Confirmed</p>
                    </div>
                )}
            </div>

            {!localUserStream && modelsLoaded && (
                <button
                    onClick={getLocalUserVideo}
                    className="w-full py-3 bg-primary hover:bg-primary/80 text-white rounded-2xl font-bold text-sm transition-all"
                    aria-label="Open camera for face verification"
                >
                    Open Camera
                </button>
            )}

            {localUserStream && mode === "register" && (
                <button
                    onClick={captureImage}
                    className="w-full py-3 bg-primary hover:bg-primary/80 text-white rounded-2xl font-bold text-sm transition-all"
                    aria-label="Capture and save face image"
                >
                    Capture and Save Face
                </button>
            )}
        </div>
    )
}
