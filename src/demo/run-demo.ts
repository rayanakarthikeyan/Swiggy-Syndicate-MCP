import { SwiggyMcpClient } from "../client/swiggy-mcp-client";
import { GroupConstraintOptimizer } from "../engine/constraint-optimizer";
import { GroupBillSplitter } from "../engine/bill-splitter";
import { GroupOrderRequirements } from "../types/group";

async function runInteractiveDemo() {
  console.log("\n=======================================================");
  console.log("   SWIGGY SYNDICATE: Autonomous Group Ordering Agent   ");
  console.log("   Compliant with Swiggy Builders Club MCP Standard    ");
  console.log("======================================================\n");

  const client = new SwiggyMcpClient();
  const optimizer = new GroupConstraintOptimizer(client);

  const meetingRequirements: GroupOrderRequirements = {
    orderTitle: "Product and Eng Strategy Lunch",
    addressId: "addr_koramangala_techpark",
    targetDeliveryMinutes: 35,
    overallBudget: 3000,
    participants: [
      {
        id: "p_rahul",
        name: "Rahul Sharma (VP Eng)",
        diet: "NON_VEG",
        maxBudget: 400,
        specificDish: "Chicken Biryani"
      },
      {
        id: "p_priya",
        name: "Priya Nair (Principal PM)",
        diet: "VEG",
        maxBudget: 350,
        specificDish: "Paneer"
      },
      {
        id: "p_vikram",
        name: "Vikram Mehta (Staff SRE)",
        diet: "NON_VEG",
        maxBudget: 400
      },
      {
        id: "p_ananya",
        name: "Ananya Iyer (UX Design Lead)",
        diet: "VEGAN",
        maxBudget: 350
      },
      {
        id: "p_darshan",
        name: "Darshan Jain (Finance Analyst)",
        diet: "JAIN",
        maxBudget: 320
      },
      {
        id: "p_tanvi",
        name: "Tanvi Joshi (Frontend Dev)",
        diet: "VEG",
        maxBudget: 250
      }
    ]
  };

  console.log("[AGENT REASONING] Analyzing meeting request for " + meetingRequirements.participants.length + " attendees:");
  for (const p of meetingRequirements.participants) {
    console.log("  * " + p.name + ": " + p.diet + " (Cap: INR " + p.maxBudget + (p.specificDish ? ", craving: " + p.specificDish : "") + ")");
  }

  console.log("\n[STEP 1] Querying Swiggy Food Collection & Restaurants matching constraints...");
  const plan = await optimizer.optimizeGroupOrder(meetingRequirements);
  console.log("  Selected Restaurant: " + plan.restaurantName + " (" + plan.areaName + ")");
  console.log("  Rating: " + plan.avgRating + " | Delivery SLA: " + plan.deliveryTimeMinutes + " mins");
  console.log("  Items Allocated per Attendee:");
  for (const item of plan.assignedItems) {
    const vegStatus = item.isVeg ? "[VEG]" : "[ON-VEG]";
    console.log("    - " + item.participantName + " -> " + vegStatus + " " + item.itemName + " [INR " + item.price + "] (" + item.matchedPreferenceReason + ")");
  }

  console.log("\n[STEP 2] Calling Swiggy update_food_cart tool with consolidated SKUs...");
  const cartItemMap: Record<string, number> = {};
  for (const item of plan.assignedItems) {
    cartItemMap[item.menuItemId] = (cartItemMap[item.menuItemId] || 0) + item.quantity;
  }
  const cartItemsPayload = Object.entries(cartItemMap).map(([menu_item_id, quantity]) => ({
    menu_item_id,
    quantity
  }));

  const cartRes = await client.updateFoodCart({
    addressId: meetingRequirements.addressId,
    restaurantId: plan.restaurantId,
    restaurantName: plan.restaurantName,
    cartItems: cartItemsPayload
  });

  const liveCart = cartRes.data!.data!;
  console.log("  Swiggy Cart ID: " + liveCart.cart_id);
  console.log("  Total Items: " + liveCart.item_count);
  console.log("  Item Total: INR " + liveCart.pricing?.item_total);
  console.log("  Delivery and Taxes: INR " + ((liveCart.pricing?.delivery_charge || 0) + (liveCart.pricing?.taxes_and_charges || 0)));
  console.log("  New Cart Payable Total (to_pay): INR " + liveCart.pricing?.to_pay);

  console.log("\n[STEP 3] Autonomous Bill Split & UPI Reimbursement Generation...");
  const billSplit = GroupBillSplitter.computeSplit({
    cartData: liveCart,
    assignedItems: plan.assignedItems,
    hostUpiVpa: "host.swiggy@oksbi"
  });

  console.log("\n" + billSplit.formattedSummary);
  console.log("======================================================");
  console.log(" Demo completed successfully with 100% Swiggy MCP compliance!");
  console.log("======================================================\n");
}

runInteractiveDemo().catch(console.error);
