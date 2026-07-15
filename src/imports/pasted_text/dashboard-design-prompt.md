This comprehensive, master design prompt outlines the visual layout, interaction
architecture, and specific chart details required to build or generate this
high-end, leadership-ready dashboard.

Master UI/UX Design Prompt: Interactive Manufacturing Control Tower

1. Global Timeframe Segmented Selector (The Filter Header)

At the very top of every dashboard page, place a persistent, premium global
filter bar containing a Multi-Select Segmented Timeframe Selector.

  - Segmented Controls: A horizontal button group featuring: Year, Quarter,
    Month, Week, and Custom Range.
      - Visual Style: Rounded capsules with a very soft-gray background. Active
        segments are styled in solid white with a crisp primary blue font and a
        soft drop shadow, while inactive segments use a subtle slate-gray text.
      - Custom Range Interaction: Selecting "Custom Range" triggers a clean,
        popover calendar picker matching the styling in the reference image
        (white background, rounded corners, soft shadow, clear date grid with
        the active date circled in deep navy blue).
  - Secondary Filters: Positioned to the right of the timeframe selectors,
    separated by a thin vertical divider line: Shift (Dropdown: All Shifts,
    Shift A, Shift B, Shift C) and Line (Dropdown: All Lines, Line 01, Line 02).

2. Interactive KPI Card Adjacent Expansion (On-Click View)

On the Summary Page, implement a dynamic expansion layout for the four key
operational cards (OEE, Total Downtime, Defects, and Rework).

  - Default State: The KPI overview cards are arranged in a clean, spacious
    column grid.
  - The Adjacent Expansion Mechanism:
      - When a user clicks on an overview card (e.g., the OEE Card), a companion
        Trend Analysis Card smoothly slides out or pops open directly adjacent
        (to the right) of the selected card.
      - This expansion temporarily shifts adjacent cards to maintain grid
        balance, providing an intuitive side-by-side comparative workspace.
      - A clean, subtle Close (X) Button is positioned in the top-right corner
        of the expanded card to collapse it back to the default overview state.
  - Multi-Timeframe Selected View: If multiple timeframe selectors are active
    (e.g., both Quarter and Month are toggled on), clicking a KPI card expands
    it to show both corresponding trend charts side-by-side in a multi-pane
    adjacent view.

3. Advanced Composed Trend Charts (Inside Expanded Cards)

The chart inside each expanded adjacent card must be an Advanced Composed
Bar-Line Chart designed to represent complex historical performance.

  - Volumetric Base (Bar Chart): Clean vertical columns representing baseline
    production volumes, planned targets, or standard operating capacity
    (rendered in a soft, semi-transparent light periwinkle blue #ADC9FA with an
    opacity of 20%).
  - Actual Performance (Line Chart Overlay): A bold, smooth, curved Bezier
    trendline (stroke-width: 2.5px) running over the top of the bars to
    represent the actual tracked values (e.g., OEE index, defect counts, or
    downtime hours).
      - OEE Trend: Includes three additional thin, color-coded lines mapping
        Availability (Emerald Green), Performance (Golden Yellow), and Quality
        (Coral Red) over the same time series.
  - Analytical Overlays:
      - A horizontal dashed reference line showing standard target thresholds.
      - Explicitly marked, slightly larger colored data nodes representing
        Anomalies (where values deviate past standard standard limits).
  - Interactive Tooltip: Hovering over any column or data node displays a
    premium, rounded tooltip card (bg: #FFFFFF with a thin #E5E7EB border)
    listing detailed exact metric values, components, and target gaps.

4. Drill-Through & Cross-Filtering Interaction

  - The Interaction Flow: Within any adjacent trend chart, clicking directly on
    a specific monthly, weekly, or daily bar/column trigger a Drill-Through
    Action.
  - Original Card Reaction: The original KPI summary card on the left instantly
    updates its main metric value, delta badges, and contextual insights to
    isolate and display only the data from that selected specific time interval.
  - Visual feedback: The selected bar in the trend chart remains highlighted,
    while unselected bars fade slightly to 50% opacity to clearly denote the
    active filter context.

5. Premium Theme, Spacing, and Elevation Guidelines

To ensure a cohesive, executive-level presentation that avoids a "flat" or
congested look:

  - Page Background: Use a very clean, light cool-gray (#F8F9FA or #F3F4F6).
  - Card Container Background: All cards must be pure white (#FFFFFF) with a
    thin border (1px solid #E5E7EB), rounded corners (16px), and a soft,
    realistic drop shadow:
      - Shadow setting: X: 0, Y: 8px, Blur: 30px, Spread: 0, Color:
        RGBA(0, 0, 0, 0.04).
  - Internal Padding: Ensure a consistent, spacious 24px internal padding on all
    sides of every card.
  - Grouped Bar Colors:
      - Left Bar (Planned/Scheduled): #ADC9FA (Soft Light Periwinkle Blue).
      - Right Bar (Actual/Unplanned): #005CFF (Solid Vibrant Blue).
  - Unified Icons: Every icon must reside inside a soft, translucent
    rounded-square container (size: 40px, corner-radius: 12px, with background
    color matched to the icon's color at 10% opacity).
