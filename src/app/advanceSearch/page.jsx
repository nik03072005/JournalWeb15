'use client'
import AdvanceSearch from '@/components/AdvanceSearch'
import React from 'react'

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic'

function page() {
  return (
    <div>
      <AdvanceSearch />
    </div>
  )
}

export default page
