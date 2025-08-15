import React from 'react'

export default function Loading() {
  return (
    <div>
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
  )
}
