import React from "react";
import { BatchReviewItem } from "../lib/types";

interface TopReviewsListProps {
  topComplaints: BatchReviewItem[];
  topPraised: BatchReviewItem[];
}

export default function TopReviewsList({
  topComplaints,
  topPraised,
}: TopReviewsListProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Complaints */}
      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Top Complaints
        </h3>
        {topComplaints.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No complaints found in this batch
          </p>
        ) : (
          <ul className="space-y-2">
            {topComplaints.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="mt-1 text-red-400 flex-shrink-0">•</span>
                <span>{item.review}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top Praised */}
      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Top Praised
        </h3>
        {topPraised.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No additional praised aspects found
          </p>
        ) : (
          <ul className="space-y-2">
            {topPraised.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="mt-1 text-green-400 flex-shrink-0">•</span>
                <span>{item.review}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
