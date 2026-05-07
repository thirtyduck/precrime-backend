import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, PieChart } from 'lucide-react';
import type { RiskMetric, ThreatCategory } from '@/types/threat';

interface RiskMetricsProps {
  metrics: RiskMetric[];
  categories: ThreatCategory[];
}

export function RiskMetrics({ metrics, categories }: RiskMetricsProps) {
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h2 className="font-orbitron text-lg font-semibold text-white tracking-wide">
          RISK INTELLIGENCE METRICS
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Score Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map((metric, index) => (
            <RiskScoreCard key={metric.name} metric={metric} index={index} />
          ))}
        </div>

        {/* Threat Categories */}
        <div className="cyber-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <h3 className="font-orbitron text-sm text-cyan-400">THREAT CATEGORIES</h3>
          </div>
          <div className="space-y-3">
            {categories.map((category) => (
              <CategoryBar key={category.name} category={category} />
            ))}
          </div>
        </div>
      </div>

      {/* Risk Trend Chart */}
      <div className="cyber-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="font-orbitron text-sm text-cyan-400">RISK TREND ANALYSIS</h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-cyan-400/60">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Current
            </span>
            <span className="flex items-center gap-1 text-cyan-400/60">
              <span className="w-2 h-2 rounded-full bg-cyan-400/30" /> Projected
            </span>
          </div>
        </div>
        <RiskTrendChart />
      </div>
    </section>
  );
}

interface RiskScoreCardProps {
  metric: RiskMetric;
  index: number;
}

function RiskScoreCard({ metric, index }: RiskScoreCardProps) {
  const getColor = (value: number) => {
    if (value >= 70) return 'text-red-400';
    if (value >= 50) return 'text-amber-400';
    if (value >= 30) return 'text-cyan-400';
    return 'text-emerald-400';
  };

  const getBgColor = (value: number) => {
    if (value >= 70) return 'from-red-500/20 to-red-500/5';
    if (value >= 50) return 'from-amber-500/20 to-amber-500/5';
    if (value >= 30) return 'from-cyan-500/20 to-cyan-500/5';
    return 'from-emerald-500/20 to-emerald-500/5';
  };

  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;
  const trendColor = metric.trend === 'up' ? 'text-red-400' : metric.trend === 'down' ? 'text-emerald-400' : 'text-cyan-400';

  return (
    <div 
      className={`cyber-card p-4 relative overflow-hidden`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${getBgColor(metric.value)} opacity-50`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-cyan-400/60 uppercase tracking-wider">{metric.name}</span>
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
        </div>
        <div className="flex items-end gap-2">
          <span className={`font-orbitron text-3xl font-bold ${getColor(metric.value)}`}>
            {metric.value}
          </span>
          <span className={`text-xs mb-1 ${metric.change > 0 ? 'text-red-400' : metric.change < 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
            {metric.change > 0 ? '+' : ''}{metric.change}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-cyber-dark rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              metric.value >= 70 ? 'bg-red-400' : 
              metric.value >= 50 ? 'bg-amber-400' : 
              metric.value >= 30 ? 'bg-cyan-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${metric.value}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface CategoryBarProps {
  category: ThreatCategory;
}

function CategoryBar({ category }: CategoryBarProps) {
  const maxCount = Math.max(...categories.map(c => c.count));
  const percentage = (category.count / maxCount) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-cyan-400/80">{category.name}</span>
        <div className="flex items-center gap-2">
          <span className="font-orbitron text-cyan-400">{category.count}</span>
          <span className={`text-[10px] ${category.trend > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {category.trend > 0 ? '↗' : '↘'} {Math.abs(category.trend)}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: category.color,
            boxShadow: `0 0 10px ${category.color}40`
          }}
        />
      </div>
    </div>
  );
}

// Sample categories for the bar calculation
const categories = [
  { name: 'Cyber Attack', count: 23, trend: 15, color: '#ff0040' },
  { name: 'Internal Security', count: 12, trend: -3, color: '#ffbf00' },
  { name: 'Financial', count: 18, trend: 8, color: '#00ffff' },
  { name: 'Logistics', count: 9, trend: 2, color: '#00ff80' },
  { name: 'Social Engineering', count: 15, trend: 5, color: '#ff6b35' },
];

function RiskTrendChart() {
  // Generate sample data points
  const dataPoints = [45, 52, 48, 61, 55, 67, 72, 68, 75, 82, 78, 85];
  const projectedPoints = [85, 88, 92, 89, 94, 91, 96];
  
  const maxValue = 100;
  const chartHeight = 120;
  const chartWidth = 100;
  
  const generatePath = (points: number[]) => {
    const stepX = chartWidth / (points.length - 1);
    return points.map((point, i) => {
      const x = i * stepX;
      const y = chartHeight - (point / maxValue) * chartHeight;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const currentPath = generatePath(dataPoints);
  const projectedPath = generatePath(projectedPoints);

  return (
    <div className="relative h-32 w-full">
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((tick) => (
          <line
            key={tick}
            x1="0"
            y1={chartHeight - (tick / maxValue) * chartHeight}
            x2={chartWidth}
            y2={chartHeight - (tick / maxValue) * chartHeight}
            stroke="rgba(0, 255, 255, 0.1)"
            strokeWidth="0.5"
          />
        ))}

        {/* Current data line */}
        <path
          d={currentPath}
          fill="none"
          stroke="rgba(0, 255, 255, 0.8)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Projected data line (dashed) */}
        <path
          d={`M ${(dataPoints.length - 1) * (chartWidth / (dataPoints.length - 1))} ${chartHeight - (dataPoints[dataPoints.length - 1] / maxValue) * chartHeight} ${projectedPath.replace('M', 'L')}`}
          fill="none"
          stroke="rgba(0, 255, 255, 0.3)"
          strokeWidth="1.5"
          strokeDasharray="4,4"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points */}
        {dataPoints.map((point, i) => (
          <circle
            key={i}
            cx={i * (chartWidth / (dataPoints.length - 1))}
            cy={chartHeight - (point / maxValue) * chartHeight}
            r="1.5"
            fill="rgba(0, 255, 255, 0.8)"
          />
        ))}

        {/* Projection start point */}
        <circle
          cx={(dataPoints.length - 1) * (chartWidth / (dataPoints.length - 1))}
          cy={chartHeight - (dataPoints[dataPoints.length - 1] / maxValue) * chartHeight}
          r="2"
          fill="rgba(0, 255, 255, 0.5)"
        />
      </svg>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-cyan-400/40 -ml-6">
        <span>100</span>
        <span>75</span>
        <span>50</span>
        <span>25</span>
        <span>0</span>
      </div>
    </div>
  );
}
