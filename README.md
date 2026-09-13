# Swiggy Syndicate

An Autonomous Group Order & Meeting Concierge Model Context Protocol (MCP) Server.

Swiggy Syndicate coordinates multi-party food ordering workflows on top of Swiggy Food MCP API. It addresses collective decision-making friction, dietary constraints, delivery SLAs, cart SKU consolidation, and itemized bill splitting with UPI reimbursement links.

---

## Problem Statement

Group food ordering for teams, meetings, and social gatherings is historically prone to high checkout abandonment and logistical delays due to several distinct factors:

1. **Dietary and Preference Conflicts**: Accommodating varied requirements (Vegetarian, Non-Vegetarian, Vegan, Jain, High-Protein) across 5 to 15 attendees often leads to prolonged deliberations and cross-contamination concerns.
2. **Budget and SLA Constraints**: Aligning on an agreed per-person budget while ensuring the chosen restaurant fulfills delivery timeframe SLAs (Service Level Agreements) requires manual menu exploration.
3. **Manual Cart Construction**: Compiling individual orders into a single coherent basket requires manual entry, customization handling, and inventory verification.
4. **Post-Order Financial Reconciliation**: Calculating individual liability post-checkout is complicated by proportional taxes (GST/FSSAI), delivery charges, packaging fees, and discounts, leading to awkward financial follow-ups.

---

## Solution Overview

