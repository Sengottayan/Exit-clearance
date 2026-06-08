import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';

const data = [
  { name: 'Jan', exits: 2 },
  { name: 'Feb', exits: 3 },
  { name: 'Mar', exits: 5 },
  { name: 'Apr', exits: 4 },
  { name: 'May', exits: 7 },
  { name: 'Jun', exits: 6 },
  { name: 'Jul', exits: 8 },
  { name: 'Aug', exits: 5 },
  { name: 'Sep', exits: 9 },
  { name: 'Oct', exits: 11 },
  { name: 'Nov', exits: 8 },
  { name: 'Dec', exits: 12 },
];

export function ExitTrendChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#e5e7eb'} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb', borderRadius: '8px' }}
            itemStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
          />
          <Line type="monotone" dataKey="exits" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
