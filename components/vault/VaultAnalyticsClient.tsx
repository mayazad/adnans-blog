'use client'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import styles from './VaultAnalyticsClient.module.css'

interface Expense {
  id: string; amount: number; category: string; description: string | null; spent_at: string
}

interface Props {
  expenses: Expense[]
  income: number
  year: number
  month: number
  monthName: string
}

const COLORS = ['#0B6E4F','#12946B','#1DD198','#059669','#34d399','#6ee7b7','#a7f3d0','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6']

function fmt(n: number) {
  return `৳${Math.abs(n).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function generateInsights(expenses: Expense[], income: number, month: number, year: number): { icon: string; text: string; type: 'red' | 'yellow' | 'green' | 'blue' }[] {
  const insights: { icon: string; text: string; type: 'red' | 'yellow' | 'green' | 'blue' }[] = []
  if (expenses.length === 0) return [{ icon: '💡', text: 'No expenses yet. Start adding to see insights!', type: 'blue' }]

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const remaining = income - totalSpent

  // Category breakdown
  const catMap: Record<string, number> = {}
  for (const e of expenses) catMap[e.category] = (catMap[e.category] ?? 0) + Number(e.amount)
  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1])
  const [topCat, topAmt] = sorted[0] ?? ['', 0]
  const topPct = totalSpent > 0 ? Math.round((topAmt / totalSpent) * 100) : 0

  if (topCat) insights.push({ icon: '🔴', text: `${topCat} is your biggest expense at ${fmt(topAmt)} (${topPct}% of spending).`, type: 'red' })

  // Days remaining
  const today = new Date()
  const daysInMonth = getDaysInMonth(year, month)
  const daysPassed = Math.min(today.getDate(), daysInMonth)
  const daysLeft = daysInMonth - daysPassed

  if (income > 0 && daysLeft > 0) {
    const dailyBudget = remaining / daysLeft
    if (dailyBudget < 0) {
      insights.push({ icon: '🔴', text: `You've overspent by ${fmt(Math.abs(remaining))}! Budget is gone.`, type: 'red' })
    } else {
      const type = dailyBudget < 300 ? 'yellow' : 'green'
      insights.push({ icon: type === 'yellow' ? '🟡' : '🟢', text: `${daysLeft} days left. Budget ${fmt(dailyBudget)}/day to last the month.`, type })
    }
  }

  // Avg daily spending
  if (daysPassed > 0) {
    const avgDaily = totalSpent / daysPassed
    insights.push({ icon: '📊', text: `You spend an average of ${fmt(avgDaily)}/day so far this month.`, type: 'blue' })
  }

  // Weekday analysis
  const dayCounts: Record<number, number> = {}
  for (const e of expenses) {
    const day = new Date(e.spent_at).getDay()
    dayCounts[day] = (dayCounts[day] ?? 0) + Number(e.amount)
  }
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const peakDay = Object.entries(dayCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
  if (peakDay) {
    insights.push({ icon: '💡', text: `Your highest spending day is ${DAY_NAMES[Number(peakDay[0])]}. Keep an eye on it!`, type: 'blue' })
  }

  // Budget health
  if (income > 0) {
    const pct = (totalSpent / income) * 100
    if (pct < 50) insights.push({ icon: '🟢', text: `Great control! You've only used ${pct.toFixed(0)}% of your budget.`, type: 'green' })
    else if (pct > 80) insights.push({ icon: '🟡', text: `You've used ${pct.toFixed(0)}% of your budget. Slow down on spending!`, type: 'yellow' })
  }

  return insights
}

export default function VaultAnalyticsClient({ expenses, income, year, month, monthName }: Props) {
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0)

  // Category data for donut
  const catMap: Record<string, number> = {}
  for (const e of expenses) catMap[e.category] = (catMap[e.category] ?? 0) + Number(e.amount)
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  // Daily bar chart
  const dailyMap: Record<string, number> = {}
  const daysInMonth = getDaysInMonth(year, month)
  for (let d = 1; d <= daysInMonth; d++) dailyMap[String(d)] = 0
  for (const e of expenses) {
    const d = String(new Date(e.spent_at).getDate())
    dailyMap[d] = (dailyMap[d] ?? 0) + Number(e.amount)
  }
  const barData = Object.entries(dailyMap).map(([day, amount]) => ({ day, amount }))

  const insights = generateInsights(expenses, income, month, year)

  if (expenses.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📊</div>
        <p>No expenses recorded this month yet.</p>
        <p>Add expenses from the vault to see your analytics!</p>
      </div>
    )
  }

  return (
    <div className={styles.analyticsWrap}>
      {/* Summary Row */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Spent</span>
          <span className={styles.summaryValue}>{fmt(totalSpent)}</span>
        </div>
        {income > 0 && (
          <>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Remaining</span>
              <span className={`${styles.summaryValue} ${income - totalSpent < 0 ? styles.danger : styles.safe}`}>{fmt(income - totalSpent)}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Used</span>
              <span className={styles.summaryValue}>{Math.min(Math.round((totalSpent / income) * 100), 100)}%</span>
            </div>
          </>
        )}
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Transactions</span>
          <span className={styles.summaryValue}>{expenses.length}</span>
        </div>
      </div>

      {/* Donut Chart */}
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>🍩 Spending by Category</h2>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value">
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => [fmt(Number(v ?? 0)), 'Amount']} />
            <Legend formatter={(value) => <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{value}</span>} />
          </PieChart>
        </ResponsiveContainer>

        {/* Category breakdown list */}
        <div className={styles.catList}>
          {pieData.map((item, i) => (
            <div key={item.name} className={styles.catRow}>
              <div className={styles.catDot} style={{ background: COLORS[i % COLORS.length] }} />
              <span className={styles.catName}>{item.name}</span>
              <div className={styles.catBarWrap}>
                <div className={styles.catBar} style={{ width: `${(item.value / totalSpent) * 100}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              <span className={styles.catPct}>{Math.round((item.value / totalSpent) * 100)}%</span>
              <span className={styles.catAmt}>{fmt(item.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Bar Chart */}
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>📅 Daily Spending — {monthName}</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--ink-faint)' }} interval={4} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--ink-faint)' }} tickFormatter={v => `৳${v}`} width={60} />
            <Tooltip formatter={(v) => [fmt(Number(v ?? 0)), 'Spent']} labelFormatter={d => `Day ${d}`} />
            <Bar dataKey="amount" fill="var(--emerald)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className={styles.insightsCard}>
        <h2 className={styles.chartTitle}>💡 Smart Insights</h2>
        <div className={styles.insightsList}>
          {insights.map((ins, i) => (
            <div key={i} className={`${styles.insightItem} ${styles[ins.type]}`}>
              <span className={styles.insightIcon}>{ins.icon}</span>
              <p className={styles.insightText}>{ins.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
