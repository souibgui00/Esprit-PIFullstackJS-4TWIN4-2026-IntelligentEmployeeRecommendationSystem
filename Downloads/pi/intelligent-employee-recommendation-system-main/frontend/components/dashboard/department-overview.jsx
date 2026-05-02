"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useData } from "@/lib/data-store"
import { useMemo } from "react"
import { Loader2 } from "lucide-react"

const COLORS = [
  "#F28C1B", // Primary Orange
  "#0F172A", // Deep Charcoal (Slate 900)
  "#475569", // Slate 600
  "#94A3B8", // Slate 400
  "#334155", // Slate 700
]

export function DepartmentOverview() {
  const { employees, departments, loading } = useData()

  const data = useMemo(() => {
    if (!employees || !departments) return []

    return departments.map((dept, index) => {
      const deptEmployees = employees.filter(e =>
        e.department_id === dept._id ||
        e.department_id === dept.id ||
        e.department === dept.name
      )

      return {
        name: dept.name,
        value: deptEmployees.length,
        color: COLORS[index % COLORS.length],
      }
    })
  }, [employees, departments])

  const totalUnits = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data])

  if (loading && data.length === 0) {
    return (
      <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm h-[500px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden group">
      <CardHeader className="p-10 pb-4 border-b border-slate-50">
        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Department Distribution</CardTitle>
        <CardDescription className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 uppercase">Employee distribution across departments</CardDescription>
      </CardHeader>
      <CardContent className="p-10">
        <div className="h-[320px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "900",
                  padding: "16px",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
                }}
                itemStyle={{ color: "#1E293B", padding: "2px 0" }}
                cursor={{ fill: "transparent" }}
                formatter={(value, name) => [
                  `${value} EMPLOYEES`,
                  name.toUpperCase(),
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={60}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-[10px] font-black text-slate-500 tracking-widest ml-2 uppercase">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-12">
            <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">Total Employees</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none mt-1">
              {totalUnits}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
