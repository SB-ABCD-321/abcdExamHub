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
                    folder: folder,
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
