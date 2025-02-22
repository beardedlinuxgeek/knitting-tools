import sharp from 'sharp';

const ASCII_MAP = {
    2: ['#', '.'] // For 2 colors: '#' for dark and '.' for light.
};

export async function POST({ request }) {
    try {
        // Parse the request body.
        const { image, rows, cols } = await request.json();
        const base64Data = image.split(',')[1];
        const imgBuffer = Buffer.from(base64Data, 'base64');

        const numCols = parseInt(cols);
        const numRows = parseInt(rows);

        // Resize the image to (numCols x numRows) using nearest-neighbor interpolation,
        // then convert to greyscale and get raw pixel data.
        const resizedBuffer = await sharp(imgBuffer)
            .resize(numCols, numRows, { kernel: sharp.kernel.nearest })
            .greyscale()
            .raw()
            .toBuffer();

        // Fixed threshold value for 2 colors.
        const threshold = 200;
        let asciiArt = '';

        // Loop through each pixel to build ASCII art.
        for (let i = 0; i < resizedBuffer.length; i++) {
            if (i % numCols === 0 && i !== 0) {
                asciiArt += '\n';
            }
            const pixelValue = resizedBuffer[i];
            // Use the fixed threshold to choose the symbol.
            asciiArt += pixelValue < threshold ? ASCII_MAP[2][0] : ASCII_MAP[2][1];
        }

        // Generate run-length encoding for each row.
        const asciiRows = asciiArt.split('\n').filter(row => row.length > 0);
        const rleRows = asciiRows.map(row => {
            let rle = '';
            let prev = row[0];
            let count = 1;
            for (let i = 1; i < row.length; i++) {
                if (row[i] === prev) {
                    count++;
                } else {
                    rle += count + '-';
                    prev = row[i];
                    count = 1;
                }
            }
            rle += count;
            return rle;
        });
        const rleOutput = rleRows.join('\n');

        // Return the ASCII art and the run-length encoding.
        return new Response(
            JSON.stringify({ ascii: asciiArt, rle: rleOutput }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error processing image:', error);
        return new Response(
            JSON.stringify({ error: 'Image processing failed.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
