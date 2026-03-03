/** Format date with day-of-week and time: "2024 / 3 / 15（六）07:30" */
export function formatDateWithDay(d: Date): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()} / ${d.getMonth() + 1} / ${d.getDate()}（${days[d.getDay()]}）07:30`;
}

/** Format date simple: "2024/3/15" */
export function formatDateSimple(d: Date): string {
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
