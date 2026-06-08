import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from 'next-themes';

const data = [
  { name: 'Better Opportunity', value: 35 },
  { name: 'Compensation', value: 25 },
  { name: 'Higher Studies', value: 15 },
  { name: 'Relocation', value: 10 },
  { name: 'Personal Reasons', value: 10 },
  { name: 'Other', value: 5 },
];

const COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))', 
  'hsl(var(--muted-foreground))'
];

export function ReasonsDonutChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb', borderRadius: '8px' }}
            itemStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
