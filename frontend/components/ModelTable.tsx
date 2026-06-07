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
  models: Record<string, ModelMetrics>;
}

export default function ModelTable({ models }: ModelTableProps) {
  // Order exactly: Logistic Regression (lr), Naive Bayes (nb), SVM (svm)
  const order = ["lr", "nb", "svm"];
  const orderedModels = order
    .map((key) => {
      const model = models[key];
      if (!model) return null;
      return {
        ...model,
        key,
      };
    })
    .filter(Boolean) as Array<ModelMetrics & { key: string }>;

  return (
    <div className="w-full overflow-hidden border border-terminal-border rounded-[4px] bg-terminal-card select-none">
      <table className="w-full text-left border-collapse font-mono">
        <thead>
          <tr className="border-b border-terminal-border bg-terminal-border/20">
            <th className="px-5 py-3 text-[10px] font-bold text-muted-text uppercase tracking-widest">Model</th>
            <th className="px-5 py-3 text-[10px] font-bold text-muted-text uppercase tracking-widest text-right">Accuracy</th>
            <th className="px-5 py-3 text-[10px] font-bold text-muted-text uppercase tracking-widest text-right">F1 Score</th>
            <th className="px-5 py-3 text-[10px] font-bold text-muted-text uppercase tracking-widest text-right">Precision</th>
            <th className="px-5 py-3 text-[10px] font-bold text-muted-text uppercase tracking-widest text-right">Recall</th>
            <th className="px-5 py-3 text-[10px] font-bold text-muted-text uppercase tracking-widest text-center">Recommended</th>
          </tr>
        </thead>
        <tbody>
          {orderedModels.map((model) => {
            const isLR = model.key === "lr";
            return (
              <tr 
                key={model.key} 
                className={`text-[12px] border-b border-terminal-border last:border-0 transition-colors duration-150 ${
                  isLR 
                    ? "bg-[rgba(0,212,255,0.035)] border-l-2 border-l-accent-cyan" 
                    : "hover:bg-terminal-border/10 border-l-2 border-l-transparent"
                }`}
              >
                <td className="px-5 py-3.5 font-bold text-white uppercase">{model.name}</td>
                <td className="px-5 py-3.5 text-right text-body-text">{model.accuracy.toFixed(4)}</td>
                <td className="px-5 py-3.5 text-right text-body-text">{model.f1.toFixed(4)}</td>
                <td className="px-5 py-3.5 text-right text-body-text">{model.precision.toFixed(4)}</td>
                <td className="px-5 py-3.5 text-right text-body-text">{model.recall.toFixed(4)}</td>
                <td className="px-5 py-3.5 text-center">
                  {model.is_default ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[9px] font-bold bg-[rgba(57,255,20,0.15)] text-accent-green border border-[rgba(57,255,20,0.3)] select-none">
                      ✔ RECOMMENDED
                    </span>
                  ) : (
                    <span className="text-muted-text">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
