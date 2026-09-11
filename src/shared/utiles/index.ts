/*
|--------------------------------------------------------------------------
| Decode Base64
|--------------------------------------------------------------------------
|
| Decodes the base64 string into binary bytes.
|
*/
function decodeBase64(encoded: string): Uint8Array {
    // Decode the base64 string.
    const binary = atob(encoded);

    // Convert the binary data into bytes.
    return Uint8Array.from(
        binary,
        (char) => char.charCodeAt(0),
    );
}

/*
|--------------------------------------------------------------------------
| Decompress Gzip
|--------------------------------------------------------------------------
|
| Decompresses gzip data and returns the original SVG.
|
*/
async function decompressGzip(
    bytes: Uint8Array,
): Promise<string> {
    // Create the gzip decompression stream.
    const ds = new DecompressionStream('gzip');

    // Create a real ArrayBuffer for the Blob.
    const buffer = new ArrayBuffer(bytes.byteLength);

    // Copy the bytes into the ArrayBuffer.
    new Uint8Array(buffer).set(bytes);

    // Decompress the gzip data.
    const stream = new Blob([buffer])
        .stream()
        .pipeThrough(ds);

    // Return the decompressed SVG.
    return await new Response(stream).text();
}

/*
|--------------------------------------------------------------------------
| Fallback Signature
|--------------------------------------------------------------------------
|
| Returns a fallback SVG when decompression fails.
|
*/
function fallbackSignature(): string {
    // Return a simple fallback signature.
    return `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 80"
        >
            <text
                x="100"
                y="45"
                text-anchor="middle"
                fill="white"
                font-size="16"
            >
                Signature
            </text>
        </svg>
    `;
}

/*
|--------------------------------------------------------------------------
| Decompress Signature
|--------------------------------------------------------------------------
|
| Decodes and decompresses the gzip + base64 SVG signature.
|
*/
export async function decompressSignature(encoded: string): Promise<string> {
    try {
        // Decode the base64 signature.
        const bytes = decodeBase64(encoded);

        // Decompress and return the SVG.
        return await decompressGzip(bytes);
    } catch (error) {
        // Log the decompression error.
        console.error(
            'Failed to decompress signature:',
            error,
        );

        // Return a fallback signature.
        return fallbackSignature();
    }
}