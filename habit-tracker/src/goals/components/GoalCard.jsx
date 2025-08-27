// 2. GoalCard.jsx - Component cho từng goal card
import React from "react";
import { Settings, Check, Trash, Undo2, ListRestart } from "lucide-react";
import {
  Badge,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  ProgressBar,
} from "react-bootstrap";

export const GoalCard = ({
  goal,
  habits,
  onEdit,
  onDelete,
  onMark,
  onReverse,
  onReset,
}) => {
  const getProgressVariant = (progress) => {
    if (progress < 50) return "danger";
    if (progress < 80) return "warning";
    if (progress < 100) return "success";
    return "primary";
  };

  const progressPercent = (
    (goal.currentValue / goal.targetValue) *
    100
  ).toFixed(2);

  return (
    <Card className="shadow-sm h-100 my-4">
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle className="text-xl-start">{goal.name}</CardTitle>
        <div>
          <span
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Cannot edit a goal that is in progress or completed"
          >
            <button
              className="btn btn-warning mx-1"
              disabled={goal.currentValue !== 0}
              title={goal.currentValue == 0 ? "Edit GOAL" : "Cannot edit"}
              onClick={() => onEdit(goal)}
            >
              <Settings />
            </button>
          </span>
          <button
            className="btn btn-danger"
            title="Delete GOAL"
            onClick={() => onDelete(goal.id)}
          >
            <Trash />
          </button>
        </div>
      </CardHeader>

      <CardBody>
        <p>{goal.description}</p>
        <p className="mt-2">
          <strong>Deadline:</strong>{" "}
          {new Date(goal.deadline).toLocaleDateString()}
        </p>
        <p>
          {goal.priority == "high" ? (
            <Badge bg="danger mx-1">High</Badge>
          ) : (
            <Badge bg="secondary mx-1">Low</Badge>
          )}
          {goal.status == "completed" ? (
            <Badge bg="success mx-1">Completed</Badge>
          ) : (
            <Badge bg="warning mx-1">In progress</Badge>
          )}
          {goal.mode == "auto" ? (
            <Badge bg="success">Auto</Badge>
          ) : (
            <Badge bg="danger">Manual</Badge>
          )}
        </p>

        <p>
          <strong>Progress:</strong>
        </p>
        <div>
          <ProgressBar
            now={progressPercent}
            label={progressPercent == 100 ? "DONE" : `${progressPercent}%`}
            animated
            variant={getProgressVariant(parseFloat(progressPercent))}
          />
          <div>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </div>
        </div>
      </CardBody>

      <CardFooter>
        <CardTitle className="flex items-center text-lg">
          {goal.type == "auto" ? "Linked Habit" : "Action"}
        </CardTitle>
        <ul>
          {goal.linkedHabits?.map((habit, i) => (
            <li key={i}>{habits.find((h) => h.id == habit)?.name}</li>
          ))}
        </ul>

        {goal.type != "auto" && (
          <div>
            {goal.status === "in_progress" && (
              <div>
                <button
                  className="btn btn-success"
                  onClick={() => onMark(goal.id)}
                >
                  <Check /> Mark as done 1 {goal.unit}
                </button>
              </div>
            )}

            <div>
              <button
                className="btn btn-danger my-3"
                onClick={() => onReverse(goal.id)}
              >
                <Undo2 /> Return action done 1 {goal.unit}
              </button>
            </div>

            {(goal.status === "in_progress" || goal.status === "completed") && (
              <div>
                <button
                  className="btn btn-warning"
                  onClick={() => onReset(goal.id)}
                >
                  <ListRestart /> Reset the progress
                </button>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
