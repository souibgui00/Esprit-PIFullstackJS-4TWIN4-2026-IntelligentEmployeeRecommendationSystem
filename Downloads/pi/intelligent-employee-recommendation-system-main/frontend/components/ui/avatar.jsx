'use client'

import React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'
import { optimizeImageUrl } from '@/lib/image-optimization'

function Avatar({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  alt,
  loading,
  decoding = 'async',
  fetchPriority,
  requestedSize = 128,
  src,
  decorative = false,
  ...props
}) {
  const srcValue = typeof src === 'string' ? src : ''
  const isPlaceholderImage = srcValue.includes('/placeholder.svg')
  const computedAlt = decorative || isPlaceholderImage ? '' : (alt ?? 'User profile photo')

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      alt={computedAlt}
      loading={loading ?? undefined}
      decoding={decoding}
      fetchpriority={fetchPriority ?? undefined}
      src={optimizeImageUrl(src, { width: requestedSize, height: requestedSize })}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
