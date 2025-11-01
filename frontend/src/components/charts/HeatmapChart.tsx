import React from 'react';
import { ChartProps } from './ChartBase';

const HeatmapChart: React.FC<ChartProps> = ({ data, config }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Extract unique values for rows and columns
  const xKey = config?.x || Object.keys(data[0])[0]; // family_name
  const yKey = config?.y || Object.keys(data[0])[1]; // brand_name
  const valueKey = Object.keys(data[0]).find(k => k.toLowerCase().includes('count') || k.toLowerCase().includes('value') || k.toLowerCase().includes('sum')) || Object.keys(data[0])[2];

  // Get unique values for axes
  const xValues = Array.from(new Set(data.map(d => d[xKey]))).filter(v => v != null);
  const yValues = Array.from(new Set(data.map(d => d[yKey]))).filter(v => v != null);

  // Create a map for quick lookup
  const dataMap = new Map();
  data.forEach(row => {
    const key = `${row[xKey]}-${row[yKey]}`;
    dataMap.set(key, parseFloat(row[valueKey]) || 0);
  });

  // Find min and max values for color scaling
  const values = Array.from(dataMap.values());
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;

  // Color scale function
  const getColor = (value: number) => {
    if (value === 0 || !value) return 'rgba(229, 231, 235, 1)'; // gray-200
    const intensity = range > 0 ? (value - minValue) / range : 0.5;
    
    // Blue to Purple gradient based on intensity
    const r = Math.round(59 + intensity * (139 - 59));
    const g = Math.round(130 + intensity * (92 - 130));
    const b = Math.round(246 + intensity * (246 - 246));
    
    return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.7})`;
  };

  // Calculate cell dimensions
  const cellWidth = Math.max(80, Math.min(150, 800 / xValues.length));
  const cellHeight = Math.max(40, Math.min(60, 600 / yValues.length));

  return (
    <div className="w-full h-full overflow-auto p-4">
      <div className="inline-block min-w-full">
        {/* Heatmap Grid */}
        <div className="relative">
          {/* Column headers (X-axis) */}
          <div className="flex" style={{ marginLeft: `${cellWidth}px` }}>
            {xValues.map((xVal, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center text-xs font-semibold text-gray-700 border-b-2 border-gray-300 p-2"
                style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
              >
                <div className="truncate" title={String(xVal)}>
                  {String(xVal)}
                </div>
              </div>
            ))}
          </div>

          {/* Rows with Y-axis labels and cells */}
          {yValues.map((yVal, rowIdx) => (
            <div key={rowIdx} className="flex">
              {/* Row header (Y-axis) */}
              <div
                className="flex items-center justify-end text-xs font-semibold text-gray-700 border-r-2 border-gray-300 pr-3 py-2"
                style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
              >
                <div className="truncate" title={String(yVal)}>
                  {String(yVal)}
                </div>
              </div>

              {/* Data cells */}
              {xValues.map((xVal, colIdx) => {
                const key = `${xVal}-${yVal}`;
                const value = dataMap.get(key) || 0;
                const color = getColor(value);

                return (
                  <div
                    key={colIdx}
                    className="flex items-center justify-center text-xs font-medium border border-gray-200 p-2 transition-all hover:scale-105 hover:z-10 hover:shadow-lg cursor-pointer"
                    style={{
                      width: `${cellWidth}px`,
                      minWidth: `${cellWidth}px`,
                      height: `${cellHeight}px`,
                      backgroundColor: color,
                      color: value > (minValue + range * 0.6) ? 'white' : 'rgb(31, 41, 55)'
                    }}
                    title={`${xVal} - ${yVal}: ${value.toLocaleString()}`}
                  >
                    {value > 0 ? value.toLocaleString() : '-'}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <span className="text-sm text-gray-600">Low</span>
          <div className="flex items-center gap-1">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity, idx) => {
              const value = minValue + range * intensity;
              const color = getColor(value);
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className="w-12 h-6 border border-gray-300 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-500 mt-1">
                    {Math.round(value).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
          <span className="text-sm text-gray-600">High</span>
        </div>

        {/* Summary */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>
            {yValues.length} {yKey}s × {xValues.length} {xKey}s = {yValues.length * xValues.length} cells
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Range: {minValue.toLocaleString()} - {maxValue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;







