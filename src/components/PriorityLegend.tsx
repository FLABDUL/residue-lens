export function PriorityLegend() {
  return (
    <aside className="priority-legend" aria-label="Organic-buying priority colours">
      <div className="priority-scale">
        <span data-priority="lower"><i aria-hidden="true" />Lower organic-buying priority</span>
        <span data-priority="moderate"><i aria-hidden="true" />Moderate organic-buying priority</span>
        <span data-priority="higher"><i aria-hidden="true" />Higher organic-buying priority</span>
      </div>
      <p>Priority reflects monitoring patterns and sample coverage—not health risk, nutritional value, price or an instruction to buy organic.</p>
    </aside>
  );
}
