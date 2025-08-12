import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  /**
   * Converts a Blob object to a JSON object using FileReader.
   * @param {Blob} blob - The Blob object to convert
   * @returns {Promise<Object>} Promise resolving to parsed JSON object
   */
  blobToJSON(blob: Blob): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result) {
          try {
            resolve(JSON.parse(reader.result as string));
          } catch (error) {
            reject('Failed to parse blob to JSON: ' + error);
          }
        } else {
          reject('Failed to read blob data');
        }
      };
      
      reader.onerror = () => reject('FileReader error');
      reader.readAsText(blob);
    });
  }

  /**
   * Converts a base64 encoded string to an ArrayBuffer.
   * @param {string} base64 - Base64 encoded string
   * @returns {ArrayBuffer} ArrayBuffer containing the decoded data
   */
  base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return bytes.buffer;
    } catch (error) {
      throw new Error('Failed to convert base64 to ArrayBuffer: ' + error);
    }
  }

  /**
   * Converts an ArrayBuffer to a base64 encoded string.
   * @param {ArrayBuffer} buffer - The ArrayBuffer to convert
   * @returns {string} Base64 encoded string representation of the buffer
   */
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    try {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (error) {
      throw new Error('Failed to convert ArrayBuffer to base64: ' + error);
    }
  }
}
