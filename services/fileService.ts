
export const uploadFile = async (file: File): Promise<{ url: string; fileName: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Content = (reader.result as string).split(',')[1];
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            content: base64Content,
            mimeType: file.type
          })
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        resolve({ url: data.url, fileName: data.fileName });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = error => reject(error);
  });
};
