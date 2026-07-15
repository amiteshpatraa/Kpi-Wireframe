Below is the updated design prompt containing all specified KPIs with dummy
data, the renamed platform header, the revised navigation bar structure with OEE
integrated across all pages, and the requested sidebar navigation changes.

Figma Design Prompt: Manufacturing Control Tower UI

1. Global Layout & Styling Guidelines

  - Aesthetic: Clean, modern, light-themed industrial IoT dashboard. Use rounded
    corners (8px to 12px), subtle card drop-shadows, and light-gray backgrounds
    (#F8F9FA).
  - Colors: Accent Blue (#3B82F6), Success Green (#10B981), Warning Orange
    (#F59E0B), Danger Red (#EF4444), and Slate/Charcoal text.

Sidebar Navigation (Show on All Pages)

  - Header Logo & Title:
      - Title: Manufacturing Control Tower
      - Subtitle: Powered by Atlas Platform
  - Navigation Menu Items:
    1.  Production
    2.  Quality
    3.  Summary
    4.  Inventory
    5.  Maintenance Console (Note: Ensure "Plant Live Dashboard" and "AI
        Shopfloor Assistant" are hidden/removed).

Global Top Navigation Bar (Show on All Pages)

  - Left Section: Hierarchy breadcrumbs: Global Enterprise > BU-Automotive >
    Detroit Assembly Plant #3
  - Right Section: User Profile Icon, Live Time (14:32:05), and Date
    (June 10, 2026).
  - Center Section (Integrated OEE Widget):
      - Default State: A single card/button showing OEE: 75% with a blue
        circular or horizontal progress bar.
      - Hover/Interaction State: When hovered or clicked, it reveals a clean,
        secondary inline dropdown or expansion panel showing:
          - Availability: 79% (Green progress line)
          - Performance: 71% (Purple/Orange progress line)
          - Quality: 77% (Green progress line)

2. Screen Pages & Component Detail (with Dummy Data)

Page A: Production Dashboard (Active State: Production)

  - Top Sub-header Filter Bar: Dropdowns for Date: June 10, 2026, Shift: All
    Shifts, and Line: Assembly Line 01.
  - Body Content Layout:
      - KPI Card 1: Throughput Analysis
          - Format: Area/Line Chart.
          - Dummy Data: Trend line plotting hourly throughput.
              - 08:00 (450 units), 10:00 (480 units), 12:00 (390 units - lunch
                dip), 14:00 (510 units), 16:00 (495 units).
              - Target Line: Flat dashed line at 500 units/hour.
      - KPI Card 2: Cycle Time vs. Takt Time
          - Format: Combo Chart (Bar chart for Cycle Time, horizontal solid line
            for Takt Time).
          - Dummy Data:
              - Takt Time Limit: Solid Red Line at 45 seconds.
              - Actual Cycle Times: Station 1 (41s), Station 2 (43s), Station 3
                (48s - Annotated in Red as "Anomaly Bottleneck"), Station 4
                (40s), Station 5 (42s).
      - KPI Card 3: Capacity Utilization
          - Format: Semi-circular radial gauge.
          - Dummy Data: Value: 82% (Target: 85%).
      - KPI Card 4: Schedule Adherence
          - Format: Numeric value card with green pill badge.
          - Dummy Data: Value: 94.2% (+1.5% vs yesterday).

Page B: Quality Dashboard (Active State: Quality)

  - Body Content Layout:
      - KPI Card 1: First Pass Yield (FPY)
          - Format: Large circular progress ring.
          - Dummy Data: 96.2% (Target: 97.0%). Label: "First Time Right units".
      - KPI Card 2: Scrap Rate Trend
          - Format: Vertical bar chart.
          - Dummy Data:
              - Mon (1.9%), Tue (2.1%), Wed (1.8%), Thu (1.5%), Fri (1.7%).
              - Target line: Dashed line at 2.0% max limit.
      - KPI Card 3: PPM Defective
          - Format: KPI block with a sparkline trend.
          - Dummy Data: 150 PPM (Current). Sparkline shows a downward trend
            from 220 PPM over the last 30 days.
      - KPI Card 4: Rework Rate & Customer Returns
          - Format: Split metric card.
          - Dummy Data:
              - Rework Rate: 2.1% (Yellow caution status).
              - Customer Escapes: 2 units (YTD, Green success status).

Page C: Summary Page (Active State: Summary)

Provides a high-level executive roll-up of all system domains.

  - Body Content Layout:
      - Section 1: Plant Overview Cards
          - Production Status: Normal (Green dot)
          - Daily Target: 4,800 / 5,000 units (96%)
          - Active Alerts: 3 Low-Priority Alerts (Yellow)
      - Section 2: Multi-Domain Summary Grid
          - Production Summary: 2,150 units produced today, running at 94%
            efficiency.
          - Quality Summary: FPY at 96.2%, Scrap rate stable at 1.7%.
          - Maintenance Summary: Next scheduled downtime in 4 hours (Line 02
            PM).
          - Inventory Summary: Buffer stocks at 88% capacity.

Page D: Inventory Dashboard (Active State: Inventory)

  - Body Content Layout:
      - KPI Card 1: Inventory Turnover & Days on Hand
          - Format: Side-by-side numeric cards.
          - Dummy Data:
              - Inventory Turnover: 8.5x (Target: 8.0x).
              - Days of Supply: 12 Days (Safe zone).
      - KPI Card 2: Work-in-Progress (WIP) Tracking
          - Format: Smooth area chart.
          - Dummy Data: Daily WIP fluctuations.
              - Mon (1,100 units), Tue (1,350 units), Wed (1,200 units), Thu
                (1,400 units), Fri (950 units - weekend wind-down).
      - KPI Card 3: Stockout Rate & Inventory Accuracy
          - Format: Split indicator cards.
          - Dummy Data:
              - Inventory Accuracy: 99.4% (Green status).
              - Line Stockout Incident Rate: 0.2% (Target: <0.5%).

Page E: Maintenance Console (Active State: Maintenance Console)

  - Body Content Layout:
      - KPI Card 1: Equipment Reliability Metrics (MTBF & MTTR)
          - Format: Double card display.
          - Dummy Data:
              - MTBF (Mean Time Between Failures): 120 Hours (Up by 5% this
                month, Green indicator).
              - MTTR (Mean Time to Repair): 42 Minutes (Down by 3 mins, Green
                indicator, Target <45 mins).
              - MTBR (Mean Time Between Repairs): 98 Hours.
      - KPI Card 2: Downtime Analysis (Planned vs. Unplanned)
          - Format: Donut chart.
          - Dummy Data:
              - Unplanned Breakdown Downtime: 3.2 Hours (28.5%).
              - Scheduled Preventive Maintenance: 8.0 Hours (71.5%).
              - Total Downtime: 11.2 Hours this week.
      - KPI Card 3: PM Compliance Rate
          - Format: Horizontal progress tracking bar.
          - Dummy Data: 98.5% Task Completion (Target: 98%).
