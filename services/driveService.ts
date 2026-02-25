
export const driveService = {
  uploadFile: async (file: File): Promise<{ url: string; id: string } | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('User not authenticated with Google Drive');
          return null;
        }
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return { url: data.url, id: data.id };
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
