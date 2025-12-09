"use client"

import * as React from "react"
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileUploadProps {
    onChange?: (file: File | null) => void
    onFilesChange?: (files: File[]) => void
    value?: File | null
    accept?: string
    className?: string
    multiple?: boolean
    maxFiles?: number
}

export function FileUpload({ onChange, onFilesChange, value, accept, className, multiple, maxFiles }: FileUploadProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [preview, setPreview] = React.useState<string | null>(null)
    const [files, setFiles] = React.useState<File[]>([])

    React.useEffect(() => {
        if (value) {
            if (value.type.startsWith("image/")) {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setPreview(reader.result as string)
                }
                reader.readAsDataURL(value)
            } else {
                setPreview(null)
            }
        } else {
            setPreview(null)
        }
    }, [value])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (multiple && onFilesChange) {
            const selectedFiles = Array.from(e.target.files || [])
            const limitedFiles = maxFiles ? selectedFiles.slice(0, maxFiles) : selectedFiles
            setFiles(limitedFiles)
            onFilesChange(limitedFiles)
        } else if (onChange) {
            const file = e.target.files?.[0] || null
            onChange(file)
        }
    }

    const handleRemove = () => {
        if (multiple && onFilesChange) {
            setFiles([])
            onFilesChange([])
        } else if (onChange) {
            onChange(null)
        }
        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }

    const handleRemoveFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index)
        setFiles(newFiles)
        onFilesChange?.(newFiles)
    }

    return (
        <div className={cn("space-y-4", className)}>
            <div
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors",
                    value ? "border-primary/50 bg-muted/20" : "border-muted-foreground/25"
                )}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                />

                {multiple && files.length > 0 ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                            {files.map((file, index) => (
                                <div key={index} className="relative border rounded-lg p-2">
                                    {file.type.startsWith("image/") ? (
                                        <div className="relative w-full h-20 rounded overflow-hidden">
                                            <img 
                                                src={URL.createObjectURL(file)} 
                                                alt={file.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-primary" />
                                        </div>
                                    )}
                                    <p className="text-xs font-medium text-center truncate mt-1">
                                        {file.name}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-1 right-1 h-6 w-6 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveFile(index)
                                        }}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {maxFiles && files.length >= maxFiles && (
                            <p className="text-xs text-muted-foreground">
                                Maximum {maxFiles} files reached
                            </p>
                        )}
                    </div>
                ) : value ? (
                    <div className="flex flex-col items-center gap-2">
                        {preview ? (
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-8 h-8 text-primary" />
                            </div>
                        )}
                        <p className="text-sm font-medium text-center break-all max-w-[200px]">
                            {value.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {(value.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium">Click to upload</p>
                            <p className="text-xs text-muted-foreground">
                                SVG, PNG, JPG or PDF (max. 10MB)
                                {maxFiles && ` - Max ${maxFiles} files`}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {!multiple && value && (
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleRemove()
                    }}
                >
                    <X className="w-4 h-4 mr-2" />
                    Remove File
                </Button>
            )}
        </div>
    )
}
