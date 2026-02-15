import { Sheet } from "lucide-react";

export function Navigation() {
  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Sheet className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">GroceryTrack</h1>
            <p className="text-xs text-slate-500">Smart Receipt Manager</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
