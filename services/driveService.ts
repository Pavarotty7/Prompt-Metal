
export const driveService = {
  uploadFile: async (file: File): Promise<{ url: string; id: string } | null> => {
    try {
      const content = await file.arrayBuffer();
      const bytes = new Uint8Array(content);
      let binary = '';
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      const base64 = btoa(binary);

      const response = await fetch('/api/drive/upload-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          content: base64,
          folderName: 'PromptMetal Documents',
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('User not authenticated with Google Drive');
          return null;
        }
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return { url: data.url, id: data.fileId };
    } catch (error) {
      console.error('Error uploading to Drive:', error);
      return null;
    }
  },

  checkAuth: async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/google/status');
      const data = await res.json();
      return data.isAuthenticated;
    } catch (e) {
      return false;
    }
  }
};
