Here is a highly detailed, executive-level design prompt that you can use to
build or generate this interactive dashboard in Figma. It outlines the visual
architecture of the global time filters, the calendar picker popover, and the
dynamic drill-through logic for the OEE card expansion.

Figma UI/UX Design Prompt: Advanced Interactive Operations Control Tower

1. Global Interactive Filter Bar & Calendar Popover

Every dashboard page must feature a persistent, top-level sub-navigation bar to
control the data scope across the platform.

  - Filter Bar Layout:
      - A horizontal container with a very light cool-gray background, thin
        slate borders, and rounded corners (12px).
      - Timeframe Segmented Selector: Last 24 Hours, 7 Days, 30 Days (Default
        Active), 90 Days, Custom Range.
      - Interactive Date Picker Field: Displayed adjacent to the segmented
        controls. Labeled with a calendar icon and the selected date (e.g.,
        June 17, 2026).
      - Dropdown Filters: Clean selectors for Shift: All Shifts and Line: All
        Lines.
  - Interactive Calendar Dropdown (Calendar Popover):
      - Trigger: Clicking the Custom Range or Date Picker field opens a clean,
        floating calendar card overlay directly below the field.
      - Calendar Styling: Pure white card background with rounded corners (16px)
        and a soft drop shadow (Y: 10px, Blur: 40px, RGBA(0, 0, 0, 0.06)).
      - Header: Displays the month and year (June 2026 in bold dark-slate) with
        soft-gray previous/next chevron buttons (< and >).
      - Grid: A 7-column weekday layout (Su, Mo, Tu, We, Th, Fr, Sa in light
        slate-gray).
      - Active State: The currently selected day (e.g., 17) is highlighted with
        a solid dark-slate circular background and white text. Past days are
        dark slate, and future days are rendered in soft gray.

2. Smart Card Expansion & Recursive Drill-Through (OEE Master Example)

On the Summary dashboard page, the KPI cards feature an advanced, slide-out
expansion panel that adjusts its charting dynamically based on the active Global
Timeframe selection.

A. Dynamic Timeframe-Aware Card Expansion

When a user clicks on the OEE KPI Card, an adjacent detail card slides open to
the right (or expands inline), presenting a specific composed chart styled after
the reference trends:

1.  Year-to-Date (YTD) Mode (If "Year" is active):
      - Visuals: A composed bar-line chart across months (Jan–Sep). Navy blue
        bars represent OEE, with overlaid smooth lines for Availability (Green),
        Performance (Yellow), and Quality (Red).
2.  Quarter-to-Date (QTD) Mode (If "Quarter" is active):
      - Visuals: Weekly aggregated view line chart across weeks W1 to W12
        (matching the purple hue trend style). Plots three smooth, overlapping,
        color-coded line graphs representing Shift A (Deep Violet), Shift B
        (Medium Amethyst), and Shift C (Light Lilac).
3.  Week-to-Date (WTD) Mode (If "Week" is active):
      - Visuals: Daily trend chart across days Mon to Sun (matching the green
        hue trend style). Plots three smooth, overlapping green lines
        representing Shift A, Shift B, and Shift C.
4.  Hourly/Daily Mode (If "Day" or "24 Hours" is active):
      - Visuals: Hourly production comparison chart across hours Hr 1 to Hr 8
        (matching the blue hue trend style). Plots three smooth, overlapping
        blue lines representing Shift A, Shift B, and Shift C.

B. Interactive Drill-Through Filter Action (The "Insight Door")

  - The Interaction: Every bar, column, or data node point on the expanded trend
    chart is interactive on click.
  - Drill-Through Action: When a user clicks a specific data element on the
    expanded chart (for example, clicking the "May" bar on the YTD chart, or the
    "W4" node on the QTD chart):
    1.  The adjacent summary card recursively filters its metrics to display
        only the data for that specific selected period (May or Week 4).
    2.  The OEE score, delta percentages, availability/performance/quality
        sub-metrics, and active anomaly counts immediately update to reflect the
        drill-through period.
    3.  A subtle breadcrumb badge appears in the card header (e.g., Filtered:
        May 2026 or Filtered: Week 4) with a close "x" button to reset the card
        back to its high-level overall state.

3. Premium Aesthetic & Styling Guidelines

  - Tone: Ultra-premium, executive leadership presentation style.
  - Grid Hygiene: Set strict margins and container wrapping to prevent content
    overlapping or clipping across all viewports.
  - Palette Alignment: Use the color-coded shift profiles strictly from the
    references:
      - OEE Components: Availability (#10B981), Performance (#F59E0B), Quality
        (#EF4444).
      - Quarter-to-Date Trends: Shaded purples (#7C3AED, #A78BFA, #DDD6FE).
      - Hourly Trends: Shaded blues (#1D4ED8, #3B82F6, #93C5FD).
      - Week-to-Date Trends: Shaded greens (#047857, #10B981, #6EE7B7).
