'use client';
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Paper, Typography, Box } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StatChartProps {
  type: 'bar' | 'pie' | 'line';
  title: string;
  data: any;
  options?: any;
  height?: number;
}

const StatChart: React.FC<StatChartProps> = ({
  type,
  title,
  data,
  options = {},
  height = 300
}) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false, // We'll use MUI Typography instead
      },
    },
    ...options
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <Bar data={data} options={defaultOptions} />;
      case 'pie':
        return <Pie data={data} options={defaultOptions} />;
      case 'line':
        return <Line data={data} options={defaultOptions} />;
      default:
        return <Bar data={data} options={defaultOptions} />;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom color="primary">
        {title}
      </Typography>
      <Box sx={{ height, position: 'relative' }}>
        {renderChart()}
      </Box>
    </Paper>
  );
};

// Utility functions to create common chart data structures
export const createEnrollmentData = (studies: any[]) => ({
  labels: studies.map(study => study.title.length > 20 
    ? study.title.substring(0, 20) + '...' 
    : study.title),
  datasets: [
    {
      label: 'Current Enrollment',
      data: studies.map(study => study.enrollment_current),
      backgroundColor: 'rgba(25, 118, 210, 0.6)',
      borderColor: 'rgba(25, 118, 210, 1)',
      borderWidth: 1,
    },
    {
      label: 'Target Enrollment',
      data: studies.map(study => study.enrollment_target),
      backgroundColor: 'rgba(76, 175, 80, 0.6)',
      borderColor: 'rgba(76, 175, 80, 1)',
      borderWidth: 1,
    },
  ],
});

export const createStatusPieData = (studies: any[]) => {
  const statusCounts = studies.reduce((acc: any, study) => {
    acc[study.status] = (acc[study.status] || 0) + 1;
    return acc;
  }, {});

  return {
    labels: Object.keys(statusCounts).map(status => 
      status.charAt(0).toUpperCase() + status.slice(1)
    ),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',  // Active - Green
          'rgba(25, 118, 210, 0.8)', // Completed - Blue
          'rgba(255, 152, 0, 0.8)',  // Draft - Orange
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(25, 118, 210, 1)',
          'rgba(255, 152, 0, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };
};

export const createTimelineData = (studies: any[]) => {
  // Simple monthly enrollment trend (mock data for demo)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const enrollmentTrend = [12, 19, 15, 25, 22, 30];

  return {
    labels: months,
    datasets: [
      {
        label: 'Monthly Enrollments',
        data: enrollmentTrend,
        borderColor: 'rgba(25, 118, 210, 1)',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  };
};

export default StatChart;