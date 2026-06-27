import imageCompression from 'browser-image-compression'

/** Compress in-browser before storing to save space & speed up loading. */
export async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxSizeMB: 1.2,
      maxWidthOrHeight: 1800,
      useWebWorker: true,
      fileType: 'image/jpeg',
    })
  } catch (e) {
    console.warn('compress failed, using original', e)
    return file
  }
}
