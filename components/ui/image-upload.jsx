"use client"

import React, { useState, useRef } from "react"
import { Camera, X, UploadCloud, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function ImageUpload({ value, onChange, className }) {
    const [dragActive, setDragActive] = useState(false)
    const [preview, setPreview] = useState(value)
    const inputRef = useRef(null)

    const handleFileChange = (file) => {
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result
                setPreview(base64)
                onChange(base64)
            }
            reader.readAsDataURL(file)
        }
    }

    const onDragOver = (e) => {
        e.preventDefault()
        setDragActive(true)
    }

    const onDragLeave = () => {
        setDragActive(false)
    }

    const onDrop = (e) => {
        e.preventDefault()
        setDragActive(false)
        const file = e.dataTransfer.files[0]
        handleFileChange(file)
    }

    const removeImage = () => {
        setPreview(null)
        onChange(null)
        if (inputRef.current) inputRef.current.value = ""
    }

    return (
        <div className={cn("space-y-4", className)}>
            <div
                className={cn(
                    "relative group cursor-pointer border-2 border-dashed rounded-xl overflow-hidden transition-all duration-300 min-h-45 flex items-center justify-center",
                    dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-slate-200 hover:border-primary/40 hover:bg-slate-50",
                    preview ? "border-solid" : ""
                )}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                />

                {preview ? (
                    <div className="relative w-full h-full flex items-center justify-center p-2">
                        <img src={preview} alt="Profile Preview" className="w-40 h-40 rounded-full object-cover shadow-2xl ring-4 ring-white" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                removeImage()
                            }}
                            className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 p-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                            <Camera className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-800 tracking-tight">Operator Identity Capture</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest leading-loose mt-1">Drag and drop or click to upload biometric data</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
