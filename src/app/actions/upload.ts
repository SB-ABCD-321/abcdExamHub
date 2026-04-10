"use server";

import cloudinary from "@/lib/cloudinary";

export async function uploadToCloudinary(file: File, folder: string = "abcd-exam-hub") {
    // Server-side size validation
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB total limit for any single file
    if (file.size > MAX_SIZE) {
        throw new Error("File size exceeds 10MB limit");
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: `abcdExamHub/${folder}`,
                    resource_type: "auto",
                    quality: "auto",
                    fetch_format: "auto",
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        reject(error);
                    } else {
                        resolve(result?.secure_url);
                    }
                }
            ).end(buffer);
        });
    } catch (error) {
        console.error("Failed to upload to Cloudinary:", error);
        throw new Error("Failed to upload image");
    }
}

export async function deleteFromCloudinary(url: string) {
    if (!url || !url.includes("res.cloudinary.com")) return false;

    try {
        // Example URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/abcdExamHub/folder/filename.png
        // We need: abcdExamHub/folder/filename
        const urlParts = url.split("/");
        
        // Find the 'upload' part to skip the version number
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex === -1) return false;

        // Extract everything after the version number (v1234567...)
        const pathParts = urlParts.slice(uploadIndex + 2);
        const fullPath = pathParts.join("/");
        
        // Remove file extension
        const publicId = fullPath.substring(0, fullPath.lastIndexOf("."));
        
        if (!publicId) return false;

        return new Promise((resolve) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
                if (error) {
                    console.error("Cloudinary delete error:", error);
                    resolve(false);
                } else {
                    resolve(result?.result === 'ok');
                }
            });
        });
    } catch (e) {
        console.error("Error formatting URL for deletion:", e);
        return false;
    }
}
