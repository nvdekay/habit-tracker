import React, { useState, useCallback, useEffect } from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import CalendarView from "./components_checkin/CalendarView";
import DailySummary from "./components_checkin/DailySummary";
import HabitsForDate from "./components_checkin/HabitsForDate";
import TimeConflictModal from "./components_checkin/TimeConflictModal";
import { useAuth } from "../context/AuthContext";
import { checkTimeConflicts } from "../services/checkInService";
import { AlertTriangle } from "lucide-react";
import GoalsForDate from "./components_checkin/GoalsForDate";

export default function CheckIn() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [calendarData, setCalendarData] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingHabits, setConflictingHabits] = useState([]);
  const [conflictAlert, setConflictAlert] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Check for time conflicts when date changes
  useEffect(() => {
    if (selectedDate && isAuthenticated && user) {
      checkForTimeConflicts(selectedDate);
    }
  }, [selectedDate, user, isAuthenticated, refreshTrigger]);

  // Check for time conflicts on the selected date
  const checkForTimeConflicts = async (date) => {
    try {
      const conflicts = await checkTimeConflicts(date);

      if (conflicts.length > 0) {
        // Show alert for conflicts
        setConflictAlert({
          count: conflicts.length,
          times: conflicts.map((c) => c.time),
        });

        // If there are conflicts, prepare modal data
        const allConflictingHabits = conflicts.flatMap(
          (conflict) => conflict.habits
        );
        setConflictingHabits(allConflictingHabits);
      } else {
        setConflictAlert(null);
        setConflictingHabits([]);
      }
    } catch (error) {
      console.error("Failed to check time conflicts:", error);
    }
  };

  // Handle date selection
  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  // Update calendar data
  const handleCalendarDataUpdate = useCallback((data) => {
    setCalendarData(data);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback((date) => {
    setRefreshTrigger((prev) => prev + 1);

    // Reset data for that date to reload
    setCalendarData((prev) => ({
      ...prev,
      [date]: undefined,
    }));
  }, []);

  // Show conflict resolution modal
  const handleShowConflictModal = () => {
    setShowConflictModal(true);
  };

  // Hide conflict resolution modal
  const handleHideConflictModal = () => {
    setShowConflictModal(false);
  };

  // Handle conflict resolution
  const handleConflictResolve = () => {
    setShowConflictModal(false);
    setRefreshTrigger((prev) => prev + 1);
    // Re-check conflicts after resolution
    setTimeout(() => {
      checkForTimeConflicts(selectedDate);
    }, 1000);
  };

  if (!isAuthenticated || !user) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: "#f8f9fa" }}
      >
        <div className="text-center">
          <h3 className="mb-3">Please log in to access Daily Check-in</h3>
        </div>
      </div>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="mb-4">
        <h1
          className="fw-bold mb-1"
          style={{ fontSize: "32px", color: "#1a1a1a" }}
        >
          Daily Check-in
        </h1>
        <p className="text-muted mb-0" style={{ fontSize: "16px" }}>
          Mark your habits as complete and track your progress
        </p>
      </div>

      {/* Time Conflict Alert */}
      {conflictAlert && (
        <Alert
          variant="warning"
          className="mb-4 d-flex align-items-center justify-content-between"
        >
          <div className="d-flex align-items-center">
            <AlertTriangle size={20} className="me-2" />
            <div>
              <strong>Time Conflict Detected!</strong>
              <br />
              <span className="small">
                {conflictAlert.count} conflict
                {conflictAlert.count > 1 ? "s" : ""} found at:{" "}
                {conflictAlert.times.map((time, index) => (
                  <span key={time} className="fw-medium">
                    {time.substring(0, 5)}
                    {index < conflictAlert.times.length - 1 ? ", " : ""}
                  </span>
                ))}
              </span>
            </div>
          </div>
          <button
            className="btn btn-warning btn-sm"
            onClick={handleShowConflictModal}
          >
            Resolve Conflicts
          </button>
        </Alert>
      )}

      {/* Main Layout */}
      <Row className="g-4">
        {/* Left Column - Calendar */}
        <Col lg={5} xl={4}>
          <CalendarView
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            calendarData={calendarData}
            onCalendarDataUpdate={handleCalendarDataUpdate}
          />
        </Col>

        {/* Right Column - Habits and Summary */}
        <Col lg={7} xl={8}>
          <Row className="g-4">
            {/* Goal Habits for Selected Date */}
            <Col xs={12}>
              <GoalsForDate
                selectedDate={selectedDate}
                onStatusChange={handleStatusChange}
                refreshTrigger={refreshTrigger}
              />
            </Col>
            {/* Habits for Selected Date */}
            <Col xs={12}>
              <HabitsForDate
                selectedDate={selectedDate}
                onStatusChange={handleStatusChange}
                refreshTrigger={refreshTrigger}
              />
            </Col>

            {/* Daily Summary */}
            <Col xs={12}>
              <DailySummary
                selectedDate={selectedDate}
                refreshTrigger={refreshTrigger}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Time Conflict Resolution Modal */}
      <TimeConflictModal
        show={showConflictModal}
        onHide={handleHideConflictModal}
        conflictingHabits={conflictingHabits}
        selectedDate={selectedDate}
        onResolve={handleConflictResolve}
      />
    </Container>
  );
}