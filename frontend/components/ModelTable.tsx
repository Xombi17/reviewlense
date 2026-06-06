import React from "react";

interface ModelMetrics {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  is_default: boolean;
}

interface ModelTableProps {
  models: ModelMetrics[];
}

export default function ModelTable({ models }: ModelTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Model Name</th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Accuracy</th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Precision</th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Recall</th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">F1</th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Default</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model, idx) => (
            <tr 
              key={model.name} 
              className={`text-sm ${
                idx % 2 === 0 
                  ? "bg-white dark:bg-slate-900" 
                  : "bg-gray-50 dark:bg-slate-800"
              } border-b border-gray-200 dark:border-gray-700 last:border-0`}
            >
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{model.name}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{model.accuracy.toFixed(2)}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{model.precision.toFixed(2)}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{model.recall.toFixed(2)}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{model.f1.toFixed(2)}</td>
              <td className="px-4 py-3">
                {model.is_default && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                    ★ Default
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
