import React, {useState} from "react";
import {Box, IconButton, Stack, Typography} from "@mui/material";
import {useSnackbar} from "@/contexts/SnackBarContext";
import {Upload} from "@mui/icons-material";
import {addBannerAction} from "@/actions/settingActions";
import {getBanners} from "@/lib/bannersSlice/bannersSlice";
import {useAppDispatch} from "@/lib/hooks";

const Form = () => {
    const {showNotification} = useSnackbar();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageResolution, setImageResolution] = useState("");
    const dispatch = useAppDispatch();

    const validateImage = (file) => {
        return new Promise((resolve, reject) => {
            if (file.size > 4 * 1024 * 1024) {
                return reject("File size must be 4MB or less.");
            }

            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                setImageResolution(`${img.width}x${img.height}`);
                if (img.width !== 1200 || img.height !== 628) {
                    return reject("Image resolution must be 1200x628 pixels.");
                }
                resolve();
            };
            img.onerror = () => reject("Invalid image file.");
        });
    };

    const handleFileChange = async (file) => {
        if (!file) return;
        try {
            setIsLoading(true);
            await validateImage(file);
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
        } catch (error) {
            showNotification(error, "error");
            setSelectedFile(null);
            setImagePreview(null);
            setImageResolution("");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleFileChange(file);
    };

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();
            setIsLoading(true);
            const formData = new FormData();
            formData.append("banner", selectedFile);
            formData.append("path", "sliders");

            await addBannerAction(formData);
            setSelectedFile(null);
            setImagePreview(null);
            dispatch(getBanners());
            e.target.reset();
            showNotification("Banner uploaded successfully", "success");
        } catch (e) {
            console.error(e);
            showNotification(e.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack sx={{
                display: "flex",
                flexDirection: "row",
                gap: 2,
                alignItems: "center",
                justifyContent: "center",
            }}>
                {/* Upload Area */}
                <Stack
                    sx={{
                        gap: 1,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Box
                        sx={{
                            width: 250,
                            height: 150,
                            border: "2px dashed gray",
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            position: "relative",
                            overflow: "hidden",
                            backgroundColor: "#f9f9f9",
                            "&:hover": {borderColor: "black"}
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            hidden
                            onChange={(e) => handleFileChange(e.target.files[0])}
                            id="upload-button"
                        />
                        <label htmlFor="upload-button" style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer"
                        }}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview"
                                     style={{maxWidth: "100%", maxHeight: "100%", borderRadius: "10px"}}/>
                            ) : (
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 1,
                                    }}
                                >
                                    <Typography variant="body2" color="gray">
                                        {isLoading ? "Uploading..." : "Drag & Drop or Click"}
                                    </Typography>
                                    <Typography variant="body2" color="gray">
                                        {!selectedFile && "1200 x 628px"}
                                    </Typography>
                                    <Typography variant="body2" color="gray">
                                        {!selectedFile && "*.png, *.jpg, *.jpeg"}
                                    </Typography>
                                </Box>
                            )}
                        </label>
                    </Box>

                    {/* Image Details */}
                    {selectedFile && (
                        <Box sx={{textAlign: "center"}}>
                            <Typography variant="body2" color="primary">{selectedFile.name}</Typography>
                            <Typography variant="body2" color="secondary">Resolution: {imageResolution}</Typography>
                        </Box>
                    )}
                </Stack>
                {/* Submit Button */}
                <IconButton color={"primary"} type="submit" disabled={isLoading || !selectedFile}
                            sx={{backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "50%"}}
                >
                    <Upload fontSize="medium"/>
                </IconButton>
            </Stack>
        </form>
    );
};

export default Form;
