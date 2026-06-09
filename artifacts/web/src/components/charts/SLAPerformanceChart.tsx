import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';

interface ChartPoint {
  name: string;
  onTime: number;
  overdue: number;
}

const FALLBACK: ChartPoint[] = [{ name: 'N/A', onTime: 0, overdue: 0 }];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-premium text-[11px] font-semibold text-foreground space-y-1.5">
        <p className="text-muted-foreground uppercase tracking-widest text-[9px] font-extrabold">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any) => (
            <p key={p.name} className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
              <span>{p.name === 'onTime' ? 'On Time' : 'Overdue'}: <strong className="font-extrabold text-foreground">{p.value}</strong></span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function SLAPerformanceChart({ data = FALLBACK }: { data?: ChartPoint[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280', fontWeight: '600' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280', fontWeight: '600' }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)' }} />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-muted-foreground font-semibold mr-4">{value === 'onTime' ? 'On Time' : 'Overdue'}</span>}
          />
          <Bar dataKey="onTime" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 4, 4]} barSize={24} />
          <Bar dataKey="overdue" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
