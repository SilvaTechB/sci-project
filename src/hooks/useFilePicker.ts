import { useState } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

interface UseFilePickerOptions {
  accept?: string;
  maxSizeMB?: number;
}

interface PickedFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

export const useFilePicker = (options: UseFilePickerOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const { accept = '*/*', maxSizeMB = 10 } = options;

  const isNative = Capacitor.isNativePlatform();

  /**
   * Pick file using native capabilities on mobile or standard input on web
   */
  const pickFile = async (): Promise<PickedFile | null> => {
    setLoading(true);
    try {
      if (isNative) {
        // On native platforms, we use the Filesystem plugin
        // Note: For full file picker, you'd typically use @capacitor-community/file-picker
        // But for now we'll use a workaround with the standard input
        return await pickFileWeb();
      } else {
        return await pickFileWeb();
      }
    } catch (error: any) {
      console.error('File pick error:', error);
      toast.error(error.message || 'Failed to pick file');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const pickFileWeb = (): Promise<PickedFile | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.style.display = 'none';
      
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) {
          resolve(null);
          return;
        }

        // Check file size
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
          toast.error(`File size exceeds ${maxSizeMB}MB limit`);
          resolve(null);
          return;
        }

        resolve({
          file,
          name: file.name,
          size: file.size,
          type: file.type,
        });

        document.body.removeChild(input);
      };

      input.oncancel = () => {
        resolve(null);
        document.body.removeChild(input);
      };

      document.body.appendChild(input);
      input.click();
    });
  };

  /**
   * Check if we have filesystem permissions (for native platforms)
   */
  const checkPermissions = async (): Promise<boolean> => {
    if (!isNative) return true;
    
    try {
      const result = await Filesystem.checkPermissions();
      return result.publicStorage === 'granted';
    } catch {
      return false;
    }
  };

  /**
   * Request filesystem permissions (for native platforms)
   */
  const requestPermissions = async (): Promise<boolean> => {
    if (!isNative) return true;
    
    try {
      const result = await Filesystem.requestPermissions();
      return result.publicStorage === 'granted';
    } catch {
      return false;
    }
  };

  /**
   * Read file from device storage (for native platforms)
   */
  const readFile = async (path: string): Promise<string | null> => {
    try {
      const result = await Filesystem.readFile({
        path,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return result.data as string;
    } catch (error) {
      console.error('Read file error:', error);
      return null;
    }
  };

  /**
   * Write file to device storage (for native platforms)
   */
  const writeFile = async (path: string, data: string): Promise<boolean> => {
    try {
      await Filesystem.writeFile({
        path,
        data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return true;
    } catch (error) {
      console.error('Write file error:', error);
      return false;
    }
  };

  return {
    pickFile,
    checkPermissions,
    requestPermissions,
    readFile,
    writeFile,
    loading,
    isNative,
  };
};
