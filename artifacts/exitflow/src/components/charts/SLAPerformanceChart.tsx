import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';

const data = [
  { name: 'Aug', onTime: 40, overdue: 5 },
  { name: 'Sep', onTime: 45, overdue: 8 },
  { name: 'Oct', onTime: 38, overdue: 12 },
  { name: 'Nov', onTime: 52, overdue: 3 },
  { name: 'Dec', onTime: 48, overdue: 6 },
  { name: 'Jan', onTime: 55, overdue: 2 },
];

export function SLAPerformanceChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#e5e7eb'} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} />
          <Tooltip 
            cursor={{ fill: isDark ? '#374151' : '#f3f4f6' }}
            contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb', borderRadius: '8px' }}
            itemStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-muted-foreground mr-4">{value === 'onTime' ? 'On Time' : 'Overdue'}</span>}
          />
          <Bar dataKey="onTime" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 4, 4]} barSize={32} />
          <Bar dataKey="overdue" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
