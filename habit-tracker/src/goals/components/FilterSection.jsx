// 1. FilterSection.jsx - Component cho phần lọc và sắp xếp
import React from 'react';
import { Card, CardHeader, CardTitle } from "react-bootstrap";
import Form from "react-bootstrap/Form";

export const FilterSection = ({ filters, setFilters }) => {
  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          Filters & Sorting
        </CardTitle>
      </CardHeader>
      <div className="p-3">
        <div className="d-flex gap-4">
          {/* Status */}
          <div className="space-y-2 flex-fill">
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="all">All Status</option>
              <option value="in_progress">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </Form.Select>
          </div>

          {/* Priority */}
          <div className="space-y-2 flex-fill">
            <Form.Label>Priority</Form.Label>
            <Form.Select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </Form.Select>
          </div>

          {/* Sort By */}
          <div className="space-y-2 flex-fill">
            <Form.Label>Sort By</Form.Label>
            <Form.Select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value })
              }
            >
              <option value="deadline">Deadline</option>
              <option value="progress">Progress</option>
              <option value="created">Created Date</option>
              <option value="priority">Priority</option>
            </Form.Select>
          </div>

          {/* Order */}
          <div className="space-y-2 flex-fill">
            <Form.Label>Order</Form.Label>
            <Form.Select
              value={filters.sortOrder}
              onChange={(e) =>
                setFilters({ ...filters, sortOrder: e.target.value })
              }
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </Form.Select>
          </div>
        </div>
      </div>
    </Card>
  );
};