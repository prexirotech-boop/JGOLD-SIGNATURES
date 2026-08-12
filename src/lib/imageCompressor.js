/**
 * JGOLD SIGNATURES - CLIENT SIDE IMAGE COMPRESSOR
 * Compresses images in the browser before uploading to Supabase Storage.
 * Saves bandwidth, reduces storage size, and improves page loading speeds.
 */

export function compressImage(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.7,
    mimeType = 'image/jpeg'
  } = options

  // If the file is not an image, return it unchanged
  if (!file || !file.type.startsWith('image/')) {
    return Promise.resolve(file)
  }

  // GIF animations shouldn't be compressed via canvas or they will become static images
  if (file.type === 'image/gif') {
    return Promise.resolve(file)
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        // Calculate new dimensions keeping aspect ratio
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        // Draw image onto canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Convert canvas back to Blob/File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file) // Fallback to original if blob creation fails
              return
            }

            // Construct new File from Blob
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now()
            })

            console.log(
              `[ImageCompressor] Compressed ${file.name} from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024).toFixed(1)}KB`
            )
            resolve(compressedFile)
          },
          mimeType,
          quality
        )
      }
      img.onerror = () => {
        resolve(file) // Fallback to original on error
      }
    }
    reader.onerror = () => {
      resolve(file) // Fallback to original on error
    }
  })
}
