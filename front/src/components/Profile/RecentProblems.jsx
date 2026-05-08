import { CheckCircle2, Clock, ChevronRight } from 'lucide-react';

export default function RecentProblems() {
  const recentProblems = [
    {
      id: 1,
      title: 'Two Sum',
      difficulty: 'Easy',
      difficultyColor: 'bg-green-500/10 text-green-400 border-green-500/30',
      solvedTime: '2 hours ago',
      icon: 'easy',
    },
    {
      id: 2,
      title: 'Add Two Numbers',
      difficulty: 'Medium',
      difficultyColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      solvedTime: '5 hours ago',
      icon: 'medium',
    },
    {
      id: 3,
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'Medium',
      difficultyColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      solvedTime: '1 day ago',
      icon: 'medium',
    },
    {
      id: 4,
      title: 'Median of Two Sorted Arrays',
      difficulty: 'Hard',
      difficultyColor: 'bg-red-500/10 text-red-400 border-red-500/30',
      solvedTime: '3 days ago',
      icon: 'hard',
    },
    {
      id: 5,
      title: 'ZigZag Conversion',
      difficulty: 'Medium',
      difficultyColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      solvedTime: '1 week ago',
      icon: 'medium',
    },
    {
      id: 6,
      title: 'Reverse Integer',
      difficulty: 'Easy',
      difficultyColor: 'bg-green-500/10 text-green-400 border-green-500/30',
      solvedTime: '2 weeks ago',
      icon: 'easy',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">Recent Solved Problems</h2>
        <a
          href="/problems"
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1 transition-colors duration-200"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      <div className="grid gap-3">
        {recentProblems.map((problem, idx) => (
          <div
            key={problem.id}
            className="group bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-500/50 hover:from-slate-700 hover:to-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Left Section - Problem Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Check Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                </div>

                {/* Problem Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-100 font-semibold group-hover:text-cyan-400 transition-colors duration-200 truncate">
                    {problem.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">
                      {problem.solvedTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Section - Difficulty & Arrow */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${problem.difficultyColor} whitespace-nowrap`}>
                  {problem.difficulty}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors duration-200 transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Progress Bar (subtle) */}
            <div className="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 w-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* View More Button */}
      <button className="w-full mt-6 py-3 rounded-lg border border-slate-600 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition-all duration-200 font-medium group flex items-center justify-center gap-2">
        Load More Problems
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
      </button>
    </div>
  );
}
