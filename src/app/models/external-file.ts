export interface ExternalFile {
    path: string;
    data: Uint8Array;
    blob: Blob;
    url: string;
    mimeType: string;
}
