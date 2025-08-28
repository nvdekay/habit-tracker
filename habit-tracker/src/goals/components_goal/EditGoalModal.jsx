// 4. EditGoalModal.jsx - Component cho modal chỉnh sửa goal
import React from 'react';
import { Modal, Button } from "react-bootstrap";
import Form from "react-bootstrap/Form";

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
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Edit Goal</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {editGoal && (
          <form>
            <div className="mb-3">
              <label className="form-label">Goal Title</label>
              <input
                type="text"
                className="form-control"
                value={editGoal.name}
                onChange={(e) =>
                  setEditGoal({ ...editGoal, name: e.target.value })
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={editGoal.description}
                onChange={(e) =>
                  setEditGoal({ ...editGoal, description: e.target.value })
                }
              ></textarea>
            </div>

            <div className="d-flex gap-2">
              <div className="flex-fill">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editGoal.startDate?.split("T")[0]}
                  onChange={(e) =>
                    setEditGoal({ ...editGoal, startDate: e.target.value })
                  }
                />
              </div>
              <div className="flex-fill">
                <label className="form-label">Deadline</label>
                <input
                  type="date"
                  className="form-control"
                  value={editGoal.deadline?.split("T")[0]}
                  onChange={(e) =>
                    setEditGoal({ ...editGoal, deadline: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mb-3 mt-3">
              <label className="form-label">Priority</label>
              <Form.Select
                value={editGoal.priority}
                onChange={(e) =>
                  setEditGoal({ ...editGoal, priority: e.target.value })
                }
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </Form.Select>
            </div>

            <div className="d-flex gap-2">
              <div className="flex-fill">
                <label className="d-block mb-2 mt-3">Unit</label>
                <input
                  type="text"
                  className={`form-control mb-3 ${error.unit ? "is-invalid" : ""}`}
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
                  <p className="text-red-500 text-sm mb-2">{error.unit}</p>
                )}
              </div>
              <div className="flex-fill">
                <label className="d-block mb-2 mt-3">Target Value</label>
                <input
                  type="number"
                  className="form-control mb-3"
                  min={1}
                  onChange={(e) =>
                    setEditGoal({ ...editGoal, targetValue: e.target.value })
                  }
                  value={editGoal.targetValue}
                />
                {error.targetValue && (
                  <p className="text-red-500 text-sm mb-2">{error.targetValue}</p>
                )}
              </div>
            </div>

            <label className="d-block mb-2">Link Habit</label>
            {habits?.map((habit) => (
              <div className="form-check" key={habit.id}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={habit.id}
                  id={`edit-habit-${habit.id}`}
                  checked={editGoal.linkedHabits?.includes(habit.id)}
                  onChange={handleCheckLinkedHabitUpdate}
                />
                <label className="form-check-label" htmlFor={`edit-habit-${habit.id}`}>
                  {habit.name}
                </label>
              </div>
            ))}
          </form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Hủy
        </Button>
        <Button variant="primary" onClick={onUpdate}>
          Lưu thay đổi
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

