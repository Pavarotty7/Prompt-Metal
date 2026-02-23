const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.82;

const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Falha ao converter arquivo para data URL'));
        reader.readAsDataURL(file);
    });
};

const compressImageDataUrl = (dataUrl: string, mimeType: string): Promise<string> => {
    return new Promise((resolve) => {
        const image = new Image();

        image.onload = () => {
            const ratio = Math.min(
                1,
                MAX_IMAGE_DIMENSION / image.width,
                MAX_IMAGE_DIMENSION / image.height
            );

            const targetWidth = Math.max(1, Math.round(image.width * ratio));
            const targetHeight = Math.max(1, Math.round(image.height * ratio));

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(dataUrl);
                return;
            }

            ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

            const outputMime = mimeType === 'image/webp' || mimeType === 'image/jpeg'
                ? mimeType
                : 'image/jpeg';

            const compressed = canvas.toDataURL(outputMime, IMAGE_QUALITY);
            resolve(compressed || dataUrl);
        };

        image.onerror = () => resolve(dataUrl);
        image.src = dataUrl;
    });
};

export const fileEncodingService = {
    async fileToDataUrl(file: File): Promise<string> {
        const dataUrl = await readFileAsDataUrl(file);

        if (!file.type.startsWith('image/')) {
            return dataUrl;
        }

        if (file.type === 'image/svg+xml') {
            return dataUrl;
        }

        return compressImageDataUrl(dataUrl, file.type);
    }
};
