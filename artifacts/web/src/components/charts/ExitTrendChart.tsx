import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';

interface ChartPoint {
  name: string;
  exits: number;
}

const FALLBACK: ChartPoint[] = [
  { name: 'Jan', exits: 0 },
  { name: 'Feb', exits: 0 },
  { name: 'Mar', exits: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-premium text-[11px] font-semibold text-foreground space-y-1">
        <p className="text-muted-foreground uppercase tracking-widest text-[9px] font-extrabold">{label}</p>
        <p className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>Exits: <strong className="font-extrabold text-foreground">{payload[0].value}</strong></span>
        </p>
      </div>
    );
  }
  return null;
};

export function ExitTrendChart({ data = FALLBACK }: { data?: ChartPoint[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
          <defs>
            <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280', fontWeight: '600' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280', fontWeight: '600' }} />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="exits" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorExits)" 
            dot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--primary))', fill: 'hsl(var(--card))' }} 
            activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
