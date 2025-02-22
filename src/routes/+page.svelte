<script>
    import 'cropperjs/dist/cropper.css';
    import { tick } from 'svelte';
    import Cropper from 'cropperjs';
    import axios from 'axios';

    let image = null;
    let croppedImage = '';
    let rows = 20;
    let cols = 20;
    let colorNumber = '2'; // Default as string for binding
    let asciiArt = '';
    let rleOutput = '';
    let cropperInstance;

    // Handle File Upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async () => {
            image = reader.result;
            await tick(); // Wait for DOM update
            initializeCropper();
        };
        reader.readAsDataURL(file);
    };

    // Initialize Cropper.js without a fixed aspect ratio and with autoCropArea set to 0.7
    const initializeCropper = () => {
        const imageElement = document.getElementById('image-to-crop');
        if (cropperInstance) {
            cropperInstance.destroy();
        }
        cropperInstance = new Cropper(imageElement, {
            viewMode: 1,
            autoCropArea: 0.7,
            responsive: true
        });
    };

    // Get the cropped image, scale it up 2x without antialiasing, and update the preview.
    const getCroppedImage = () => {
        if (cropperInstance) {
            // Get the cropped canvas from Cropper.js
            const originalCanvas = cropperInstance.getCroppedCanvas();
            // Create a new canvas to scale the image up 2x.
            const scaledCanvas = document.createElement('canvas');
            scaledCanvas.width = originalCanvas.width * 2;
            scaledCanvas.height = originalCanvas.height * 2;
            const ctx = scaledCanvas.getContext('2d');
            // Disable image smoothing to avoid antialiasing.
            ctx.imageSmoothingEnabled = false;
            // Draw the original canvas scaled up.
            ctx.drawImage(originalCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            // Get the data URL of the scaled canvas.
            croppedImage = scaledCanvas.toDataURL();
        }
    };

    // Upload the (upscaled) cropped image to the backend for ASCII conversion.
    const uploadImage = async () => {
        getCroppedImage();
        try {
            const response = await axios.post('/api/test', {
                image: croppedImage,
                rows,
                cols,
                colorNumber: parseInt(colorNumber)
            });
            asciiArt = response.data.ascii;
            rleOutput = response.data.rle;
        } catch (error) {
            console.error('Error:', error);
        }
    };
</script>

<style>
    .uploader-container {
        text-align: center;
        margin-top: 20px;
    }
    .crop-container {
        max-width: 100%;
        overflow: hidden;
    }
    .preview-container {
        margin-top: 10px;
    }
    .output-container {
        display: flex;
        justify-content: space-around;
        margin-top: 20px;
    }
    pre {
        background: #000;
        color: #0f0;
        padding: 10px;
        white-space: pre-wrap;
        word-break: break-word;
        flex: 1;
        margin: 0 10px;
    }
</style>

<div class="uploader-container">
    <input type="file" on:change="{handleFileChange}" accept="image/png" />
    {#if image}
        <div class="crop-container">
            <!-- Show the original image for cropping -->
            <img id="image-to-crop" src="{image}" alt="To Crop" />
        </div>
    {/if}

    <button on:click="{getCroppedImage}">Preview Cropped Image</button>

    {#if croppedImage}
        <div class="preview-container">
            <h3>Cropped Image Preview (Scaled Up):</h3>
            <img src="{croppedImage}" alt="Cropped Preview" style="max-width: 100%;" />
        </div>
    {/if}

    <div>
        <label>Rows:</label>
        <input type="number" bind:value="{rows}" />
        <label>Columns:</label>
        <input type="number" bind:value="{cols}" />
    </div>

    <div>
        <label>Colors:</label>
        <select bind:value="{colorNumber}">
            <option value="2">2 Colors</option>
            <option value="3">3 Colors</option>
            <option value="4">4 Colors</option>
        </select>
    </div>

    <button on:click="{uploadImage}">Convert to ASCII</button>

    {#if asciiArt && rleOutput}
        <div class="output-container">
            <pre>{asciiArt}</pre>
            <pre>{rleOutput}</pre>
        </div>
    {/if}
</div>
