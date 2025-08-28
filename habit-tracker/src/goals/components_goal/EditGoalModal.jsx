// EditGoalModal.jsx - Component cho modal chỉnh sửa goal
import React from 'react';
import { Modal, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { Edit3, Calendar, Flag, Type, Hash, Link } from "lucide-react";

export const EditGoalModal = ({
  show,
  onClose,
  editGoal,
  setEditGoal,
  error,
  setError,
  habits,
  onUpdate,
  handleCheckLinkedHabitUpdate
}) => {
  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      size="lg"
      className="edit-goal-modal"
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2 text-warning">
          <Edit3 size={24} />
          Edit Goal
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        {editGoal && (
          <form>
            {/* Goal Title */}
            <div className="mb-4">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Type size={16} />
                Goal Title
              </label>
              <input
                type="text"
                className="form-control form-control-lg"
                value={editGoal.name}
                onChange={(e) =>
                  setEditGoal({ ...editGoal, name: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={editGoal.description}
                onChange={(e) =>
                  setEditGoal({ ...editGoal, description: e.target.value })
                }
              />
            </div>

            {/* Dates Row */}
            <Row className="mb-4">
              <Col md={6}>
                <div className="mb-3">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2">
                    <Calendar size={16} />
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-lg"
                    value={editGoal.startDate?.split("T")[0]}
                    onChange={(e) =>
                      setEditGoal({ ...editGoal, startDate: e.target.value })
                    }
                  />
                </div>
              </Col>

              <Col md={6}>
                <div className="mb-3">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2">
                    <Calendar size={16} />
                    Deadline
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-lg"
                    value={editGoal.deadline?.split("T")[0]}
                    onChange={(e) =>
                      setEditGoal({ ...editGoal, deadline: e.target.value })
                    }
                  />
                </div>
              </Col>
            </Row>

            {/* Priority */}
            <div className="mb-4">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Flag size={16} />
                Priority
              </label>
              <Form.Select
                size="lg"
                value={editGoal.priority}
                onChange={(e) =>
                  setEditGoal({ ...editGoal, priority: e.target.value })
                }
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
              </Form.Select>
            </div>

            {/* Unit & Target Value */}
            <div className="border rounded-3 p-4 bg-light mb-4">
              <h6 className="text-primary mb-3">Goal Configuration</h6>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Type size={16} />
                      Unit
                    </label>
                    <input
                      type="text"
                      className={`form-control ${error.unit ? "is-invalid" : ""}`}
                      placeholder="e.g., km, books, days"
                      onChange={(e) => {
                        setEditGoal({ ...editGoal, unit: e.target.value });
                        if (e.target.value && e.target.value.trim() !== "") {
                          setError((prev) => ({ ...prev, unit: "" }));
                        }
                      }}
                      value={editGoal.unit}
                    />
                    {error.unit && (
                      <div className="invalid-feedback">{error.unit}</div>
                    )}
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Hash size={16} />
                      Target Value
                    </label>
                    <input
                      type="number"
                      className={`form-control ${error.targetValue ? "is-invalid" : ""}`}
                      min={1}
                      onChange={(e) =>
                        setEditGoal({ ...editGoal, targetValue: e.target.value })
                      }
                      value={editGoal.targetValue}
                    />
                    {error.targetValue && (
                      <div className="invalid-feedback">{error.targetValue}</div>
                    )}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Linked Habits */}
            <div className="border rounded-3 p-4 bg-light">
              <h6 className="text-success mb-3 d-flex align-items-center gap-2">
                <Link size={16} />
                Linked Habits
              </h6>

              {habits?.length > 0 ? (
                <div className="mb-3">
                  {habits.map((habit) => (
                    <div className="form-check mb-3 p-3 border rounded-2 bg-white" key={habit.id}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={habit.id}
                        id={`edit-habit-${habit.id}`}
                        checked={editGoal.linkedHabits?.includes(habit.id)}
                        onChange={handleCheckLinkedHabitUpdate}
                      />
                      <label
                        className="form-check-label fw-semibold"
                        htmlFor={`edit-habit-${habit.id}`}
                      >
                        {habit.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No habits available</p>
                </div>
              )}
            </div>
          </form>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button variant="outline-secondary" size="lg" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="warning" size="lg" onClick={onUpdate} className="px-4">
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};