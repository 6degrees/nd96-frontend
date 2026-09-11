export async function decompressSignature(encoded: string): Promise<string> {
    const binary = atob(encoded);

    const bytes = Uint8Array.from(
        binary,
        (char) => char.charCodeAt(0),
    );

    const ds = new DecompressionStream('gzip');

    const stream = new Blob([bytes])
        .stream()
        .pipeThrough(ds);

    return await new Response(stream).text();
}