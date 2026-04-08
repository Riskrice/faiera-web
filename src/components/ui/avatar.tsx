"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ImageLoadingStatus = "idle" | "loading" | "loaded" | "error"

type AvatarContextValue = {
    imageLoadingStatus: ImageLoadingStatus
    setImageLoadingStatus: (status: ImageLoadingStatus) => void
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null)

const Avatar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const [imageLoadingStatus, setImageLoadingStatus] = React.useState<ImageLoadingStatus>("idle")

    return (
        <AvatarContext.Provider value={{ imageLoadingStatus, setImageLoadingStatus }}>
            <div
                ref={ref}
                className={cn(
                    "relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full",
                    className
                )}
                {...props}
            />
        </AvatarContext.Provider>
    )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
    HTMLImageElement,
    React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, onError, onLoad, src, ...props }, ref) => {
    const context = React.useContext(AvatarContext)
    const setImageLoadingStatus = context?.setImageLoadingStatus

    React.useEffect(() => {
        if (!setImageLoadingStatus) return
        setImageLoadingStatus(src ? "loading" : "error")
    }, [setImageLoadingStatus, src])

    const imageLoaded = context?.imageLoadingStatus === "loaded"

    return (
        <img
            ref={ref}
            src={src}
            className={cn(
                "col-start-1 row-start-1 aspect-square h-full w-full object-cover",
                !imageLoaded && "hidden",
                className
            )}
            onError={(event) => {
                context?.setImageLoadingStatus("error")
                onError?.(event)
            }}
            onLoad={(event) => {
                context?.setImageLoadingStatus("loaded")
                onLoad?.(event)
            }}
            {...props}
        />
    )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const context = React.useContext(AvatarContext)

    if (context?.imageLoadingStatus === "loaded") {
        return null
    }

    return (
        <div
            ref={ref}
            className={cn(
                "col-start-1 row-start-1 flex h-full w-full items-center justify-center rounded-full bg-muted",
                className
            )}
            {...props}
        />
    )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
