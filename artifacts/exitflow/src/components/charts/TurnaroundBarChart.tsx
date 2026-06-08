import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';

const data = [
  { name: 'Manager', days: 1.5 },
  { name: 'HR', days: 2.1 },
  { name: 'IT', days: 0.8 },
  { name: 'Finance', days: 3.2 },
  { name: 'Admin', days: 1.1 },
  { name: 'InfoSec', days: 0.5 },
];

export function TurnaroundBarChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#333' : '#e5e7eb'} />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} />
          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} width={80} />
          <Tooltip 
            cursor={{ fill: isDark ? '#374151' : '#f3f4f6' }}
            contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb', borderRadius: '8px' }}
            itemStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
            formatter={(value: number) => [`${value} days`, 'Avg. Turnaround']}
          />
          <Bar dataKey="days" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