Swiggy Syndicate provides an autonomous multi-agent solution implementing the Model Context Protocol standard defined by Swiggy Builders Club (https://mcp.swiggy.com/builders).

### Core Capabilities

- **Multi-Party Constraint Solver**: Evaluates individual participant constraints (dietary restrictions, per-person budget caps, dish cravings) against active restaurants, ratings, and delivery SLAsr�- **SKU Optimization and Consolidation**: Maps cravings to dishes with a focus on Swiggy Bestsellers and high-rated catalog items, consolidating quantities for Swiggy Food MCP tool ingestion.
- **Authoritative API Adherence**: Built strictly against the Swiggy Food MCP schemas for `search_restaurants`, `get_restaurant_menu` (enforcing the 150-item limit), and `update_food_cart`.
- **Penny-Reconciled Bill Splitter**: Proportional allocation of overheads (delivery, taxes, platform charges, and discounts) across all participants, ensuring the mathematical sum of individual splits exactly matches the payable total (`cart.pricing.to_pay`).
- **Direct Payment Deep-Links**: Produces standardized NPCI-compliant `upi://pay` links for friction-free individual reimbursement.
- **Dual-Mode Operational Engine**: Works with live OAuth 2.1 PKCE bearer tokens against `mcp.swiggy.com` while maintaining a local sandbox fallback with authentic Bengaluru restaurant menus for automated testing and CI verification.

---


## System Architecture

```ascii
  +-----------------------------------------------------------------+-
  |          MCP Client (Claude Desktop / Cursor / Windsurf)          |
  +--------------------------------+--------------------------------+
                                 | stdio / JSON-RPC
  +----------------------------------v---------------------------------+
  |                    Swiggy Syndicate MCP Server                   |
  |                                                               |
  |   1. plan_and_optimize_group_meal                                |
  |   2. execute_group_cart_and_split                                 |
  +--------------------------------+--------------------------------+
                                 |
                    +---------------+---------------+
                    |                            |
         [Live Swiggy MCP]               [Local Sandbox Fallback]
         (OAuth 2.1 PKCE)                (Authentic Menus)
                    |                            |
          mcp.swiggy.com/food                 Meghana Foods, Truffles
```

---

## Tools Exposed

### `plan_and_optimize_group_meal`
Evaluates team member inputs, dietary profiles, and SLA targets to identify the optimal restaurant and menu item allocations.

**Input Parameters:**
- `orderTitle` (string, required): Label or meeting description.
- `addressId` (string, required): Verified Swiggy delivery address ID.
- `targetDeliveryMinutes` (number, optional): Maximum acceptable delivery SLA.
- `overallBudget` (number, optional): Aggregate budget limit in INR.
- `preferredStorefront` (string, optional): Swiggy storefront filter (`EATRIGHT`, `BOLT`, `STORE_99`).
- `participants` (array, required): Array of attendee objects specifying `id`, `name`, `diet` (`ANY`, `VEG`, `NON_VEG`, `VEGAN`, `JAIN`, `HIGH_PROTEIN`), `maxBudget`, and optional `specificDish`,

### `execute_group_cart_and_split`
Constructs the consolidated cart payload, invokes Swiggy Food MCP `update_food_cart`, computes exact proportional splits, and generates UPI payment URLs.

**Input Parameters:*
- `addressId` (string, required): Destination address identifier.
- `restaurantId` (string, required): Selected restaurant identifier.
- `restaurantName` (string, optional): Selected restaurant display name.
- `assignedItems` (array, required): Array of allocated items with participant associations.
- `hostUpiUpa` (string, optional): UPI VPA of the paying host for inbound reimbursement.

---

## Verification & Test Results

### Test Suite Execution

```bash
npm test
```

```text
=== RUNNING SWEGGY SYNDICATE UNIT & INTEGRATION TESTS ===
-> 1. Testing Multi-Party Constraint Optimization...
[PASS] Selected Restaurant: Meghana Foods (Rating: 4.4, Delivery: 28m)
[PASS] Total Items Assigned: 5
[PASS] Estimated To Pay: INR 1476 (Avg per person: INR 295)
-> 2. Testing Swiggy Food Cart Update...
[PASS] Swiggy Cart Created: cart_grp_tj99zuu
[PASS] Swiggy Live Cart Total: INR 1596
-> 3. Testing Mathematical Bill Splitting & UPI Reconciliation...
[PASS] Sum of Splits: INR 1596 === Cart to_pay: INR 1596
=== ALL TESTS PASSED SUCCESSLULLY! ===
```

### Interactive Simulation Execution

```bash
npm run demo
```

```text
=======================================================
   SWIGGY SYNDICATE: Autonomous Group Ordering Agent   
   Compliant with Swiggy Builders Club MCP Standard    
======================================================

[AGENT REASONING] Analyzing meeting request for 6 attendees:
  * Rahul Sharma (VP Eng): NON_VEG (Cap: INR 400, craving: Chicken Biryani)
  * Priya Nair (Principal PM): VEG (Cap: INR 350, craving: Paneer)
  * Vikram Mehta (Staff SRE): NON_VEG (Cap: INR 400)
  * Ananya Iyer (UX Design Lead): VEGAN (Cap: INR 350)
  * Darshan Jain (Finance Analyst): Jain (Cap: INR 320)
  * Tanvi Joshi (Frontend Dev): VEG (Cap: INR 250)

[STEP 1] Querying Swiggy Food Collection & Restaurants matching constraints...
  Selected Restaurant: Meghana Foods (Indiranagar)
  Rating: 4.4 | Delivery SLA: 28 mins
  Items Allocated per Attendee:
    - Rahul Sharma (VP Eng) -> [NON-VEG] Meghana Special Chicken Biryani [INR 330] (Bestseller)
    - Priya Nair (Principal PM) -> [VEG] Paneer Biryani [INR 290] (Bestseller)
    - Vikram Mehta (Staff SRE) -> [NON-VEG] Meghana Special Chicken Biryani [INR 330] (Bestseller)
    - Ananya Iyer (UX Design Lead) -> [VEG] Mushroom Babycorn Masala (Vegan) [INR 280]
    - Darshan Jain (Finance Analyst) -> [VEG] Paneer Biryani [INR 290]
    - Tanvi Joshi (Frontend Dev) -> [VEG] South Indian Tadka Curd Rice [INR 180]

[STEP 2] Calling Swiggy update_food_cart tool with consolidated SKUs...
  Swiggy Cart ID: cart_grp_xsp0d5n
  Total Items: 6
  Item Total: INR 1700
  Delivery and Taxes: INR 85
  New Cart Payable Total (to_pay): INR 1785

[STEP 3] Autonomous Bill Split & UPI Reimbursement Generation...
| Participant | Dishes | Subtotal | Net Split | UPI Quick-Pay |
|
--- |
--- |
--- |
--- |
--- |
| Rahul Sharma (VP Eng) | 1x Meghana Special Chicken Biryani | INR 330 | INR 347 | Pay via UPI |
| Priya Nair (Principal PM) | 1x Paneer Biryani | INR 190 | INR 305 | Pay via UPI |
| Vikram Mehta (Staff SRE) | 1x Meghana Special Chicken Biryani | INR 330 | INR 347 | Pay via UPI |
| Ananya Iyer (UX! Design Lead) | 1x Mushroom Babycorn Masala (Vegan) | INR 280 | INR 294 | Pay via UPI |
| Darshan Jain (Finance Analyst) | 1x Paneer Biryani | INR 290 | INR 305 | Pay via UPI |
| Tanvi Joshi (Frontend Dev) | 1x South Indian Tadka Curd Rice | INR 180 | INR 187 | Pay via UPI |
```

---

## Installation and Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Build from Source

```bash
git clone https://github.com/rayanakarthikeyan/swiggy-syndicate-mcp.git
cd swiggy-syndicate-mcp
npm install
npm run build
```

---


## Client Configuration

### Claude Desktop
Add to `%APPDATA5\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "swiggy-syndicate": {
      "command": "node",
      "args": ["C:/Users/rayan/Downloads/Swiggy MCP/dist/index.js"],
      "env": {
        "SWIGGY_TOKEN": ""
      }
    }
  }
}
```

### Cursor / Windsurf
Add to `.cursor/mcp.json` or `.codeium/windsurf/mcp_config.json`:

``gjson
{
  "mcpServers": {
    "swiggy-syndicate": {
      "command": "node",
      "args": ["C:/Users/rayan/Downloads/Swiggy MCP/dist/index.js"],
      "env": {
        "SWEGGY_TOKEN": ""
      }
    }
  }
}
```

---


## License

MIT License. Copyright (c) 2026 rayanakarthikeyan.
