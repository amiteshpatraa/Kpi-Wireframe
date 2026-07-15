Here is the consolidated master prompt. It hides the Inventory and Maintenance
pages from the sidebar, shifts all their charts and metrics onto the Production
page, and organizes them into a clean, highly structured, 2-column grid.

Figma UI Design Prompt: Consolidated Production & Operations Dashboard

1. Global Navigation & Sidebar Cleaning

  - Sidebar Navigation (Hidden Pages): Completely hide and remove the Inventory
    and Maintenance Console pages from the sidebar.
  - Active Sidebar Structure:
    1.  Summary
    2.  Production (Active - now serving as the consolidated "Production &
        Operations" workspace)
    3.  Quality
  - No Header Tabs: Ensure the TrendHeader is completely removed from all pages;
    the layout transitions straight from the top filter bar into the KPI row.

2. Top-Row KPI Metrics Row (PageKPIRow)

Place a horizontal row of seven small, premium KPI cards directly below the
sub-navigation/filter bar at the top of the Production page:

1.  Throughput: 478 u/hr | On Target (Green Badge) | Insight: "Within safe
    operating limits · +12 vs prior period"
2.  OEE: 75% | +2.1% (Green Badge) | Insight: "Availability leading gains —
    trending up over last 7 days"
3.  Cycle Time: 43s | 2 Anomalies (Red Badge) | Insight: "Anomalies detected at
    ST-03 (48s) and ST-06 (47s)"
4.  Schedule Adherence: 94.2% | +1.5% (Green Badge) | Insight: "4,800 / 5,000
    units produced on schedule"
5.  WIP Traceability: 312 units | -18 WIP (Green Badge) | Insight: "In-progress
    stock is stable and running below shift average"
6.  RM Coverage: 3 items | Low (Red Badge) | Insight: "3 critical material parts
    are below safety thresholds"
7.  Overall Downtime: 11.2h | +0.8h (Red Badge) | Insight: "Planned: 8.0h |
    Unplanned: 3.2h breakdown over current shift"

3. Production Page Body: Consolidated 2-Column Grid Layout

Organize the body area into a continuous 2-column grid layout (grid grid-cols-2
gap-8) grouped into three logical operations sections:

Section A: Core Production Metrics

  - Card 1: OEE Performance Trend (1/2 Width Column)
      - Visuals: Composed Chart over months Jan–Sep. Base vertical bars
        represent Overall OEE (#1E3A8A). Three overlapping smooth curves
        (Availability: #10B981, Performance: #F59E0B, Quality: #EF4444) trace
        across the bars.
  - Card 2: Throughput Analysis (1/2 Width Column)
      - Visuals: Composed Chart. Volumetric base bars (#94A3B8 at 18% opacity)
        represent Planned targets, with a solid, curved royal blue trendline
        (#3B82F6) tracing Actual output.
  - Card 3: Cycle Time vs Takt Time (1/2 Width Column)
      - Visuals: Vertical bars representing station cycle times (Anomalous
        stations ST-03 and ST-06 highlighted in red #EF4444, others in purple
        #8B5CF6). Red solid line at 45s indicates the Takt Time limit.
  - Card 4: Schedule Adherence Trend (1/2 Width Column)
      - Visuals: Grouped Column Chart showing Planned Target vs. Actual Output
        side-by-side:
          - Planned Target (Left Column): Soft light periwinkle blue (#ADC9FA).
          - Actual Output (Right Column): Rich, solid vibrant blue (#005CFF).

Section B: Inventory & Material Tracking

  - Card 5: WIP Traceability (1/2 Width Column)
      - Visuals: Vertical column/bar chart trend tracking active units on the
        floor over hourly intervals (06:00 to 17:00), using solid indigo columns
        (#6366F1).
  - Card 6: Raw Material Coverage Shortage Widget (1/2 Width Column)
      - Visuals: Shortage distribution summary widget with five horizontal
        colored mini-cards:
          - 0 Inventory: Red border. Value: 3 ("Part Count").
          - Upto 1 Day: Soft Red border. Value: 0 ("Part Count").
          - Upto 2 Days: Yellow border. Value: 1 ("Part Count").
          - Upto 3 Days: Soft Yellow border. Value: 0 ("Part Count").
          - Over 3 Days: Green border. Value: 32 ("Part Count").
      - Context Footer: Labeled warning badge ⚠️ 4 parts below threshold in
        amber.

Section C: Maintenance & Reliability

  - Card 7: Overall Downtime Analysis (1/2 Width Column)
      - Visuals: Donut chart displaying Scheduled PM (8.0h / 71.5% in blue) vs.
        Unplanned Breakdown (3.2h / 28.5% in red).
      - Downtime Trend: Bottom of card features a mini Grouped Column Chart
        (Planned: #ADC9FA left column, Unplanned: #005CFF right column).
  - Card 8: Downtime Pareto Analysis (1/2 Width Column)
      - Visuals: Vertical bar chart representing top downtime causes by duration
        (minutes) sorted in descending order, styled with a violet-to-indigo
        gradient.

4. Visual Polish & Elevation Details

  - Page Background: Light cool-gray (#F8F9FA).
  - Card Styling: Pure white backgrounds (#FFFFFF), thin border (1px solid
    #E5E7EB), soft rounded corners (16px), and soft, realistic drop shadows
    (Y: 8px, Blur: 30px, RGBA(0, 0, 0, 0.04)).
  - Standardized Icons: All card headers must place the icon inside a
    rounded-square container (40px, corner-radius 12px, with a background color
    at 10% opacity matching the icon stroke color).
