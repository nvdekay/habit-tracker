import { Calendar } from 'lucide-react'
import React from 'react'
import CalendarView from './components_checkin/CalendarView'

export default function CheckIn() {
    return (
        <div className="container py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold">Daily Check-in</h2>
                    <p className="fs-6">Mark your habits as complete and track your progress</p>
                    <CalendarView />
                </div>
            </div>
        </div>
    )
}
