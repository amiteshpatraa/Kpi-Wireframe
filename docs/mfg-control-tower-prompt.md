Here is the updated, comprehensive prompt to design the new layout. It
introduces the new gateway landing page, updates the sidebar branding with the
custom Atlas logo, and restructures the Summary page into a spacious 3-column
grid for all KPIs.

Figma UI Design Prompt: Manufacturing Control Tower

1. Screen 1: "MFG Insights" Gateway Portal (New Landing Page)

Create a clean splash/landing portal page before entering the dashboard.

  - Layout: Split-screen layout (Left and Right columns) on a clean, light
    background with subtle flowing neural-network vector waves in the lower
    section.
  - Left Column (Atlas Branding):
      - Logo Mark: A stylized profile silhouette of a human face/head, where the
        brain region is represented by an intricate, interconnected circular
        neural network diagram with blue and pink node points.
      - Brand Text: Bold, clean sans-serif text "ATLAS" below the logo.
      - Tagline: Subtitle text in small, elegant font: "AI for Taco – Lead And
        Scale".
  - Right Column (Interactive Glassmorphic Hexagon):
      - A large, prominent, vertically oriented dark-blue glossy hexagon card
        with a bright blue neon outer border glow.
      - Inside the Hexagon (Top to Bottom):
        1.  Three thin horizontal cyan lines (menu indicator icon) centered at
            the top.
        2.  A 3D isometric model of a white factory facility with saw-tooth
            rooflines and an elevated industrial control tower, illuminated with
            soft blue interior lighting from the windows.
        3.  A bold, clean white text title centered below the factory: "MFG
            Insights".
        4.  An interactive navigation button at the bottom center: a dark circle
            containing a crisp white forward arrow (→). Clicking this button
            navigates directly to the Summary Dashboard.

2. Screen 2: Main Control Tower (Summary Dashboard)

Sidebar Branding Update

  - Replace the previous text header with the Atlas Brand Mark (face profile
    silhouette + neural network icon) followed by "Manufacturing Control Tower"
    and the subtitle "Powered by Atlas Platform".
  - Sidebar Menu Order:
    1.  Summary (Active)
    2.  Production
    3.  Quality
    4.  Inventory
    5.  Maintenance Console

Top Navigation & Filters

  - Breadcrumbs: Tata Toyo Radiator > Tesla India Unit > Pune Division (as seen
    in the reference screenshot).
  - Header Center: OEE Widget (OEE 75% with clean circular progress ring
    indicator and dropdown chevron).
  - Header Right: Live time (07:16:18 AM | June 11, 2026) and circular blue user
    profile avatar.
  - Filter Bar: A horizontal selector bar directly below the navigation with:
      - Time trend segments: Last 24 Hours, 7 Days, 30 Days (Active/Selected),
        90 Days, Custom Range.
      - Dropdown filters: Shift: All Shifts and Line: All Lines.

3. Restructured Summary Page (3-Column Spacious Grid Layout)

Instead of a single-column vertical stack, the Summary page must present all KPI
cards across a balanced 3-column grid structure.

Grid & Card Spacing Guidelines:

  - Grid Configuration: 3 Columns with generous row and column gaps
    (minimum 24px) to make the dashboard look spacious and breathing.
  - Card Container Spacing: Increase card internal padding (e.g., 20px to 24px
    top/bottom and left/right). Ensure the text, metrics, and sparklines do not
    feel cramped or squeezed.

3-Column KPI Card Distribution:

  - Column 1 (Production & Performance):
    1.  OEE Overview Card: 75% Plant OEE, with green pill badge ▲ +2.1% vs
        prior, blue sparkline, and sub-metrics.
    2.  Throughput Card: Current throughput units per hour vs. target.
    3.  Cycle Time Card: Current average cycle time vs. takt line.
  - Column 2 (Quality & Efficiency):
    1.  Defect Rate Card: 150 PPM, green pill badge ▲ -70 PPM vs prior, red
        sparkline.
    2.  Rework Rate Card: 2.1% Rework, red pill badge ▼ +0.3% vs prior, orange
        sparkline.
    3.  Scrap Rate / First Pass Yield (FPY) Card: High-level material efficiency
        summary.
  - Column 3 (Maintenance & Operations):
    1.  Total Downtime Card: 11.2h This period, red pill badge ▼ +0.8h vs prior,
        orange/yellow sparkline.
    2.  WIP Levels Card: Work-In-Progress stock level summary.
    3.  Inventory/Resource Coverage Card: Raw materials and safety stock levels.

4. Summary Card Interaction Spec (Accordion Grid Shift)

  - Click Action: Clicking on any of the four primary summary cards (OEE, Total
    Downtime, Defect Rate, or Rework Rate) triggers a smooth vertical expansion.
  - Visual Change: The small sparkline transitions into a detailed chart (e.g.,
    Donut chart for downtime, progress gauges for OEE, or line charts for
    defects).
  - Layout Shift: The 3-column grid adapts using Auto-Layout, pushing the cards
    beneath the expanded element downwards cleanly, while maintaining the
    balanced three-column spacing.
  - Collapse Action: A clean, subtle collapse button is available inside the
    expanded card to return the grid back to its default layout.
