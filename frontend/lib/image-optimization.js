const CLOUDINARY_UPLOAD_SEGMENT = "/upload/"

function hasCloudinaryTransform(segment) {
  // Matches transformation lists like: f_auto,q_auto,w_96,h_96,c_fill
  return /^(?:[a-z]+_[^/]+)(?:,[a-z]+_[^/]+)*$/i.test(segment)
}

function buildTransformString(options = {}) {
  const transforms = []

  if (options.format) {
    transforms.push(`f_${options.format}`)
  } else {
    transforms.push("f_auto")
  }

  if (options.quality) {
    transforms.push(`q_${options.quality}`)
  } else {
    transforms.push("q_auto")
  }

  if (options.width) {
    transforms.push(`w_${Math.round(options.width)}`)
  }

  if (options.height) {
    transforms.push(`h_${Math.round(options.height)}`)
  }

  if (options.crop) {
    transforms.push(`c_${options.crop}`)
  }

  return transforms.join(",")
}

export function optimizeImageUrl(src, options = {}) {
  if (!src || typeof src !== "string") {
    return src
  }

  const trimmedSrc = src.trim()
  if (!trimmedSrc || trimmedSrc.startsWith("data:") || trimmedSrc.startsWith("blob:")) {
    return trimmedSrc
  }

  // pravatar supports size in the path, e.g. https://i.pravatar.cc/150?u=abc
  // Rewriting this helps avoid downloading oversized avatars for small UI slots.
  if (trimmedSrc.includes("i.pravatar.cc")) {
    try {
      const parsed = new URL(trimmedSrc)
      const requestedSize = Math.max(Number(options.width) || 0, Number(options.height) || 0)

      if (requestedSize > 0) {
        const normalizedSize = Math.max(32, Math.min(256, Math.round(requestedSize)))
        parsed.pathname = `/${normalizedSize}`
        return parsed.toString()
      }
    } catch {
      return trimmedSrc
    }
  }

  const cloudinaryIndex = trimmedSrc.indexOf(CLOUDINARY_UPLOAD_SEGMENT)
  if (cloudinaryIndex === -1 || !trimmedSrc.includes("res.cloudinary.com")) {
    return trimmedSrc
  }

  const prefix = trimmedSrc.slice(0, cloudinaryIndex + CLOUDINARY_UPLOAD_SEGMENT.length)
  const suffix = trimmedSrc.slice(cloudinaryIndex + CLOUDINARY_UPLOAD_SEGMENT.length)

  const suffixParts = suffix.split("/")
  const firstPart = suffixParts[0] || ""
  const remainingParts = hasCloudinaryTransform(firstPart) ? suffixParts.slice(1) : suffixParts
  const transformString = buildTransformString(options)

  if (!remainingParts.length) {
    return `${prefix}${transformString}`
  }

  return `${prefix}${transformString}/${remainingParts.join("/")}`
}